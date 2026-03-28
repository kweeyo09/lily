import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

/* ─────────────────────────────────────────────────────────────
   百合 · Lily Particle Bloom
   Design: ink-dark background, texture-sampled particle colours,
   very soft glow halo (no blown-out white), slow rotation,
   MediaPipe hand gesture scatter / gather.
───────────────────────────────────────────────────────────── */

declare global {
  interface Window {
    Hands: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
    HAND_CONNECTIONS: any;
  }
}

/* ═══════════════════════════════════════════
   CONFIG
═══════════════════════════════════════════ */
const CFG = {
  particleCount: 55000,
  scatterRadius: 13,
  floatAmp:      0.055,
  floatSpeed:    0.50,
  rotSpeed:      0.0011,
  lerpGather:    0.040,
  lerpScatter:   0.026,
  modelScale:    9,
  baseSize:      0.90,
};

/* ═══════════════════════════════════════════
   SHADERS
   - colour from per-particle aColor (texture-sampled)
   - soft single-layer halo, brightness ≤ 1.25
   - no additive colour shift on scatter
═══════════════════════════════════════════ */
const VERT = /* glsl */`
  precision highp float;

  uniform float uTime;
  uniform float uProgress;
  uniform float uSize;

  attribute vec3  aOrigin;
  attribute vec3  aScatter;
  attribute float aPhase;
  attribute float aSizeMul;
  attribute vec3  aColor;

  varying float vAlpha;
  varying vec3  vColor;

  float hash(float n){ return fract(sin(n)*43758.5453); }
  float noise3(vec3 p){
    vec3 i=floor(p); vec3 f=fract(p);
    f=f*f*(3.0-2.0*f);
    float n2=i.x+i.y*57.0+i.z*113.0;
    return mix(
      mix(mix(hash(n2),hash(n2+1.),f.x),mix(hash(n2+57.),hash(n2+58.),f.x),f.y),
      mix(mix(hash(n2+113.),hash(n2+114.),f.x),mix(hash(n2+170.),hash(n2+171.),f.x),f.y),f.z);
  }

  void main(){
    float ft = uTime * ${CFG.floatSpeed.toFixed(3)} + aPhase;
    float fa = ${CFG.floatAmp.toFixed(3)} * (1.0 - uProgress);
    float nx = noise3(aOrigin*0.8+vec3(ft*0.7,0.,0.))-0.5;
    float ny = noise3(aOrigin*0.8+vec3(0.,ft*0.6,0.3))-0.5;
    float nz = noise3(aOrigin*0.8+vec3(0.5,0.,ft*0.5))-0.5;
    vec3 floatOff = vec3(nx,ny,nz)*fa*2.0;

    float p  = uProgress;
    float ep = p<0.5 ? 2.*p*p : 1.-pow(-2.*p+2.,2.)*0.5;

    vec3 pos = aOrigin + floatOff + aScatter*ep;

    float baseAlpha = 0.80 + 0.20*(noise3(aOrigin*1.2+ft*0.3));
    vAlpha = mix(baseAlpha, 1.0-ep*0.88, ep);

    /* keep texture colour; very slight cool tint only at scatter */
    vColor = mix(aColor, aColor*0.85+vec3(0.05,0.08,0.12), ep*0.35);

    float sz = uSize * aSizeMul * (1.0 - ep*0.50);
    vec4 mv  = modelViewMatrix * vec4(pos,1.0);
    gl_PointSize = sz*(300.0/-mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */`
  precision highp float;
  varying float vAlpha;
  varying vec3  vColor;

  void main(){
    float r = distance(gl_PointCoord, vec2(0.5));
    if(r > 0.5) discard;

    /* sharp core + very dim halo — no blow-out */
    float core = smoothstep(0.5, 0.05, r);
    float halo = smoothstep(0.5, 0.20, r) * 0.18;
    float mask = core + halo;

    /* 0.95 base + 0.30 centre lift = max 1.25× — preserves hue */
    vec3 col = vColor * (0.95 + core * 0.30);

    gl_FragColor = vec4(col, mask * vAlpha);
  }
`;

/* ═══════════════════════════════════════════
   TEXTURE COLOUR SAMPLER
═══════════════════════════════════════════ */
interface TexSampler { data: Uint8ClampedArray; w: number; h: number }

function buildTextureSampler(texture: THREE.Texture | null): TexSampler | null {
  if (!texture?.image) return null;
  const img = texture.image as HTMLImageElement;
  const oc  = document.createElement("canvas");
  oc.width  = Math.min(img.naturalWidth  || img.width  || 512, 512);
  oc.height = Math.min(img.naturalHeight || img.height || 512, 512);
  const ctx = oc.getContext("2d")!;
  ctx.drawImage(img, 0, 0, oc.width, oc.height);
  const data = ctx.getImageData(0, 0, oc.width, oc.height).data;
  return { data, w: oc.width, h: oc.height };
}

function sampleColor(
  ts: TexSampler | null, u: number, v: number,
  out: Float32Array, idx: number
) {
  if (!ts) {
    out[idx] = 0.96; out[idx+1] = 0.80; out[idx+2] = 0.82; return;
  }
  const px = Math.floor(((u % 1 + 1) % 1) * ts.w) | 0;
  const py = Math.floor(((1 - ((v % 1 + 1) % 1))) * ts.h) | 0;
  const i  = (py * ts.w + px) * 4;
  out[idx]   = ts.data[i]   / 255;
  out[idx+1] = ts.data[i+1] / 255;
  out[idx+2] = ts.data[i+2] / 255;
}

/* ═══════════════════════════════════════════
   INJECT SCRIPT HELPER
═══════════════════════════════════════════ */
function addScript(src: string): Promise<void> {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
    const s = document.createElement("script");
    s.src = src; s.crossOrigin = "anonymous";
    s.onload = () => res();
    s.onerror = () => rej(new Error(`Failed: ${src}`));
    document.head.appendChild(s);
  });
}

/* ═══════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════ */
export default function Home() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let rafId = 0;
    const cleanupRef = { current: null as (() => void) | null };

    (async () => {
      await addScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js");
      await addScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
      await addScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js");
      if (cancelled || !mountRef.current) return;

      /* ── scene / camera / renderer ── */
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x020208);

      const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 1000);
      camera.position.set(0, 0, 20);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(innerWidth, innerHeight);
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      mountRef.current.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.minDistance = 4;
      controls.maxDistance = 40;
      controls.target.set(0, 0, 0);
      camera.lookAt(0, 0, 0);
      controls.update();

      const onResize = () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
      };
      window.addEventListener("resize", onResize);

      /* ── state ── */
      let particleSystem: THREE.Points | null = null;
      let targetProgress  = 0.0;
      let currentProgress = 0.0;

      /* ── load model ── */
      const setDetail = (msg: string) => {
        const el = document.getElementById("loading-detail");
        if (el) el.textContent = msg;
      };

      const loader = new GLTFLoader();
      loader.load(
        "https://d2xsxph8kpxj0f.cloudfront.net/310519663487115720/ejiFnRLP6xDAMjzum8YmMk/baihe_40dd7c52.glb",
        (gltf) => {
          setDetail("Extracting geometry…");
          const geometries: THREE.BufferGeometry[] = [];
          let textureMap: THREE.Texture | null = null;

          gltf.scene.updateMatrixWorld(true);
          gltf.scene.traverse((child) => {
            if (!(child as THREE.Mesh).isMesh) return;
            const mesh = child as THREE.Mesh;
            const g = mesh.geometry.clone();
            g.applyMatrix4(mesh.matrixWorld);
            g.computeVertexNormals();
            if (!g.attributes.uv) {
              g.setAttribute("uv", new THREE.BufferAttribute(
                new Float32Array(g.attributes.position.count * 2), 2));
            }
            geometries.push(g);
            const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
            const stdMat = mat as THREE.MeshStandardMaterial;
            if (stdMat.map && !textureMap) {
              textureMap = stdMat.map;
              textureMap.flipY = false;
            }
          });

          if (!geometries.length) { setDetail("No meshes found!"); return; }

          setDetail("Merging & scaling…");
          const merged = BufferGeometryUtils.mergeGeometries(geometries);
          merged.center();
          const box  = new THREE.Box3().setFromBufferAttribute(merged.attributes.position as THREE.BufferAttribute);
          const size = box.getSize(new THREE.Vector3());
          const s    = CFG.modelScale / Math.max(size.x, size.y, size.z);
          merged.scale(s, s, s);

          setDetail("Sampling surface…");
          const tempMesh = new THREE.Mesh(merged);
          // MeshSurfaceSampler needs a UV attribute as BufferAttribute
          if (merged.attributes.uv && !(merged.attributes.uv instanceof THREE.BufferAttribute)) {
            const uvAttr = merged.attributes.uv as THREE.InterleavedBufferAttribute;
            const arr = new Float32Array(uvAttr.count * 2);
            for (let k = 0; k < uvAttr.count; k++) {
              arr[k*2]   = uvAttr.getX(k);
              arr[k*2+1] = uvAttr.getY(k);
            }
            merged.setAttribute("uv", new THREE.BufferAttribute(arr, 2));
          }
          const sampler  = new MeshSurfaceSampler(tempMesh).build();
          const texSampler = buildTextureSampler(textureMap);

          const N = CFG.particleCount;
          const positions   = new Float32Array(N * 3);
          const scatterDirs = new Float32Array(N * 3);
          const phases      = new Float32Array(N);
          const sizeMuls    = new Float32Array(N);
          const colors      = new Float32Array(N * 3);

          const _p  = new THREE.Vector3();
          const _n  = new THREE.Vector3();
          // MeshSurfaceSampler in three@0.160 accepts a 3rd Vector2 for UV
          const _uv = new THREE.Vector2();

          setDetail("Generating particles…");
          for (let i = 0; i < N; i++) {
            // Pass _uv as 3rd argument — three@0.160 MeshSurfaceSampler supports it
            (sampler as any).sample(_p, _n, _uv);
            positions[i*3]   = _p.x;
            positions[i*3+1] = _p.y;
            positions[i*3+2] = _p.z;

            sampleColor(texSampler, _uv.x, _uv.y, colors, i * 3);

            const outward = _p.clone().normalize();
            const rand = new THREE.Vector3(
              (Math.random()-0.5)*2, (Math.random()-0.5)*2, (Math.random()-0.5)*2
            ).normalize();
            const dir = outward.lerp(rand, 0.55).normalize();
            const mag = CFG.scatterRadius * (0.4 + Math.random() * 0.6);
            scatterDirs[i*3]   = dir.x * mag;
            scatterDirs[i*3+1] = dir.y * mag;
            scatterDirs[i*3+2] = dir.z * mag;

            phases[i]   = Math.random() * Math.PI * 2;
            sizeMuls[i] = 0.55 + Math.random() * 0.90;
          }

          const geo = new THREE.BufferGeometry();
          geo.setAttribute("aOrigin",  new THREE.BufferAttribute(positions.slice(), 3));
          geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
          geo.setAttribute("aScatter", new THREE.BufferAttribute(scatterDirs, 3));
          geo.setAttribute("aPhase",   new THREE.BufferAttribute(phases, 1));
          geo.setAttribute("aSizeMul", new THREE.BufferAttribute(sizeMuls, 1));
          geo.setAttribute("aColor",   new THREE.BufferAttribute(colors, 3));

          const mat = new THREE.ShaderMaterial({
            uniforms: {
              uTime:     { value: 0 },
              uProgress: { value: 0 },
              uSize:     { value: CFG.baseSize },
            },
            vertexShader:   VERT,
            fragmentShader: FRAG,
            transparent:    true,
            blending:       THREE.AdditiveBlending,
            depthWrite:     false,
          });

          // Compute bounds so frustum culling works correctly
          geo.computeBoundingBox();
          geo.computeBoundingSphere();

          if (particleSystem) scene.remove(particleSystem);
          particleSystem = new THREE.Points(geo, mat);
          particleSystem.frustumCulled = false; // disable culling — bounds can be stale after shader displacement
          scene.add(particleSystem);

          setDetail("Ready!");
          setTimeout(() => {
            const ld = document.getElementById("loading-screen");
            if (ld) { ld.style.opacity = "0"; setTimeout(() => ld.remove(), 800); }
          }, 300);
          const gl = document.getElementById("gesture-label");
          if (gl) gl.textContent = "Show your hand";
        },
        (xhr) => setDetail(`Loading model… ${Math.round(xhr.loaded / xhr.total * 100)}%`),
        (err) => { console.error(err); setDetail("Error loading model."); }
      );

      /* ── MediaPipe ── */
      const videoEl    = document.getElementById("input_video") as HTMLVideoElement;
      const handCanvas = document.getElementById("hand-canvas") as HTMLCanvasElement;
      const hCtx       = handCanvas.getContext("2d")!;
      handCanvas.width  = 200;
      handCanvas.height = 150;

      const pill   = document.getElementById("gesture-pill")!;
      const gIcon  = document.getElementById("gesture-icon")!;
      const gLabel = document.getElementById("gesture-label")!;
      const ringFill = document.getElementById("ring-fill") as unknown as SVGCircleElement | null;
      const CIRC = 150.796;

      const dist2D = (a: {x:number;y:number}, b: {x:number;y:number}) =>
        Math.hypot(a.x - b.x, a.y - b.y);

      const classifyHand = (lm: {x:number;y:number}[]) => {
        const w = lm[0];
        const tips = [8,12,16,20], mcps = [5,9,13,17];
        let closed = 0;
        for (let i = 0; i < 4; i++)
          if (dist2D(lm[tips[i]], w) < dist2D(lm[mcps[i]], w) * 1.15) closed++;
        const thumbClosed = dist2D(lm[4], w) < dist2D(lm[2], w) * 1.1;
        return (closed + (thumbClosed ? 1 : 0)) >= 3 ? "fist" : "open";
      };

      let lastGesture = "none", holdFrames = 0;
      const HOLD = 4;

      const handsMP = new window.Hands({
        locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
      });
      handsMP.setOptions({ maxNumHands:1, modelComplexity:1,
        minDetectionConfidence:0.65, minTrackingConfidence:0.60 });
      handsMP.onResults((results: any) => {
        hCtx.clearRect(0, 0, handCanvas.width, handCanvas.height);
        if (!results.multiHandLandmarks?.length) {
          gIcon.textContent  = "🌸";
          gLabel.textContent = "Show your hand";
          pill.className     = "";
          lastGesture = "none"; holdFrames = 0;
          return;
        }
        const lm = results.multiHandLandmarks[0];
        hCtx.save();
        hCtx.scale(-1,1); hCtx.translate(-handCanvas.width, 0);
        if (window.drawConnectors && window.HAND_CONNECTIONS) {
          window.drawConnectors(hCtx, lm, window.HAND_CONNECTIONS,
            { color:"rgba(255,140,180,0.55)", lineWidth:1.5,
              canvasWidth:handCanvas.width, canvasHeight:handCanvas.height });
          window.drawLandmarks(hCtx, lm,
            { color:"rgba(255,255,255,0.75)", lineWidth:1, radius:2,
              canvasWidth:handCanvas.width, canvasHeight:handCanvas.height });
        }
        hCtx.restore();

        const g = classifyHand(lm);
        if (g === lastGesture) holdFrames++; else { holdFrames = 0; lastGesture = g; }
        if (holdFrames >= HOLD) {
          if (g === "fist") {
            targetProgress = 0.0;
            gIcon.textContent  = "✊";
            gLabel.textContent = "Gather · 汇聚";
            pill.className     = "gather";
          } else {
            targetProgress = 1.0;
            gIcon.textContent  = "🖐";
            gLabel.textContent = "Scatter · 扩散";
            pill.className     = "scatter";
          }
        }
      });

      const camFeed = new window.Camera(videoEl, {
        onFrame: async () => { await handsMP.send({ image: videoEl }); },
        width: 640, height: 480,
      });
      camFeed.start().catch(console.warn);

      /* ── animation loop ── */
      const animate = () => {
        rafId = requestAnimationFrame(animate);
        const t = performance.now() * 0.001;
        if (particleSystem) {
          const speed = targetProgress < currentProgress ? CFG.lerpGather : CFG.lerpScatter;
          currentProgress += (targetProgress - currentProgress) * speed;
          const uniforms = (particleSystem.material as THREE.ShaderMaterial).uniforms;
          uniforms.uTime.value     = t;
          uniforms.uProgress.value = currentProgress;
          particleSystem.rotation.y += CFG.rotSpeed;
          if (ringFill) {
            ringFill.setAttribute("stroke-dashoffset", (CIRC * currentProgress).toFixed(2));
            const ringEl = document.getElementById("progress-ring");
            if (ringEl) ringEl.className = targetProgress < 0.5 ? "gather" : "";
          }
        }
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      cleanupRef.current = () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener("resize", onResize);
        renderer.dispose();
        if (mountRef.current?.contains(renderer.domElement))
          mountRef.current.removeChild(renderer.domElement);
      };
    })();

    return () => { cancelled = true; cleanupRef.current?.(); };
  }, []);

  return (
    <div style={{ width:"100vw", height:"100vh", overflow:"hidden",
      background:"#020208", position:"relative" }}>

      {/* Three.js mount */}
      <div ref={mountRef} style={{ position:"absolute", inset:0 }} />

      {/* Loading screen */}
      <div id="loading-screen" style={{
        position:"fixed", inset:0, background:"#020208",
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        zIndex:999, transition:"opacity 0.8s"
      }}>
        <div style={{
          width:56, height:56, borderRadius:"50%",
          border:"2px solid rgba(255,255,255,0.08)",
          borderTopColor:"#e8a0b8",
          animation:"spin 1s linear infinite", marginBottom:20
        }}/>
        <p style={{ fontSize:12, letterSpacing:"0.3em", color:"rgba(255,255,255,0.4)",
          textTransform:"uppercase", margin:0 }}>Loading Lily</p>
        <p id="loading-detail" style={{ fontSize:11, letterSpacing:"0.2em",
          color:"rgba(220,150,180,0.5)", marginTop:8 }}>Initializing…</p>
      </div>

      {/* Title */}
      <div style={{ position:"absolute", top:28, left:"50%", transform:"translateX(-50%)",
        textAlign:"center", pointerEvents:"none" }}>
        <h1 style={{ fontSize:20, fontWeight:300, color:"rgba(255,255,255,0.80)",
          letterSpacing:"0.45em", textTransform:"uppercase", margin:0 }}>百 合</h1>
        <p style={{ fontSize:10, color:"rgba(220,180,200,0.45)", letterSpacing:"0.3em", marginTop:4 }}>
          Lily · Particle Bloom</p>
      </div>

      {/* Hint */}
      <div style={{ position:"absolute", top:28, left:28, fontSize:10,
        color:"rgba(255,255,255,0.22)", letterSpacing:"0.14em", lineHeight:2,
        pointerEvents:"none" }}>
        Drag to orbit · Scroll to zoom<br/>
        Open palm → scatter · Fist → gather
      </div>

      {/* Camera preview */}
      <div style={{ position:"absolute", top:24, right:24, width:200,
        borderRadius:14, overflow:"hidden",
        border:"1px solid rgba(255,255,255,0.10)",
        boxShadow:"0 4px 24px rgba(0,0,0,0.6)", background:"#000" }}>
        <video id="input_video" playsInline autoPlay muted
          style={{ width:"100%", display:"block", transform:"scaleX(-1)", opacity:0.85 }}/>
        <div style={{ position:"absolute", bottom:0, left:0, right:0,
          background:"rgba(0,0,0,0.55)", fontSize:9, letterSpacing:"0.15em",
          textAlign:"center", padding:"4px 0", color:"rgba(255,255,255,0.4)",
          textTransform:"uppercase" }}>Hand Tracking</div>
      </div>
      <canvas id="hand-canvas" style={{ position:"absolute", top:24, right:24,
        width:200, height:150, borderRadius:14, pointerEvents:"none" }}/>

      {/* Gesture pill */}
      <div id="gesture-pill" style={{ position:"absolute", bottom:32, left:"50%",
        transform:"translateX(-50%)", display:"flex", alignItems:"center", gap:10,
        background:"rgba(0,0,0,0.50)", border:"1px solid rgba(255,255,255,0.10)",
        borderRadius:50, padding:"9px 26px", backdropFilter:"blur(8px)" }}>
        <span id="gesture-icon" style={{ fontSize:24, lineHeight:1 }}>🌸</span>
        <span id="gesture-label" style={{ fontSize:12, fontWeight:500,
          letterSpacing:"0.18em", textTransform:"uppercase",
          color:"rgba(255,255,255,0.75)", minWidth:140, textAlign:"center" }}>
          Initializing…</span>
      </div>

      {/* Progress ring */}
      <div id="progress-ring" style={{ position:"absolute", bottom:24, right:28,
        width:52, height:52 }}>
        <svg viewBox="0 0 56 56" width="52" height="52"
          style={{ transform:"rotate(-90deg)" }}>
          <circle cx="28" cy="28" r="24" fill="none"
            stroke="rgba(255,255,255,0.07)" strokeWidth="3"/>
          <circle id="ring-fill" cx="28" cy="28" r="24" fill="none"
            stroke="#e8a0b8" strokeWidth="3" strokeLinecap="round"
            strokeDasharray="150.796" strokeDashoffset="0"/>
        </svg>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        #gesture-pill.scatter { border-color: rgba(240,100,160,0.55) !important; }
        #gesture-pill.gather  { border-color: rgba(120,200,255,0.55) !important; }
        #gesture-pill.scatter #gesture-label { color: #f07aaa !important; }
        #gesture-pill.gather  #gesture-label { color: #88d4ff !important; }
        #progress-ring.gather #ring-fill     { stroke: #88d4ff !important; }
      `}</style>
    </div>
  );
}

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

/* ─────────────────────────────────────────────────────────────
   百合 · Lily Particle Bloom  (three@0.183 compatible)
   Design: deep-ink background, texture-sampled particle colours,
   subtle glow, noise float, scatter/gather, MediaPipe gestures.
───────────────────────────────────────────────────────────── */

declare global {
  interface Window {
    Hands: any; Camera: any;
    drawConnectors: any; drawLandmarks: any; HAND_CONNECTIONS: any;
  }
}

/* ── CONFIG ─────────────────────────────────────────────────── */
const N_PARTICLES  = 60_000;
const MODEL_SCALE  = 8;          // world-units tall
const SCATTER_R    = 14;
const FLOAT_AMP    = 0.06;
const FLOAT_SPD    = 0.45;
const ROT_SPD      = 0.0012;
const LERP_GATHER  = 0.045;
const LERP_SCATTER = 0.028;
// point size: world-space radius that maps to pixels via projection
const POINT_WS     = 0.055;      // world-space radius of each particle

/* ── VERTEX SHADER ──────────────────────────────────────────── */
const VERT = /* glsl */`
precision highp float;

uniform float uTime;
uniform float uProgress;

attribute vec3  aOrigin;
attribute vec3  aScatter;
attribute float aPhase;
attribute float aSzMul;
attribute vec3  aColor;

varying float vAlpha;
varying vec3  vColor;

float hash(float n){ return fract(sin(n)*43758.5453); }
float noise3(vec3 p){
  vec3 i=floor(p); vec3 f=fract(p); f=f*f*(3.0-2.0*f);
  float n2=i.x+i.y*57.0+i.z*113.0;
  return mix(
    mix(mix(hash(n2),hash(n2+1.),f.x),mix(hash(n2+57.),hash(n2+58.),f.x),f.y),
    mix(mix(hash(n2+113.),hash(n2+114.),f.x),mix(hash(n2+170.),hash(n2+171.),f.x),f.y),f.z);
}

void main(){
  /* smooth-step ease on progress */
  float ep = uProgress < 0.5
    ? 2.0*uProgress*uProgress
    : 1.0 - pow(-2.0*uProgress+2.0,2.0)*0.5;

  /* noise float (only when gathered) */
  float ft = uTime * ${FLOAT_SPD.toFixed(3)} + aPhase;
  float fa = ${FLOAT_AMP.toFixed(3)} * (1.0 - ep);
  vec3 fl  = vec3(
    noise3(aOrigin*0.9+vec3(ft*0.7,0.,0.))-0.5,
    noise3(aOrigin*0.9+vec3(0.,ft*0.6,0.3))-0.5,
    noise3(aOrigin*0.9+vec3(0.5,0.,ft*0.5))-0.5
  ) * fa * 2.0;

  vec3 pos = aOrigin + fl + aScatter * ep;

  /* alpha: full when gathered, fades out when scattered */
  float baseA = 0.82 + 0.18 * noise3(aOrigin*1.3 + ft*0.25);
  vAlpha = mix(baseA, 1.0 - ep * 0.9, ep);

  /* colour: texture colour, slight cool drift on scatter */
  vColor = mix(aColor, aColor*0.82 + vec3(0.04,0.07,0.14), ep*0.4);

  /* ── point size ──────────────────────────────────────────
     Project a world-space sphere of radius POINT_WS to pixels.
     Formula: pixelSize = (POINT_WS / -mv.z) * projectionMatrix[1][1] * viewportH
     We bake viewportH into the uniform via uVpH.
  ─────────────────────────────────────────────────────────── */
  float szW = ${POINT_WS.toFixed(4)} * aSzMul * (1.0 - ep * 0.45);
  vec4 mv   = modelViewMatrix * vec4(pos, 1.0);
  /* projectionMatrix[1][1] = 2*near/(top-bottom) ≈ 1/tan(fov/2) */
  float proj11 = projectionMatrix[1][1];
  gl_PointSize = max(1.0, szW * proj11 * (800.0 / -mv.z));
  gl_Position  = projectionMatrix * mv;
}
`;

/* ── FRAGMENT SHADER ────────────────────────────────────────── */
const FRAG = /* glsl */`
precision highp float;
varying float vAlpha;
varying vec3  vColor;

void main(){
  float r = distance(gl_PointCoord, vec2(0.5));
  if(r > 0.5) discard;

  /* soft disc: bright core, dim halo */
  float core = smoothstep(0.50, 0.04, r);
  float halo = smoothstep(0.50, 0.22, r) * 0.20;
  float mask = core + halo;

  /* slight brightness lift at centre — max 1.3× keeps hue */
  vec3 col = vColor * (0.92 + core * 0.38);
  gl_FragColor = vec4(col, mask * vAlpha);
}
`;

/* ── TEXTURE COLOUR SAMPLER ─────────────────────────────────── */
interface TexSampler { data: Uint8ClampedArray; w: number; h: number }

function buildTexSampler(tex: THREE.Texture | null): TexSampler | null {
  if (!tex?.image) return null;
  const img = tex.image as HTMLImageElement;
  const W = Math.min(img.naturalWidth  || img.width  || 512, 512);
  const H = Math.min(img.naturalHeight || img.height || 512, 512);
  const oc = document.createElement("canvas");
  oc.width = W; oc.height = H;
  const ctx = oc.getContext("2d")!;
  ctx.drawImage(img, 0, 0, W, H);
  return { data: ctx.getImageData(0, 0, W, H).data, w: W, h: H };
}

function sampleColor(ts: TexSampler | null, u: number, v: number, out: Float32Array, i: number) {
  if (!ts) { out[i]=0.97; out[i+1]=0.82; out[i+2]=0.85; return; }
  const px = Math.min(Math.floor(((u%1+1)%1) * ts.w), ts.w-1);
  const py = Math.min(Math.floor(((1-((v%1+1)%1))) * ts.h), ts.h-1);
  const j  = (py * ts.w + px) * 4;
  out[i]   = ts.data[j]   / 255;
  out[i+1] = ts.data[j+1] / 255;
  out[i+2] = ts.data[j+2] / 255;
}

/* ── SCRIPT LOADER ──────────────────────────────────────────── */
function addScript(src: string): Promise<void> {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
    const s = document.createElement("script");
    s.src = src; s.crossOrigin = "anonymous";
    s.onload = () => res();
    s.onerror = () => rej(new Error(`Script failed: ${src}`));
    document.head.appendChild(s);
  });
}

/* ── COMPONENT ──────────────────────────────────────────────── */
export default function Home() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let rafId = 0;
    const cleanupRef = { current: null as (() => void) | null };

    (async () => {
      /* load MediaPipe scripts */
      await addScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js");
      await addScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
      await addScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js");
      if (cancelled || !mountRef.current) return;

      /* ── THREE SETUP ── */
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x020208);

      const W = window.innerWidth, H = window.innerHeight;
      const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 500);
      camera.position.set(0, 0, 22);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      mountRef.current.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.07;
      controls.minDistance = 5;
      controls.maxDistance = 50;
      controls.target.set(0, 0, 0);
      controls.update();

      const onResize = () => {
        const w = window.innerWidth, h = window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", onResize);

      /* ── STATE ── */
      let particles: THREE.Points | null = null;
      let targetProg = 0, curProg = 0;

      /* ── HELPERS ── */
      const setDetail = (msg: string) => {
        const el = document.getElementById("ld-detail");
        if (el) el.textContent = msg;
      };

      /* ── LOAD MODEL ── */
      const loader = new GLTFLoader();
      loader.load(
        "https://d2xsxph8kpxj0f.cloudfront.net/310519663487115720/ejiFnRLP6xDAMjzum8YmMk/baihe_40dd7c52.glb",
        (gltf) => {
          try {
            setDetail("Extracting geometry…");
            const geos: THREE.BufferGeometry[] = [];
            let texMap: THREE.Texture | null = null;

            gltf.scene.updateMatrixWorld(true);
            gltf.scene.traverse((child) => {
              const mesh = child as THREE.Mesh;
              if (!mesh.isMesh) return;
              const g = mesh.geometry.clone();
              g.applyMatrix4(mesh.matrixWorld);
              /* ensure plain BufferAttribute UVs */
              if (g.attributes.uv) {
                const uv = g.attributes.uv;
                if (!(uv instanceof THREE.BufferAttribute)) {
                  const arr = new Float32Array(uv.count * 2);
                  for (let k = 0; k < uv.count; k++) {
                    arr[k*2] = uv.getX(k); arr[k*2+1] = uv.getY(k);
                  }
                  g.setAttribute("uv", new THREE.BufferAttribute(arr, 2));
                }
              } else {
                g.setAttribute("uv", new THREE.BufferAttribute(
                  new Float32Array(g.attributes.position.count * 2), 2));
              }
              geos.push(g);
              const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
              const std = mat as THREE.MeshStandardMaterial;
              if (std?.map && !texMap) { texMap = std.map; texMap.flipY = false; }
            });

            if (!geos.length) { setDetail("No meshes found!"); return; }

            setDetail("Merging geometry…");
            const merged = BufferGeometryUtils.mergeGeometries(geos, false);
            if (!merged) { setDetail("Merge failed!"); return; }
            merged.center();

            /* scale to MODEL_SCALE world-units */
            const box = new THREE.Box3().setFromObject(new THREE.Mesh(merged));
            const sz  = box.getSize(new THREE.Vector3());
            const sc  = MODEL_SCALE / Math.max(sz.x, sz.y, sz.z);
            merged.scale(sc, sc, sc);
            merged.computeBoundingBox();
            merged.computeBoundingSphere();

            setDetail("Sampling surface…");
            const tempMesh = new THREE.Mesh(merged);
            const sampler  = new MeshSurfaceSampler(tempMesh).build();
            const texSamp  = buildTexSampler(texMap);

            const posArr  = new Float32Array(N_PARTICLES * 3);
            const sctArr  = new Float32Array(N_PARTICLES * 3);
            const phArr   = new Float32Array(N_PARTICLES);
            const szArr   = new Float32Array(N_PARTICLES);
            const colArr  = new Float32Array(N_PARTICLES * 3);

            const _p = new THREE.Vector3();
            const _n = new THREE.Vector3();
            const _uv = new THREE.Vector2();

            setDetail("Generating particles…");
            for (let i = 0; i < N_PARTICLES; i++) {
              /* three@0.183 MeshSurfaceSampler.sample(pos, norm, uv) */
              sampler.sample(_p, _n, _uv as any);
              posArr[i*3]   = _p.x;
              posArr[i*3+1] = _p.y;
              posArr[i*3+2] = _p.z;

              sampleColor(texSamp, _uv.x, _uv.y, colArr, i * 3);

              /* scatter direction: mix outward + random */
              const out = _p.clone().normalize();
              const rnd = new THREE.Vector3(
                Math.random()-0.5, Math.random()-0.5, Math.random()-0.5
              ).normalize();
              out.lerp(rnd, 0.6).normalize();
              const mag = SCATTER_R * (0.35 + Math.random() * 0.65);
              sctArr[i*3]   = out.x * mag;
              sctArr[i*3+1] = out.y * mag;
              sctArr[i*3+2] = out.z * mag;

              phArr[i] = Math.random() * Math.PI * 2;
              szArr[i] = 0.5 + Math.random() * 1.0;
            }

            const geo = new THREE.BufferGeometry();
            geo.setAttribute("aOrigin",  new THREE.BufferAttribute(posArr.slice(), 3));
            geo.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
            geo.setAttribute("aScatter", new THREE.BufferAttribute(sctArr, 3));
            geo.setAttribute("aPhase",   new THREE.BufferAttribute(phArr, 1));
            geo.setAttribute("aSzMul",   new THREE.BufferAttribute(szArr, 1));
            geo.setAttribute("aColor",   new THREE.BufferAttribute(colArr, 3));
            geo.computeBoundingBox();
            geo.computeBoundingSphere();

            const mat = new THREE.ShaderMaterial({
              uniforms: {
                uTime:     { value: 0 },
                uProgress: { value: 0 },
              },
              vertexShader:   VERT,
              fragmentShader: FRAG,
              transparent:    true,
              blending:       THREE.AdditiveBlending,
              depthWrite:     false,
            });

            if (particles) scene.remove(particles);
            particles = new THREE.Points(geo, mat);
            particles.frustumCulled = false;
            scene.add(particles);

            setDetail("Ready!");
            setTimeout(() => {
              const ld = document.getElementById("ld-screen");
              if (ld) { ld.style.opacity = "0"; setTimeout(() => ld.remove(), 700); }
            }, 200);
            const gl = document.getElementById("g-label");
            if (gl) gl.textContent = "Show your hand";

          } catch (e) {
            console.error("Particle build error:", e);
            setDetail("Error: " + (e as Error).message);
          }
        },
        (xhr) => {
          if (xhr.total > 0)
            setDetail(`Loading model… ${Math.round(xhr.loaded / xhr.total * 100)}%`);
        },
        (err) => { console.error(err); setDetail("Failed to load model."); }
      );

      /* ── MEDIAPIPE ── */
      const videoEl    = document.getElementById("mp-video") as HTMLVideoElement;
      const handCanvas = document.getElementById("hand-canvas") as HTMLCanvasElement;
      handCanvas.width = 200; handCanvas.height = 150;
      const hCtx = handCanvas.getContext("2d")!;

      const pill   = document.getElementById("g-pill")!;
      const gIcon  = document.getElementById("g-icon")!;
      const gLabel = document.getElementById("g-label")!;
      const ringFill = document.getElementById("ring-fill") as unknown as SVGCircleElement | null;
      const CIRC = 150.796;

      const d2 = (a: {x:number;y:number}, b: {x:number;y:number}) =>
        Math.hypot(a.x-b.x, a.y-b.y);

      const classify = (lm: {x:number;y:number}[]) => {
        const w = lm[0];
        let closed = 0;
        for (const [t, m] of [[8,5],[12,9],[16,13],[20,17]] as [number,number][])
          if (d2(lm[t], w) < d2(lm[m], w) * 1.15) closed++;
        if (d2(lm[4], w) < d2(lm[2], w) * 1.1) closed++;
        return closed >= 3 ? "fist" : "open";
      };

      let lastG = "none", holdF = 0;
      const HOLD = 4;

      const handsMP = new window.Hands({
        locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
      });
      handsMP.setOptions({ maxNumHands:1, modelComplexity:1,
        minDetectionConfidence:0.65, minTrackingConfidence:0.60 });
      handsMP.onResults((res: any) => {
        hCtx.clearRect(0, 0, 200, 150);
        if (!res.multiHandLandmarks?.length) {
          gIcon.textContent="🌸"; gLabel.textContent="Show your hand";
          pill.className=""; lastG="none"; holdF=0; return;
        }
        const lm = res.multiHandLandmarks[0];
        hCtx.save(); hCtx.scale(-1,1); hCtx.translate(-200,0);
        if (window.drawConnectors && window.HAND_CONNECTIONS) {
          window.drawConnectors(hCtx, lm, window.HAND_CONNECTIONS,
            { color:"rgba(255,140,180,0.55)", lineWidth:1.5, canvasWidth:200, canvasHeight:150 });
          window.drawLandmarks(hCtx, lm,
            { color:"rgba(255,255,255,0.75)", lineWidth:1, radius:2, canvasWidth:200, canvasHeight:150 });
        }
        hCtx.restore();
        const g = classify(lm);
        if (g === lastG) holdF++; else { holdF=0; lastG=g; }
        if (holdF >= HOLD) {
          if (g === "fist") {
            targetProg=0; gIcon.textContent="✊"; gLabel.textContent="Gather · 汇聚"; pill.className="gather";
          } else {
            targetProg=1; gIcon.textContent="🖐"; gLabel.textContent="Scatter · 扩散"; pill.className="scatter";
          }
        }
      });

      const camFeed = new window.Camera(videoEl, {
        onFrame: async () => { await handsMP.send({ image: videoEl }); },
        width: 640, height: 480,
      });
      camFeed.start().catch(console.warn);

      /* ── KEYBOARD SHORTCUT (Space = toggle) ── */
      const onKey = (e: KeyboardEvent) => {
        if (e.code === "Space") {
          e.preventDefault();
          targetProg = targetProg < 0.5 ? 1 : 0;
          if (targetProg > 0.5) {
            gIcon.textContent="🖐"; gLabel.textContent="Scatter · 扩散"; pill.className="scatter";
          } else {
            gIcon.textContent="✊"; gLabel.textContent="Gather · 汇聚"; pill.className="gather";
          }
        }
      };
      window.addEventListener("keydown", onKey);

      /* ── ANIMATION LOOP ── */
      const animate = () => {
        rafId = requestAnimationFrame(animate);
        const t = performance.now() * 0.001;
        if (particles) {
          const spd = targetProg < curProg ? LERP_GATHER : LERP_SCATTER;
          curProg += (targetProg - curProg) * spd;
          const u = (particles.material as THREE.ShaderMaterial).uniforms;
          u.uTime.value     = t;
          u.uProgress.value = curProg;
          particles.rotation.y += ROT_SPD;
          if (ringFill) {
            ringFill.setAttribute("stroke-dashoffset", (CIRC * curProg).toFixed(2));
            const re = document.getElementById("progress-ring");
            if (re) re.className = targetProg < 0.5 ? "gather" : "";
          }
        }
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      cleanupRef.current = () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("keydown", onKey);
        renderer.dispose();
        if (mountRef.current?.contains(renderer.domElement))
          mountRef.current.removeChild(renderer.domElement);
      };
    })();

    return () => { cancelled = true; cleanupRef.current?.(); };
  }, []);

  return (
    <div style={{ width:"100vw", height:"100vh", overflow:"hidden",
      background:"#020208", position:"relative", fontFamily:"system-ui,sans-serif" }}>

      {/* Three.js mount */}
      <div ref={mountRef} style={{ position:"absolute", inset:0 }} />

      {/* Loading screen */}
      <div id="ld-screen" style={{
        position:"fixed", inset:0, background:"#020208",
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        zIndex:999, transition:"opacity 0.7s ease"
      }}>
        <div className="ld-spinner" />
        <p style={{ fontSize:11, letterSpacing:"0.35em", color:"rgba(255,255,255,0.38)",
          textTransform:"uppercase", margin:0 }}>Loading Lily</p>
        <p id="ld-detail" style={{ fontSize:10, letterSpacing:"0.2em",
          color:"rgba(220,150,180,0.45)", marginTop:7 }}>Initializing…</p>
      </div>

      {/* Title */}
      <div style={{ position:"absolute", top:26, left:"50%", transform:"translateX(-50%)",
        textAlign:"center", pointerEvents:"none", zIndex:10 }}>
        <h1 style={{ fontSize:19, fontWeight:300, color:"rgba(255,255,255,0.82)",
          letterSpacing:"0.48em", textTransform:"uppercase", margin:0 }}>百 合</h1>
        <p style={{ fontSize:10, color:"rgba(220,180,200,0.42)", letterSpacing:"0.3em", marginTop:4 }}>
          Lily · Particle Bloom</p>
      </div>

      {/* Hint */}
      <div style={{ position:"absolute", top:26, left:26, fontSize:10,
        color:"rgba(255,255,255,0.20)", letterSpacing:"0.14em", lineHeight:2.1,
        pointerEvents:"none", zIndex:10 }}>
        Drag to orbit · Scroll to zoom<br/>
        Open palm → scatter · Fist → gather<br/>
        Space → toggle
      </div>

      {/* Camera preview */}
      <div style={{ position:"absolute", top:22, right:22, width:200,
        borderRadius:13, overflow:"hidden",
        border:"1px solid rgba(255,255,255,0.09)",
        boxShadow:"0 4px 24px rgba(0,0,0,0.65)", background:"#000", zIndex:10 }}>
        <video id="mp-video" playsInline autoPlay muted
          style={{ width:"100%", display:"block", transform:"scaleX(-1)", opacity:0.82 }}/>
        <div style={{ position:"absolute", bottom:0, left:0, right:0,
          background:"rgba(0,0,0,0.55)", fontSize:9, letterSpacing:"0.15em",
          textAlign:"center", padding:"4px 0", color:"rgba(255,255,255,0.38)",
          textTransform:"uppercase" }}>Hand Tracking</div>
      </div>
      <canvas id="hand-canvas" style={{ position:"absolute", top:22, right:22,
        width:200, height:150, borderRadius:13, pointerEvents:"none", zIndex:11 }}/>

      {/* Gesture pill */}
      <div id="g-pill" style={{ position:"absolute", bottom:30, left:"50%",
        transform:"translateX(-50%)", display:"flex", alignItems:"center", gap:10,
        background:"rgba(0,0,0,0.48)", border:"1px solid rgba(255,255,255,0.09)",
        borderRadius:50, padding:"9px 26px", backdropFilter:"blur(8px)", zIndex:10 }}>
        <span id="g-icon" style={{ fontSize:24, lineHeight:1 }}>🌸</span>
        <span id="g-label" style={{ fontSize:12, fontWeight:500,
          letterSpacing:"0.18em", textTransform:"uppercase",
          color:"rgba(255,255,255,0.72)", minWidth:140, textAlign:"center" }}>
          Initializing…</span>
      </div>

      {/* Progress ring */}
      <div id="progress-ring" style={{ position:"absolute", bottom:22, right:26,
        width:50, height:50, zIndex:10 }}>
        <svg viewBox="0 0 56 56" width="50" height="50"
          style={{ transform:"rotate(-90deg)" }}>
          <circle cx="28" cy="28" r="24" fill="none"
            stroke="rgba(255,255,255,0.06)" strokeWidth="3"/>
          <circle id="ring-fill" cx="28" cy="28" r="24" fill="none"
            stroke="#e8a0b8" strokeWidth="3" strokeLinecap="round"
            strokeDasharray="150.796" strokeDashoffset="0"/>
        </svg>
      </div>

      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        .ld-spinner {
          width:52px; height:52px; border-radius:50%;
          border:2px solid rgba(255,255,255,0.07);
          border-top-color:#e8a0b8;
          animation:spin 1s linear infinite;
          margin-bottom:18px;
        }
        #g-pill.scatter { border-color:rgba(240,100,160,0.55)!important; }
        #g-pill.gather  { border-color:rgba(120,200,255,0.55)!important; }
        #g-pill.scatter #g-label { color:#f07aaa!important; }
        #g-pill.gather  #g-label { color:#88d4ff!important; }
        #progress-ring.gather #ring-fill { stroke:#88d4ff!important; }
      `}</style>
    </div>
  );
}

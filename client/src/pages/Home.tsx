import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/* ─────────────────────────────────────────────────────────────
   百合 · Lily Particle Bloom  (three@0.183)

   COLOUR STRATEGY:
   The GLB is a photogrammetry scan with colours baked into the
   mesh in one of two ways (we try both, in order):
     1. geometry.attributes.color  — direct per-vertex RGB
     2. UV + diffuse texture map   — barycentric UV interpolation
        drawn onto OffscreenCanvas, then sampled per particle

   This gives the exact colours visible in Blender / the original
   model, without any brightness multiplication or blending tricks.
───────────────────────────────────────────────────────────── */

declare global {
  interface Window {
    Hands: any; Camera: any;
    drawConnectors: any; drawLandmarks: any; HAND_CONNECTIONS: any;
  }
}

/* ── CONFIG ─────────────────────────────────────────────────── */
const N_PARTICLES  = 60_000;
const MODEL_SCALE  = 9;
const SCATTER_R    = 15;
const FLOAT_AMP    = 0.045;
const FLOAT_SPD    = 0.35;
const ROT_SPD      = 0.0010;
const LERP_GATHER  = 0.048;
const LERP_SCATTER = 0.026;
const POINT_WS     = 0.052;

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
  float ep = uProgress < 0.5
    ? 2.0*uProgress*uProgress
    : 1.0 - pow(-2.0*uProgress+2.0,2.0)*0.5;

  float ft = uTime * ${FLOAT_SPD.toFixed(3)} + aPhase;
  float fa = ${FLOAT_AMP.toFixed(3)} * (1.0 - ep);
  vec3 fl  = vec3(
    noise3(aOrigin*0.9+vec3(ft*0.7,0.,0.))-0.5,
    noise3(aOrigin*0.9+vec3(0.,ft*0.6,0.3))-0.5,
    noise3(aOrigin*0.9+vec3(0.5,0.,ft*0.5))-0.5
  ) * fa * 2.0;

  vec3 pos = aOrigin + fl + aScatter * ep;

  float baseA = 0.78 + 0.18 * noise3(aOrigin*1.3 + ft*0.25);
  vAlpha = mix(baseA, 1.0 - ep * 0.95, ep);

  /* exact texture colour — faint cool drift only on scatter */
  vColor = mix(aColor, aColor * 0.82 + vec3(0.01,0.02,0.06), ep * 0.30);

  float szW = ${POINT_WS.toFixed(4)} * aSzMul * (1.0 - ep * 0.40);
  vec4 mv   = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = max(1.0, szW * projectionMatrix[1][1] * (800.0 / -mv.z));
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

  /* Soft disc — no brightness multiplication, pure sampled colour */
  float core = smoothstep(0.50, 0.08, r);
  float edge = smoothstep(0.50, 0.32, r) * 0.18;
  float mask = core + edge;

  gl_FragColor = vec4(vColor, mask * vAlpha);
}
`;

/* ── TEXTURE CANVAS SAMPLER ─────────────────────────────────── */
interface TexData { data: Uint8ClampedArray; w: number; h: number }

async function buildTexData(tex: THREE.Texture | null): Promise<TexData | null> {
  if (!tex) return null;
  const img = tex.image;
  if (!img) return null;

  const srcW: number = (img as any).naturalWidth ?? (img as any).width ?? 0;
  const srcH: number = (img as any).naturalHeight ?? (img as any).height ?? 0;
  if (srcW === 0 || srcH === 0) return null;

  const W = Math.min(srcW, 1024);
  const H = Math.min(srcH, 1024);

  try {
    if (typeof OffscreenCanvas !== "undefined") {
      const oc = new OffscreenCanvas(W, H);
      const ctx = oc.getContext("2d") as OffscreenCanvasRenderingContext2D | null;
      if (ctx) {
        ctx.drawImage(img as CanvasImageSource, 0, 0, W, H);
        const data = ctx.getImageData(0, 0, W, H).data;
        const ci = (Math.floor(H/2)*W + Math.floor(W/2)) * 4;
        console.log(`[TEX] ${W}×${H} centre=rgb(${data[ci]},${data[ci+1]},${data[ci+2]})`);
        return { data, w: W, h: H };
      }
    }
    const oc2 = document.createElement("canvas");
    oc2.width = W; oc2.height = H;
    const ctx2 = oc2.getContext("2d")!;
    ctx2.drawImage(img as CanvasImageSource, 0, 0, W, H);
    const data2 = ctx2.getImageData(0, 0, W, H).data;
    return { data: data2, w: W, h: H };
  } catch (e) {
    console.warn("[TEX] draw failed:", e);
    return null;
  }
}

function sampleTex(td: TexData, u: number, v: number): [number,number,number] {
  const uu = ((u % 1) + 1) % 1;
  const vv = 1 - ((v % 1) + 1) % 1;
  const px = Math.min(Math.floor(uu * td.w), td.w - 1);
  const py = Math.min(Math.floor(vv * td.h), td.h - 1);
  const j  = (py * td.w + px) * 4;
  return [td.data[j]/255, td.data[j+1]/255, td.data[j+2]/255];
}

/* ── SCRIPT LOADER ──────────────────────────────────────────── */
function addScript(src: string): Promise<void> {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
    const s = document.createElement("script");
    s.src = src; s.crossOrigin = "anonymous";
    s.onload = () => res();
    s.onerror = () => rej(new Error(`Script load failed: ${src}`));
    document.head.appendChild(s);
  });
}

/* ── PARTICLE BUILDER ───────────────────────────────────────── */
interface MeshEntry {
  geo: THREE.BufferGeometry;
  hasVertexColor: boolean;
  tex: TexData | null;
}

async function buildParticleArrays(meshes: MeshEntry[]): Promise<{
  posArr: Float32Array; sctArr: Float32Array;
  phArr: Float32Array;  szArr: Float32Array;
  colArr: Float32Array;
}> {
  const posArr = new Float32Array(N_PARTICLES * 3);
  const sctArr = new Float32Array(N_PARTICLES * 3);
  const phArr  = new Float32Array(N_PARTICLES);
  const szArr  = new Float32Array(N_PARTICLES);
  const colArr = new Float32Array(N_PARTICLES * 3);

  type Tri = {
    /* positions */
    ax:number; ay:number; az:number;
    bx:number; by:number; bz:number;
    cx:number; cy:number; cz:number;
    /* vertex colours (if available) */
    car:number; cag:number; cab:number;
    cbr:number; cbg:number; cbb:number;
    ccr:number; ccg:number; ccb:number;
    hasVC: boolean;
    /* UVs (if no vertex colour) */
    au:number; av:number;
    bu:number; bv:number;
    cu:number; cv:number;
    area: number;
    tex: TexData | null;
  };

  const tris: Tri[] = [];
  let totalArea = 0;

  for (const { geo, hasVertexColor, tex } of meshes) {
    const pos = geo.attributes.position;
    const col = hasVertexColor ? geo.attributes.color : null;
    const uv  = geo.attributes.uv ?? null;
    const idx = geo.index;
    const triCount = idx ? idx.count / 3 : pos.count / 3;

    for (let t = 0; t < triCount; t++) {
      const ia = idx ? idx.getX(t*3)   : t*3;
      const ib = idx ? idx.getX(t*3+1) : t*3+1;
      const ic = idx ? idx.getX(t*3+2) : t*3+2;

      const ax=pos.getX(ia), ay=pos.getY(ia), az=pos.getZ(ia);
      const bx=pos.getX(ib), by=pos.getY(ib), bz=pos.getZ(ib);
      const cx=pos.getX(ic), cy=pos.getY(ic), cz=pos.getZ(ic);

      const ex=bx-ax, ey=by-ay, ez=bz-az;
      const fx=cx-ax, fy=cy-ay, fz=cz-az;
      const area = 0.5 * Math.sqrt(
        (ey*fz-ez*fy)**2 + (ez*fx-ex*fz)**2 + (ex*fy-ey*fx)**2
      );
      if (area < 1e-10) continue;

      // Vertex colours
      const car = col ? col.getX(ia) : 0, cag = col ? col.getY(ia) : 0, cab = col ? col.getZ(ia) : 0;
      const cbr = col ? col.getX(ib) : 0, cbg = col ? col.getY(ib) : 0, cbb = col ? col.getZ(ib) : 0;
      const ccr = col ? col.getX(ic) : 0, ccg = col ? col.getY(ic) : 0, ccb = col ? col.getZ(ic) : 0;

      // UVs
      const au = uv ? uv.getX(ia) : 0, av = uv ? uv.getY(ia) : 0;
      const bu = uv ? uv.getX(ib) : 0, bv = uv ? uv.getY(ib) : 0;
      const cu = uv ? uv.getX(ic) : 0, cv = uv ? uv.getY(ic) : 0;

      tris.push({
        ax,ay,az, bx,by,bz, cx,cy,cz,
        car,cag,cab, cbr,cbg,cbb, ccr,ccg,ccb,
        hasVC: hasVertexColor,
        au,av, bu,bv, cu,cv,
        area, tex
      });
      totalArea += area;
    }
  }

  if (tris.length === 0) {
    console.warn("[SAMPLE] No triangles — fallback pink");
    for (let i = 0; i < N_PARTICLES; i++) {
      colArr[i*3]=0.80; colArr[i*3+1]=0.45; colArr[i*3+2]=0.58;
    }
    return { posArr, sctArr, phArr, szArr, colArr };
  }

  // CDF for area-weighted sampling
  const cdf = new Float64Array(tris.length);
  let acc = 0;
  for (let i = 0; i < tris.length; i++) {
    acc += tris[i].area / totalArea;
    cdf[i] = acc;
  }

  let vcCount = 0, texCount = 0, fallCount = 0;

  for (let i = 0; i < N_PARTICLES; i++) {
    // Pick triangle
    const r = Math.random();
    let lo=0, hi=tris.length-1;
    while (lo < hi) { const mid=(lo+hi)>>1; if (cdf[mid]<r) lo=mid+1; else hi=mid; }
    const tri = tris[lo];

    // Barycentric coords
    const r1 = Math.random(), r2 = Math.random();
    const sqr1 = Math.sqrt(r1);
    const u1 = 1 - sqr1, u2 = sqr1*(1-r2), u3 = sqr1*r2;

    const px = u1*tri.ax + u2*tri.bx + u3*tri.cx;
    const py = u1*tri.ay + u2*tri.by + u3*tri.cy;
    const pz = u1*tri.az + u2*tri.bz + u3*tri.cz;
    posArr[i*3]=px; posArr[i*3+1]=py; posArr[i*3+2]=pz;

    // Colour — prefer vertex colour, fall back to texture UV
    if (tri.hasVC) {
      colArr[i*3]   = u1*tri.car + u2*tri.cbr + u3*tri.ccr;
      colArr[i*3+1] = u1*tri.cag + u2*tri.cbg + u3*tri.ccg;
      colArr[i*3+2] = u1*tri.cab + u2*tri.cbb + u3*tri.ccb;
      vcCount++;
    } else if (tri.tex) {
      const pu = u1*tri.au + u2*tri.bu + u3*tri.cu;
      const pv = u1*tri.av + u2*tri.bv + u3*tri.cv;
      const [cr,cg,cb] = sampleTex(tri.tex, pu, pv);
      colArr[i*3]=cr; colArr[i*3+1]=cg; colArr[i*3+2]=cb;
      texCount++;
    } else {
      colArr[i*3]=0.80; colArr[i*3+1]=0.45; colArr[i*3+2]=0.58;
      fallCount++;
    }

    // Scatter
    const len = Math.sqrt(px*px+py*py+pz*pz) || 1;
    const ox=px/len, oy=py/len, oz=pz/len;
    const rx=(Math.random()-0.5)*2, ry=(Math.random()-0.5)*2, rz=(Math.random()-0.5)*2;
    const rl=Math.sqrt(rx*rx+ry*ry+rz*rz)||1;
    const mx=0.6;
    const sx=ox*(1-mx)+rx/rl*mx, sy=oy*(1-mx)+ry/rl*mx, sz=oz*(1-mx)+rz/rl*mx;
    const sl=Math.sqrt(sx*sx+sy*sy+sz*sz)||1;
    const mag = SCATTER_R * (0.35 + Math.random()*0.65);
    sctArr[i*3]=sx/sl*mag; sctArr[i*3+1]=sy/sl*mag; sctArr[i*3+2]=sz/sl*mag;

    phArr[i] = Math.random() * Math.PI * 2;
    szArr[i] = 0.5 + Math.random() * 1.0;
  }

  const s5 = Array.from({length:5}, (_,k) => {
    const j=k*3;
    return `rgb(${(colArr[j]*255).toFixed(0)},${(colArr[j+1]*255).toFixed(0)},${(colArr[j+2]*255).toFixed(0)})`;
  });
  console.log(`[SAMPLE] tris=${tris.length} vc=${vcCount} tex=${texCount} fall=${fallCount}`);
  console.log('[SAMPLE] first 5:', s5.join('  '));

  return { posArr, sctArr, phArr, szArr, colArr };
}

/* ── COMPONENT ──────────────────────────────────────────────── */
export default function Home() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let rafId = 0;
    let cleanup: (() => void) | null = null;

    (async () => {
      await addScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js");
      await addScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
      await addScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js");
      if (cancelled || !mountRef.current) return;

      /* ── THREE SETUP ── */
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x020208);

      const W = window.innerWidth, H = window.innerHeight;
      const camera = new THREE.PerspectiveCamera(45, W/H, 0.1, 500);
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
        const w=window.innerWidth, h=window.innerHeight;
        camera.aspect=w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h);
      };
      window.addEventListener("resize", onResize);

      let particles: THREE.Points | null = null;
      let targetProg = 0, curProg = 0;

      const setDetail = (msg: string) => {
        const el = document.getElementById("ld-detail");
        if (el) el.textContent = msg;
      };

      /* ── LOAD MODEL ── */
      const loader = new GLTFLoader();
      loader.load(
        "https://d2xsxph8kpxj0f.cloudfront.net/310519663487115720/ejiFnRLP6xDAMjzum8YmMk/baihe_40dd7c52.glb",
        async (gltf) => {
          try {
            setDetail("Extracting meshes…");
            gltf.scene.updateMatrixWorld(true);

            // Scale to MODEL_SCALE
            const box0 = new THREE.Box3().setFromObject(gltf.scene);
            const sz0  = box0.getSize(new THREE.Vector3());
            const sc   = MODEL_SCALE / Math.max(sz0.x, sz0.y, sz0.z);
            gltf.scene.scale.setScalar(sc);
            gltf.scene.updateMatrixWorld(true);

            // Centre
            const box1 = new THREE.Box3().setFromObject(gltf.scene);
            const ctr  = box1.getCenter(new THREE.Vector3());
            gltf.scene.position.sub(ctr);
            gltf.scene.updateMatrixWorld(true);

            const meshNodes: THREE.Mesh[] = [];
            gltf.scene.traverse(child => {
              if ((child as THREE.Mesh).isMesh) meshNodes.push(child as THREE.Mesh);
            });

            console.log(`[LOAD] ${meshNodes.length} mesh(es) found`);

            // Log what colour data is available
            for (const mesh of meshNodes) {
              const g = mesh.geometry;
              const hasVC = !!g.attributes.color;
              const hasUV = !!g.attributes.uv;
              const mat   = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
              const hasTex = !!(mat as THREE.MeshStandardMaterial)?.map;
              console.log(`[MESH] vc=${hasVC} uv=${hasUV} tex=${hasTex} verts=${g.attributes.position.count}`);
            }

            setDetail(`Processing ${meshNodes.length} mesh(es)…`);

            const meshEntries: MeshEntry[] = [];
            for (const mesh of meshNodes) {
              const g = mesh.geometry.clone();
              g.applyMatrix4(mesh.matrixWorld);

              const hasVC = !!g.attributes.color;
              const mat   = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
              const rawTex = (mat as THREE.MeshStandardMaterial)?.map ?? null;
              const tex = hasVC ? null : await buildTexData(rawTex);

              meshEntries.push({ geo: g, hasVertexColor: hasVC, tex });
            }

            setDetail("Generating particles…");
            const { posArr, sctArr, phArr, szArr, colArr } =
              await buildParticleArrays(meshEntries);

            const geo = new THREE.BufferGeometry();
            geo.setAttribute("aOrigin",  new THREE.BufferAttribute(posArr.slice(), 3));
            geo.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
            geo.setAttribute("aScatter", new THREE.BufferAttribute(sctArr, 3));
            geo.setAttribute("aPhase",   new THREE.BufferAttribute(phArr, 1));
            geo.setAttribute("aSzMul",   new THREE.BufferAttribute(szArr, 1));
            geo.setAttribute("aColor",   new THREE.BufferAttribute(colArr, 3));
            geo.computeBoundingBox();
            geo.computeBoundingSphere();

            const mat2 = new THREE.ShaderMaterial({
              uniforms: { uTime:{value:0}, uProgress:{value:0} },
              vertexShader:   VERT,
              fragmentShader: FRAG,
              transparent:    true,
              blending:       THREE.NormalBlending,
              depthWrite:     false,
            });

            if (particles) scene.remove(particles);
            particles = new THREE.Points(geo, mat2);
            particles.frustumCulled = false;
            scene.add(particles);

            setDetail("Ready!");
            setTimeout(() => {
              const ld = document.getElementById("ld-screen");
              if (ld) { ld.style.opacity="0"; setTimeout(()=>ld.remove(), 700); }
            }, 200);
            const gl2 = document.getElementById("g-label");
            if (gl2) gl2.textContent = "Show your hand";

          } catch(e) {
            console.error("Particle build error:", e);
            setDetail("Error: " + (e as Error).message);
          }
        },
        (xhr) => {
          if (xhr.total>0) setDetail(`Loading model… ${Math.round(xhr.loaded/xhr.total*100)}%`);
        },
        (err) => { console.error(err); setDetail("Failed to load model."); }
      );

      /* ── MEDIAPIPE ── */
      const videoEl    = document.getElementById("mp-video") as HTMLVideoElement;
      const handCanvas = document.getElementById("hand-canvas") as HTMLCanvasElement;
      handCanvas.width=200; handCanvas.height=150;
      const hCtx = handCanvas.getContext("2d")!;
      const pill   = document.getElementById("g-pill")!;
      const gIcon  = document.getElementById("g-icon")!;
      const gLabel = document.getElementById("g-label")!;
      const ringFill = document.getElementById("ring-fill") as unknown as SVGCircleElement|null;
      const CIRC = 150.796;

      const d2 = (a:{x:number;y:number}, b:{x:number;y:number}) =>
        Math.hypot(a.x-b.x, a.y-b.y);

      const classify = (lm:{x:number;y:number}[]) => {
        const w=lm[0]; let closed=0;
        for (const [t,m] of [[8,5],[12,9],[16,13],[20,17]] as [number,number][])
          if (d2(lm[t],w) < d2(lm[m],w)*1.15) closed++;
        if (d2(lm[4],w) < d2(lm[2],w)*1.1) closed++;
        return closed>=3 ? "fist" : "open";
      };

      let lastG="none", holdF=0;
      const HOLD=4;

      const handsMP = new window.Hands({
        locateFile:(f:string)=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
      });
      handsMP.setOptions({ maxNumHands:1, modelComplexity:1,
        minDetectionConfidence:0.65, minTrackingConfidence:0.60 });
      handsMP.onResults((res:any) => {
        hCtx.clearRect(0,0,200,150);
        if (!res.multiHandLandmarks?.length) {
          gIcon.textContent="🌸"; gLabel.textContent="Show your hand";
          pill.className=""; lastG="none"; holdF=0; return;
        }
        const lm=res.multiHandLandmarks[0];
        hCtx.save(); hCtx.scale(-1,1); hCtx.translate(-200,0);
        if (window.drawConnectors && window.HAND_CONNECTIONS) {
          window.drawConnectors(hCtx,lm,window.HAND_CONNECTIONS,
            {color:"rgba(255,140,180,0.55)",lineWidth:1.5,canvasWidth:200,canvasHeight:150});
          window.drawLandmarks(hCtx,lm,
            {color:"rgba(255,255,255,0.75)",lineWidth:1,radius:2,canvasWidth:200,canvasHeight:150});
        }
        hCtx.restore();
        const g=classify(lm);
        if (g===lastG) holdF++; else { holdF=0; lastG=g; }
        if (holdF>=HOLD) {
          if (g==="fist") {
            targetProg=0; gIcon.textContent="✊"; gLabel.textContent="Gather · 汇聚"; pill.className="gather";
          } else {
            targetProg=1; gIcon.textContent="🖐"; gLabel.textContent="Scatter · 扩散"; pill.className="scatter";
          }
        }
      });

      const camFeed = new window.Camera(videoEl, {
        onFrame: async()=>{ await handsMP.send({image:videoEl}); },
        width:640, height:480,
      });
      camFeed.start().catch(console.warn);

      /* ── KEYBOARD SHORTCUT ── */
      const onKey = (e:KeyboardEvent) => {
        if (e.code==="Space") {
          e.preventDefault();
          targetProg = targetProg<0.5 ? 1 : 0;
          if (targetProg>0.5) {
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
        const t = performance.now()*0.001;
        if (particles) {
          const spd = targetProg<curProg ? LERP_GATHER : LERP_SCATTER;
          curProg += (targetProg-curProg)*spd;
          const u = (particles.material as THREE.ShaderMaterial).uniforms;
          u.uTime.value     = t;
          u.uProgress.value = curProg;
          particles.rotation.y += ROT_SPD;
          if (ringFill) {
            ringFill.setAttribute("stroke-dashoffset", (CIRC*curProg).toFixed(2));
            const re=document.getElementById("progress-ring");
            if (re) re.className = targetProg<0.5 ? "gather" : "";
          }
        }
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      cleanup = () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("keydown", onKey);
        renderer.dispose();
        if (mountRef.current?.contains(renderer.domElement))
          mountRef.current.removeChild(renderer.domElement);
      };
    })();

    return () => { cancelled=true; cleanup?.(); };
  }, []);

  return (
    <div style={{ width:"100vw", height:"100vh", overflow:"hidden",
      background:"#020208", position:"relative", fontFamily:"system-ui,sans-serif" }}>

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

      {/* Hints */}
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
      `}</style>
    </div>
  );
}

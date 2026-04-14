/**
 * 瑶草琪花 · KIXIZ STUDIO
 * Five-flower Particle Bloom
 *
 * Flowers (left → right):
 *   0 百合   (Lily)        baihe.glb
 *   1 花烛   (Anthurium)   anthurium.glb
 *   2 莲花   (Lotus)       lotus.glb
 *   3 石榴花 (Pomegranate) pomegranate.glb
 *   4 虞美人 (Poppy)       poppy.glb
 *
 * Gesture map:
 *   👈 Point left / 👉 Point right  → cycle between flowers
 *   🤏 Pinch             → select / focus the current flower
 *   ✋ Open palm         → scatter selected flower's particles
 *   ✊ Fist              → gather particles back
 *   Space bar / ← →   → keyboard fallback
 *
 * Particle colour: centroid UV sampling from each triangle's texture atlas
 * (avoids UV island seam bleed that causes wrong colours).
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/* ── CDN URLS ──────────────────────────────────────────────────── */
const FLOWER_URLS = [
  'https://d2xsxph8kpxj0f.cloudfront.net/310519663487115720/ejiFnRLP6xDAMjzum8YmMk/baihe_4774bde5.glb',
  'https://d2xsxph8kpxj0f.cloudfront.net/310519663487115720/ejiFnRLP6xDAMjzum8YmMk/anthurium_f0a39f13.glb',
  'https://d2xsxph8kpxj0f.cloudfront.net/310519663487115720/ejiFnRLP6xDAMjzum8YmMk/lotus_f4ee305b.glb',
  'https://d2xsxph8kpxj0f.cloudfront.net/310519663487115720/ejiFnRLP6xDAMjzum8YmMk/pomegranate_59701679.glb',
  'https://d2xsxph8kpxj0f.cloudfront.net/310519663487115720/ejiFnRLP6xDAMjzum8YmMk/poppy_c3f1f0b0.glb',
];

// Display only 3 flowers with new names (keep all GLBs for later)
const FLOWER_NAMES = ['百合', '花烛', '石榴花'];
const FLOWER_EN    = ['UI design', '3D & motion', 'Product design'];

// Fallback colours if texture fails
const FLOWER_FALLBACK: [number,number,number][] = [
  [0.80, 0.48, 0.58],  // lily: dusty rose
  [0.85, 0.15, 0.20],  // anthurium: red
  [0.85, 0.20, 0.15],  // pomegranate: deep red
];



/* ── PARTICLE CONFIG ───────────────────────────────────────────── */
const N_FLOWERS     = 3;
const N_PARTICLES   = 60_000;
const PARTICLE_SIZE = 0.038;
const FLOAT_AMP     = 0.008;
const FLOAT_SPEED   = 0.55;
const SCATTER_DIST  = 1.8;
const GATHER_SPEED  = 3.5;
const SCATTER_SPEED = 2.0;
const TARGET_RADIUS = 1.4;
// Spacing between flowers in world-space X
const FLOWER_SPACING = 4.5;

/* ── VERTEX SHADER ─────────────────────────────────────────────── */
const VERT = /* glsl */`
  #define FLOAT_SPEED ${FLOAT_SPEED.toFixed(2)}
  #define FLOAT_AMP   ${FLOAT_AMP.toFixed(4)}

  attribute vec3 aOrigin;
  attribute vec3 aScatter;
  attribute float aPhase;
  attribute float aSeed;
  attribute vec3 aColor;

  uniform float uProgress;
  uniform float uTime;
  uniform float uSize;

  varying vec3 vColor;

  void main() {
    vColor = aColor;

    float nx = sin(aPhase * 1.3 + uTime * FLOAT_SPEED) * FLOAT_AMP;
    float ny = cos(aPhase * 0.9 + uTime * FLOAT_SPEED * 1.1) * FLOAT_AMP;
    float nz = sin(aPhase * 1.7 + uTime * FLOAT_SPEED * 0.8) * FLOAT_AMP;

    float t = uProgress * uProgress * (3.0 - 2.0 * uProgress);
    vec3 pos = mix(aOrigin + vec3(nx,ny,nz), aScatter, t);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float sz = uSize * (0.7 + 0.6 * aSeed);
    gl_PointSize = sz * (300.0 / -mv.z);
  }
`;

/* ── FRAGMENT SHADER ───────────────────────────────────────────── */
const FRAG = /* glsl */`
  varying vec3 vColor;
  uniform float uProgress;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;

    float alpha = smoothstep(0.5, 0.1, d);
    alpha *= (1.0 - uProgress * 0.6);

    gl_FragColor = vec4(vColor, alpha);
  }
`;

/* ── TEXTURE SAMPLING ──────────────────────────────────────────── */
type TexData = { data: Uint8ClampedArray; w: number; h: number };

async function buildTexData(tex: THREE.Texture): Promise<TexData | null> {
  try {
    const src = tex.image;
    let imgBitmap: ImageBitmap;
    if (src instanceof ImageBitmap) {
      imgBitmap = src;
    } else if (src instanceof HTMLImageElement || src instanceof HTMLCanvasElement) {
      imgBitmap = await createImageBitmap(src);
    } else {
      return null;
    }
    const w = imgBitmap.width, h = imgBitmap.height;
    const oc = new OffscreenCanvas(w, h);
    const ctx = oc.getContext('2d')!;
    ctx.drawImage(imgBitmap, 0, 0);
    const id = ctx.getImageData(0, 0, w, h);
    return { data: id.data, w, h };
  } catch(e) {
    console.warn('[TEX] buildTexData failed', e);
    return null;
  }
}

function sampleTex(td: TexData, u: number, v: number): [number,number,number] {
  const uu = Math.max(0, Math.min(1, u));
  const vv = Math.max(0, Math.min(1, v));
  const px = Math.min(Math.floor(uu * td.w), td.w - 1);
  const py = Math.min(Math.floor(vv * td.h), td.h - 1);
  const j  = (py * td.w + px) * 4;
  return [td.data[j]/255, td.data[j+1]/255, td.data[j+2]/255];
}

/* ── SCRIPT LOADER ──────────────────────────────────────────────── */
function addScript(src: string): Promise<void> {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
    const s = document.createElement('script');
    s.src = src; s.crossOrigin = 'anonymous';
    s.onload = () => res();
    s.onerror = () => rej(new Error(`Script load failed: ${src}`));
    document.head.appendChild(s);
  });
}

/* ── PARTICLE BUILDER ───────────────────────────────────────────── */
type Tri = {
  ax:number; ay:number; az:number;
  bx:number; by:number; bz:number;
  cx:number; cy:number; cz:number;
  car:number; cag:number; cab:number;
  cbr:number; cbg:number; cbb:number;
  ccr:number; ccg:number; ccb:number;
  hasVC: boolean;
  au:number; av:number;
  bu:number; bv:number;
  cu:number; cv:number;
  centU: number; centV: number;
  area: number;
  tex: TexData | null;
};

async function buildParticles(
  gltf: { scene: THREE.Group },
  fallbackColor: [number,number,number]
): Promise<{ geo: THREE.BufferGeometry }> {
  const meshes: THREE.Mesh[] = [];
  gltf.scene.traverse(o => {
    if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
  });

  const tris: Tri[] = [];
  let totalArea = 0;

  for (const mesh of meshes) {
    const geo = mesh.geometry as THREE.BufferGeometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const uv  = geo.attributes.uv as THREE.BufferAttribute | undefined;
    const vc  = geo.attributes.color as THREE.BufferAttribute | undefined;
    const idx = geo.index;

    const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    const hasVertexColor = !!vc;
    let texData: TexData | null = null;

    if (!hasVertexColor && mat && (mat as THREE.MeshStandardMaterial).map) {
      texData = await buildTexData((mat as THREE.MeshStandardMaterial).map!);
    }

    const faceCount = idx ? idx.count / 3 : pos.count / 3;
    for (let f = 0; f < faceCount; f++) {
      const ia = idx ? idx.getX(f*3)   : f*3;
      const ib = idx ? idx.getX(f*3+1) : f*3+1;
      const ic = idx ? idx.getX(f*3+2) : f*3+2;

      const va  = new THREE.Vector3(pos.getX(ia), pos.getY(ia), pos.getZ(ia));
      const vb  = new THREE.Vector3(pos.getX(ib), pos.getY(ib), pos.getZ(ib));
      const vc2 = new THREE.Vector3(pos.getX(ic), pos.getY(ic), pos.getZ(ic));

      const area = va.clone().sub(vb).cross(va.clone().sub(vc2)).length() * 0.5;
      if (area < 1e-10) continue;

      const au = uv ? uv.getX(ia) : 0, av = uv ? uv.getY(ia) : 0;
      const bu = uv ? uv.getX(ib) : 0, bv = uv ? uv.getY(ib) : 0;
      const cu = uv ? uv.getX(ic) : 0, cv = uv ? uv.getY(ic) : 0;

      tris.push({
        ax:va.x, ay:va.y, az:va.z,
        bx:vb.x, by:vb.y, bz:vb.z,
        cx:vc2.x, cy:vc2.y, cz:vc2.z,
        car: vc ? vc.getX(ia) : 0, cag: vc ? vc.getY(ia) : 0, cab: vc ? vc.getZ(ia) : 0,
        cbr: vc ? vc.getX(ib) : 0, cbg: vc ? vc.getY(ib) : 0, cbb: vc ? vc.getZ(ib) : 0,
        ccr: vc ? vc.getX(ic) : 0, ccg: vc ? vc.getY(ic) : 0, ccb: vc ? vc.getZ(ic) : 0,
        hasVC: hasVertexColor,
        au, av, bu, bv, cu, cv,
        centU: (au+bu+cu)/3,
        centV: (av+bv+cv)/3,
        area, tex: texData
      });
      totalArea += area;
    }
  }

  // Auto-normalise to TARGET_RADIUS
  let cx = 0, cy = 0, cz = 0;
  for (const t of tris) { cx += (t.ax+t.bx+t.cx)/3; cy += (t.ay+t.by+t.cy)/3; cz += (t.az+t.bz+t.cz)/3; }
  cx /= tris.length; cy /= tris.length; cz /= tris.length;
  let maxR = 0;
  for (const t of tris) {
    for (const [x,y,z] of [[t.ax,t.ay,t.az],[t.bx,t.by,t.bz],[t.cx,t.cy,t.cz]] as [number,number,number][]) {
      const d = Math.sqrt((x-cx)**2+(y-cy)**2+(z-cz)**2);
      if (d > maxR) maxR = d;
    }
  }
  const normScale = maxR > 0 ? TARGET_RADIUS / maxR : 1;
  for (const t of tris) {
    t.ax = (t.ax-cx)*normScale; t.ay = (t.ay-cy)*normScale; t.az = (t.az-cz)*normScale;
    t.bx = (t.bx-cx)*normScale; t.by = (t.by-cy)*normScale; t.bz = (t.bz-cz)*normScale;
    t.cx = (t.cx-cx)*normScale; t.cy = (t.cy-cy)*normScale; t.cz = (t.cz-cz)*normScale;
  }

  // Weighted random triangle selection
  const cdf = new Float64Array(tris.length);
  let acc = 0;
  for (let i = 0; i < tris.length; i++) { acc += tris[i].area; cdf[i] = acc / totalArea; }

  const N = N_PARTICLES;
  const posArr    = new Float32Array(N * 3);
  const colArr    = new Float32Array(N * 3);
  const phaseArr  = new Float32Array(N);
  const seedArr   = new Float32Array(N);
  const scatterArr = new Float32Array(N * 3);

  for (let i = 0; i < N; i++) {
    const r = Math.random();
    let lo = 0, hi = tris.length - 1;
    while (lo < hi) { const mid = (lo+hi)>>1; if (cdf[mid] < r) lo=mid+1; else hi=mid; }
    const tri = tris[lo];

    let u1 = Math.random(), u2 = Math.random();
    if (u1 + u2 > 1) { u1 = 1-u1; u2 = 1-u2; }
    const u3 = 1 - u1 - u2;

    posArr[i*3]   = u1*tri.ax + u2*tri.bx + u3*tri.cx;
    posArr[i*3+1] = u1*tri.ay + u2*tri.by + u3*tri.cy;
    posArr[i*3+2] = u1*tri.az + u2*tri.bz + u3*tri.cz;

    // Centroid UV sampling — avoids UV island seam bleed
    if (tri.hasVC) {
      colArr[i*3]   = u1*tri.car + u2*tri.cbr + u3*tri.ccr;
      colArr[i*3+1] = u1*tri.cag + u2*tri.cbg + u3*tri.ccg;
      colArr[i*3+2] = u1*tri.cab + u2*tri.cbb + u3*tri.ccb;
    } else if (tri.tex) {
      const [cr,cg,cb] = sampleTex(tri.tex, tri.centU, tri.centV);
      colArr[i*3]=cr; colArr[i*3+1]=cg; colArr[i*3+2]=cb;
    } else {
      colArr[i*3]=fallbackColor[0]; colArr[i*3+1]=fallbackColor[1]; colArr[i*3+2]=fallbackColor[2];
    }

    phaseArr[i] = Math.random() * Math.PI * 2;
    seedArr[i]  = Math.random();

    const ox = posArr[i*3], oy = posArr[i*3+1], oz = posArr[i*3+2];
    const len = Math.sqrt(ox*ox + oy*oy + oz*oz) || 1;
    const spread = SCATTER_DIST * (0.6 + Math.random() * 0.8);
    scatterArr[i*3]   = ox + (ox/len)*spread + (Math.random()-0.5)*0.5;
    scatterArr[i*3+1] = oy + (oy/len)*spread + (Math.random()-0.5)*0.5;
    scatterArr[i*3+2] = oz + (oz/len)*spread + (Math.random()-0.5)*0.5;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position',  new THREE.BufferAttribute(posArr,   3));
  geo.setAttribute('aColor',    new THREE.BufferAttribute(colArr,   3));
  geo.setAttribute('aOrigin',   new THREE.BufferAttribute(posArr.slice(), 3));
  geo.setAttribute('aScatter',  new THREE.BufferAttribute(scatterArr, 3));
  geo.setAttribute('aPhase',    new THREE.BufferAttribute(phaseArr,  1));
  geo.setAttribute('aSeed',     new THREE.BufferAttribute(seedArr,   1));
  geo.computeBoundingBox();
  geo.computeBoundingSphere();

  return { geo };
}
/* ── MAIN COMPONENT ─────────────────────────────────────────────── */
export default function Home() {
  const mountRef      = useRef<HTMLDivElement>(null);
  const labelRef      = useRef<HTMLDivElement>(null);
  const loadRef       = useRef<HTMLDivElement>(null);
  const loadTxtRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    /* ── SCENE SETUP ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);
    mountRef.current.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 200);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 1.5;
    controls.maxDistance = 20;
    controls.target.set(0, 0, 0);

    /* ── FLOWER STATE ── */
    type FlowerState = {
      points: THREE.Points | null;
      mat: THREE.ShaderMaterial | null;
      progress: number;
      targetProgress: number;
      selected: boolean;
      loaded: boolean;
    };

    // 5 flowers evenly spaced along X axis, centred at 0
    const totalWidth = (N_FLOWERS - 1) * FLOWER_SPACING;
    const FLOWER_X = Array.from({ length: N_FLOWERS }, (_, i) => -totalWidth / 2 + i * FLOWER_SPACING);

    const flowers: FlowerState[] = Array.from({ length: N_FLOWERS }, () => ({
      points: null, mat: null, progress: 0, targetProgress: 0, selected: false, loaded: false,
    }));

    let activeIdx = 0;

    // Camera pan
    let camTargetX  = FLOWER_X[0];
    let camCurrentX = FLOWER_X[0];
    camera.position.set(FLOWER_X[0], 0, 5);
    controls.target.set(FLOWER_X[0], 0, 0);

    const clock = new THREE.Clock();

    /* ── LOAD ALL FLOWERS ── */
    const loader = new GLTFLoader();
    let loadedCount = 0;

    const setLoadText = (t: string) => {
      if (loadTxtRef.current) loadTxtRef.current.textContent = t;
    };

    const tryHideLoader = () => {
      loadedCount++;
      if (loadedCount >= N_FLOWERS && loadRef.current) {
        loadRef.current.style.transition = 'opacity 0.6s';
        loadRef.current.style.opacity = '0';
        setTimeout(() => { if (loadRef.current) loadRef.current.style.display = 'none'; }, 700);
      }
    };

    const loadFlower = (url: string, idx: number, fallback: [number,number,number]) => {
      setLoadText(`Loading ${FLOWER_NAMES[idx]}… (${idx + 1}/${N_FLOWERS})`);
      loader.load(url, async (gltf) => {
        const { geo } = await buildParticles(gltf, fallback);

        const mat = new THREE.ShaderMaterial({
          vertexShader: VERT,
          fragmentShader: FRAG,
          uniforms: {
            uProgress: { value: 0 },
            uTime:     { value: 0 },
            uSize:     { value: PARTICLE_SIZE },
          },
          vertexColors: false,
          transparent: true,
          depthWrite: false,
          blending: THREE.NormalBlending,
        });

        const points = new THREE.Points(geo, mat);
        points.frustumCulled = false;
        points.visible = true;
        points.position.x = FLOWER_X[idx];

        scene.add(points);
        flowers[idx].points = points;
        flowers[idx].mat    = mat;
        flowers[idx].loaded = true;

        tryHideLoader();
        updateLabel();
      }, (xhr) => {
        if (xhr.total) setLoadText(`Loading ${FLOWER_NAMES[idx]}… ${Math.round(xhr.loaded/xhr.total*100)}% (${idx+1}/${N_FLOWERS})`);
      }, (err) => {
        console.error(`[LOAD] Failed: ${FLOWER_NAMES[idx]}`, err);
        tryHideLoader();
      });
    };

    for (let i = 0; i < N_FLOWERS; i++) {
      loadFlower(FLOWER_URLS[i], i, FLOWER_FALLBACK[i]);
    }

    /* ── LABEL UPDATE ── */
    const updateLabel = () => {
      if (!labelRef.current) return;
      const prevIdx = (activeIdx - 1 + N_FLOWERS) % N_FLOWERS;
      const nextIdx = (activeIdx + 1) % N_FLOWERS;
      labelRef.current.innerHTML =
        `<span style="font-size:1.4rem;letter-spacing:0.15em;font-weight:bold;color:#fff">${FLOWER_EN[activeIdx]}</span>` +
        `<span style="display:block;font-size:0.7rem;letter-spacing:0.2em;opacity:0.4;margin-top:12px">← ${FLOWER_EN[prevIdx]} · ${FLOWER_EN[nextIdx]} →</span>`;
    };
    updateLabel();

    /* ── SWITCH FLOWER ── */
    const switchFlower = (dir: 'left' | 'right') => {
      if (dir === 'left')  activeIdx = (activeIdx - 1 + N_FLOWERS) % N_FLOWERS;
      else                 activeIdx = (activeIdx + 1) % N_FLOWERS;
      camTargetX = FLOWER_X[activeIdx];
      controls.enabled = false;
      setTimeout(() => { controls.enabled = true; }, 1200);
      updateLabel();

    };

    /* ── SELECT / DESELECT ACTIVE FLOWER ── */
    const selectFlower = () => {
      flowers[activeIdx].selected = true;
      updateLabel();
    };
    const deselectFlower = () => {
      flowers[activeIdx].selected = false;
      flowers[activeIdx].targetProgress = 0;
      updateLabel();
    };





    /* ── KEYBOARD FALLBACK ── */
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        const f = flowers[activeIdx];
        if (!f.selected) {
          selectFlower();
        } else {
          f.targetProgress = f.targetProgress > 0.5 ? 0 : 1;
        }
      }
      if (e.code === 'ArrowLeft')  switchFlower('left');
      if (e.code === 'ArrowRight') switchFlower('right');
    };
    window.addEventListener('keydown', onKey);

    /* ── MOUSE WHEEL: cycle flowers ── */
    let wheelCooldown = 0;
    const onWheel = (e: WheelEvent) => {
      // Only cycle if not zooming (ctrl key = pinch-zoom on trackpad)
      if (e.ctrlKey) return;
      const now = Date.now();
      if (now < wheelCooldown) return;
      wheelCooldown = now + 700;
      if (e.deltaY > 0 || e.deltaX > 0) switchFlower('right');
      else switchFlower('left');
    };
    renderer.domElement.addEventListener('wheel', onWheel, { passive: true });

    /* ── CANVAS CLICK / TAP: scatter particles ── */
    const onCanvasClick = () => {
      const f = flowers[activeIdx];
      f.targetProgress = f.targetProgress > 0.5 ? 0 : 1;
    };
    renderer.domElement.addEventListener('click', onCanvasClick);
    renderer.domElement.addEventListener('touchend', onCanvasClick, { passive: true });

    /* ── ANIMATION LOOP ── */
    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt   = clock.getDelta();
      const time = clock.getElapsedTime();

      // Smooth camera pan
      const panLerp = 1 - Math.pow(0.04, dt);
      camCurrentX += (camTargetX - camCurrentX) * panLerp;
      camera.position.x = camCurrentX;
      controls.target.x = camCurrentX;
      controls.update();

      for (const f of flowers) {
        if (!f.mat || !f.points) continue;
        const speed = f.targetProgress > f.progress ? SCATTER_SPEED : GATHER_SPEED;
        f.progress += (f.targetProgress - f.progress) * Math.min(dt * speed, 1);
        f.progress = Math.max(0, Math.min(1, f.progress));
        f.mat.uniforms.uProgress.value = f.progress;
        f.mat.uniforms.uTime.value     = time;
        f.points.rotation.y += dt * 0.18;
      }

      renderer.render(scene, camera);
    };
    animate();

    /* ── RESIZE ── */
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    /* ── CLEANUP ── */
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('click', onCanvasClick);

      controls.dispose();
      renderer.dispose();
      for (const f of flowers) {
        if (f.points) { scene.remove(f.points); f.points.geometry.dispose(); }
        if (f.mat) f.mat.dispose();
      }
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', overflow: 'hidden', position: 'relative' }}>
      {/* Three.js canvas mount */}
      <div ref={mountRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Loading overlay */}
      <div ref={loadRef} style={{
        position: 'absolute', inset: 0, background: '#000',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: 10, color: '#fff', fontFamily: '"Noto Serif SC", serif',
      }}>
        <div style={{ fontSize: '2rem', letterSpacing: '0.3em', marginBottom: '0.5rem' }}>瑶草琪花</div>
        <div style={{ fontSize: '0.75rem', letterSpacing: '0.35em', opacity: 0.85, marginBottom: '1.5rem', fontFamily: 'monospace' }}>KIXIZ STUDIO</div>
        <div ref={loadTxtRef} style={{ fontSize: '0.75rem', letterSpacing: '0.2em', opacity: 0.5 }}>Loading…</div>
        <div style={{ marginTop: '1.5rem', width: 48, height: 48, borderRadius: '50%' }} className="ld-spinner" />
      </div>

      {/* Flower label */}
      <div ref={labelRef} style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%) translateY(-220px)',
        color: '#fff', fontFamily: '"Noto Serif SC", serif',
        textAlign: 'center', pointerEvents: 'none', userSelect: 'none',
        transition: 'opacity 0.3s',
      }} />



      {/* Centered bottom instructions */}
      <div style={{
        position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
        pointerEvents: 'none',
      }}>
        {/* Scroll instruction row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '40px',
          color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace',
          fontSize: '0.75rem', letterSpacing: '0.1em',
        }}>
          <span>Scroll down</span>
          <div style={{
            width: '24px', height: '32px', border: '1px solid rgba(255,255,255,0.5)',
            borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            <div style={{
              width: '2px', height: '6px', background: 'rgba(255,255,255,0.7)',
              borderRadius: '1px',
              animation: 'scroll-bounce 2s infinite',
            }} />
          </div>
          <span>to see projects</span>
        </div>
        {/* Click instruction */}
        <div style={{
          color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace',
          fontSize: '0.7rem', letterSpacing: '0.1em',
        }}>
          Click / tap to scatter
        </div>
      </div>
      
      <style>{`
        @keyframes scroll-bounce {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(6px); opacity: 0.3; }
        }
      `}</style>

      {/* KIXIZ STUDIO - Left side */}
      <div style={{
        position: 'absolute', top: 32, left: 28,
        color: '#fff', fontFamily: 'monospace',
        fontSize: '1.8rem', letterSpacing: '0.2em', fontWeight: 'bold',
        pointerEvents: 'none', whiteSpace: 'nowrap',
      }}>
        KIXIZ STUDIO
      </div>

      {/* Right sidebar - About & Contact buttons */}
      <div style={{
        position: 'absolute', top: 32, right: 32,
        display: 'flex', gap: '24px',
      }}>
        <button
          onClick={() => window.location.href = '/about'}
          style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 4, color: '#fff', fontFamily: 'monospace',
            fontSize: '0.75rem', letterSpacing: '0.15em', padding: '8px 16px',
            cursor: 'pointer', transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
            e.currentTarget.style.color = '#fff';
          }}
        >
          ABOUT
        </button>
        <button
          onClick={() => window.location.href = '/contact'}
          style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 4, color: '#fff', fontFamily: 'monospace',
            fontSize: '0.75rem', letterSpacing: '0.15em', padding: '8px 16px',
            cursor: 'pointer', transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
            e.currentTarget.style.color = '#fff';
          }}
        >
          CONTACT
        </button>
      </div>

      {/* NEXT button - bottom right */}
      <button
        onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight', bubbles: true }))}
        style={{
          position: 'absolute', bottom: 32, right: 32,
          background: 'transparent', border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 4, color: '#fff', fontFamily: 'monospace',
          fontSize: '0.75rem', letterSpacing: '0.15em', padding: '8px 16px',
          cursor: 'pointer', transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
          e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
          e.currentTarget.style.color = '#fff';
        }}
      >
        NEXT →
      </button>

    </div>
  );
}

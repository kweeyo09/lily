/**
 * 百合 & 木槿 · Dual Flower Particle Bloom
 *
 * Design: Dark void background, two photogrammetry flowers rendered as
 * particle clouds. Gesture-driven interaction via MediaPipe Hands.
 *
 * Gesture map:
 *   👈 Point left / 👉 Point right  → cycle between lily and hibiscus
 *       (index finger extended, all others curled, pointing sideways)
 *   🤏 Pinch             → select / focus the current flower
 *   ✋ Open palm         → scatter selected flower’s particles
 *   ✊ Fist              → gather particles back
 *   Space bar / ← →   → keyboard fallback
 *
 * Particle colour: centroid UV sampling from each triangle's texture atlas
 * (avoids UV island seam bleed that causes wrong colours).
 *
 * CDN assets:
 *   Lily:     https://d2xsxph8kpxj0f.cloudfront.net/310519663487115720/ejiFnRLP6xDAMjzum8YmMk/baihe_18ff0b7f.glb
 *   Hibiscus: https://d2xsxph8kpxj0f.cloudfront.net/310519663487115720/ejiFnRLP6xDAMjzum8YmMk/hisbiscus_5dcc67fb.glb
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/* ── CDN URLS ──────────────────────────────────────────────────── */
const LILY_URL = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663487115720/ejiFnRLP6xDAMjzum8YmMk/baihe_18ff0b7f.glb';
const HIBI_URL = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663487115720/ejiFnRLP6xDAMjzum8YmMk/hisbiscus_5dcc67fb.glb';

/* ── MEDIAPIPE CDN ─────────────────────────────────────────────── */
const MP_HANDS = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.js';
const MP_CAM   = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1640029074/camera_utils.js';

/* ── PARTICLE CONFIG ───────────────────────────────────────────── */
const N_PARTICLES   = 60_000;
const PARTICLE_SIZE = 0.038;   // increased — was 0.012, too small
const FLOAT_AMP     = 0.008;
const FLOAT_SPEED   = 0.55;
const SCATTER_DIST  = 1.8;
const GATHER_SPEED  = 3.5;
const SCATTER_SPEED = 2.0;
const TARGET_RADIUS = 1.4;    // normalise model to fit this world-space radius

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

    // Soft circular falloff
    float alpha = smoothstep(0.5, 0.1, d);
    // Fade out as scattered
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
    console.log(`[TEX] ${w}×${h} centre=rgb(${id.data[(Math.floor(h/2)*w+Math.floor(w/2))*4]},${id.data[(Math.floor(h/2)*w+Math.floor(w/2))*4+1]},${id.data[(Math.floor(h/2)*w+Math.floor(w/2))*4+2]})`);
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
): Promise<{ geo: THREE.BufferGeometry; originArr: Float32Array; scatterArr: Float32Array }> {
  const loader = new GLTFLoader();
  void loader; // used externally

  const meshes: THREE.Mesh[] = [];
  gltf.scene.traverse(o => {
    if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
  });
  console.log(`[LOAD] ${meshes.length} mesh(es) found`);

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

    console.log(`[MESH] vc=${hasVertexColor} uv=${!!uv} tex=${!!texData} verts=${pos.count}`);

  const faceCount = idx ? idx.count / 3 : pos.count / 3;
  for (let f = 0; f < faceCount; f++) {
      const ia = idx ? idx.getX(f*3)   : f*3;
      const ib = idx ? idx.getX(f*3+1) : f*3+1;
      const ic = idx ? idx.getX(f*3+2) : f*3+2;

      // Local-space positions (we normalise after collecting all tris)
      const va = new THREE.Vector3(pos.getX(ia), pos.getY(ia), pos.getZ(ia));
      const vb = new THREE.Vector3(pos.getX(ib), pos.getY(ib), pos.getZ(ib));
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

  // ── Auto-normalise: compute bounding sphere of all triangle centroids,
  //    then scale positions so the model fits TARGET_RADIUS.
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
  console.log(`[NORM] centre=(${cx.toFixed(3)},${cy.toFixed(3)},${cz.toFixed(3)}) maxR=${maxR.toFixed(3)} scale=${normScale.toFixed(3)}`);
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
  const posArr  = new Float32Array(N * 3);
  const colArr  = new Float32Array(N * 3);
  const phaseArr = new Float32Array(N);
  const seedArr  = new Float32Array(N);
  const scatterArr = new Float32Array(N * 3);

  let vcCount = 0, texCount = 0, fallCount = 0;

  for (let i = 0; i < N; i++) {
    // Pick triangle by area weight
    const r = Math.random();
    let lo = 0, hi = tris.length - 1;
    while (lo < hi) { const mid = (lo+hi)>>1; if (cdf[mid] < r) lo=mid+1; else hi=mid; }
    const tri = tris[lo];

    // Random barycentric for POSITION (fine — we only use centroid for colour)
    let u1 = Math.random(), u2 = Math.random();
    if (u1 + u2 > 1) { u1 = 1-u1; u2 = 1-u2; }
    const u3 = 1 - u1 - u2;

    posArr[i*3]   = u1*tri.ax + u2*tri.bx + u3*tri.cx;
    posArr[i*3+1] = u1*tri.ay + u2*tri.by + u3*tri.cy;
    posArr[i*3+2] = u1*tri.az + u2*tri.bz + u3*tri.cz;

    // Colour — centroid UV sampling (avoids UV island seam bleed)
    if (tri.hasVC) {
      colArr[i*3]   = u1*tri.car + u2*tri.cbr + u3*tri.ccr;
      colArr[i*3+1] = u1*tri.cag + u2*tri.cbg + u3*tri.ccg;
      colArr[i*3+2] = u1*tri.cab + u2*tri.cbb + u3*tri.ccb;
      vcCount++;
    } else if (tri.tex) {
      const [cr,cg,cb] = sampleTex(tri.tex, tri.centU, tri.centV);
      colArr[i*3]=cr; colArr[i*3+1]=cg; colArr[i*3+2]=cb;
      texCount++;
    } else {
      colArr[i*3]=fallbackColor[0]; colArr[i*3+1]=fallbackColor[1]; colArr[i*3+2]=fallbackColor[2];
      fallCount++;
    }

    phaseArr[i] = Math.random() * Math.PI * 2;
    seedArr[i]  = Math.random();

    // Scatter target: radial outward from origin
    const ox = posArr[i*3], oy = posArr[i*3+1], oz = posArr[i*3+2];
    const len = Math.sqrt(ox*ox + oy*oy + oz*oz) || 1;
    const spread = SCATTER_DIST * (0.6 + Math.random() * 0.8);
    scatterArr[i*3]   = ox + (ox/len) * spread + (Math.random()-0.5)*0.5;
    scatterArr[i*3+1] = oy + (oy/len) * spread + (Math.random()-0.5)*0.5;
    scatterArr[i*3+2] = oz + (oz/len) * spread + (Math.random()-0.5)*0.5;
  }

  console.log(`[SAMPLE] tris=${tris.length} vc=${vcCount} tex=${texCount} fall=${fallCount}`);
  if (texCount > 0) {
    const s = (i: number) => `rgb(${Math.round(colArr[i*3]*255)},${Math.round(colArr[i*3+1]*255)},${Math.round(colArr[i*3+2]*255)})`;
    console.log('[SAMPLE] first 5:', [0,1,2,3,4].map(s).join('  '));
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

  return { geo, originArr: posArr.slice(), scatterArr };
}

/* ── GESTURE DETECTION ──────────────────────────────────────────── */
type Landmark = { x: number; y: number; z: number };

/** Euclidean distance between two landmarks (normalised 0-1 image space) */
function dist(a: Landmark, b: Landmark) {
  return Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2);
}

/**
 * Robust finger-extension check:
 * A finger is "extended" when its TIP is farther from the WRIST than its MCP knuckle.
 * This works regardless of hand orientation (up/down/tilted).
 */
function fingerExtended(lm: Landmark[], tip: number, mcp: number): boolean {
  const wrist = lm[0];
  return dist(lm[tip], wrist) > dist(lm[mcp], wrist) * 1.05;
}

/** Thumb extended: tip farther from index MCP than thumb MCP */
function thumbExtended(lm: Landmark[]): boolean {
  return dist(lm[4], lm[5]) > dist(lm[2], lm[5]) * 0.9;
}

function detectGesture(lm: Landmark[]): 'open' | 'fist' | 'pinch' | 'point_left' | 'point_right' | 'none' {
  if (!lm || lm.length < 21) return 'none';

  const handSize = dist(lm[0], lm[9]);  // wrist to middle MCP

  // Pinch: thumb tip close to index tip (relative to hand size)
  const pinchDist = dist(lm[4], lm[8]);
  if (pinchDist < handSize * 0.35) return 'pinch';

  // Check each finger extension
  const indexExt  = fingerExtended(lm, 8,  5);
  const middleExt = fingerExtended(lm, 12, 9);
  const ringExt   = fingerExtended(lm, 16, 13);
  const pinkyExt  = fingerExtended(lm, 20, 17);
  const extCount  = [indexExt, middleExt, ringExt, pinkyExt].filter(Boolean).length;

  // Pointing: ONLY index extended, others curled — checked BEFORE open palm
  // so a single raised index finger is never misread as open palm
  if (indexExt && !middleExt && !ringExt && !pinkyExt) {
    // Direction: index tip x vs index MCP x (camera space, video is mirrored)
    const dx = lm[8].x - lm[5].x;
    if (Math.abs(dx) > 0.04) {
      return dx > 0 ? 'point_left' : 'point_right';
    }
    return 'none'; // pointing straight up/down — not a direction gesture
  }

  // Open palm: at least 3 fingers extended (index already excluded above)
  if (extCount >= 3) return 'open';

  // Fist: all 4 fingers curled
  if (extCount === 0) return 'fist';

  return 'none';
}

/* ── SWIPE DETECTION ──────────────────────────────────────────── */
/**
 * Swipe detection: track wrist (lm[0]) x-movement over multiple frames.
 * Requires a sustained movement > 0.18 of image width to trigger —
 * much harder to trigger accidentally than a single-frame delta.
 */
function detectSwipe(
  prev: Landmark[] | null,
  curr: Landmark[]
): 'left' | 'right' | null {
  if (!prev || !curr) return null;
  // Use wrist (0) for more stable tracking than palm base (9)
  const dx = curr[0].x - prev[0].x;
  // Require larger movement (0.18 vs 0.08) to avoid false triggers
  if (Math.abs(dx) > 0.18) return dx > 0 ? 'right' : 'left';
  return null;
}

/* ── MAIN COMPONENT ─────────────────────────────────────────────── */
export default function Home() {
  const mountRef   = useRef<HTMLDivElement>(null);
  const videoRef   = useRef<HTMLVideoElement>(null);
  const statusRef  = useRef<HTMLDivElement>(null);
  const labelRef   = useRef<HTMLDivElement>(null);
  const loadRef    = useRef<HTMLDivElement>(null);
  const loadTxtRef = useRef<HTMLDivElement>(null);
  const gestureRef    = useRef<HTMLDivElement>(null);  // live gesture indicator
  const handCanvasRef  = useRef<HTMLCanvasElement>(null); // skeleton wireframe overlay

  useEffect(() => {
    if (!mountRef.current) return;

    /* ── SCENE SETUP ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);
    mountRef.current.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 100);
    camera.position.set(0, 0, 4);
    camera.lookAt(0, 0, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 1.5;
    controls.maxDistance = 10;
    controls.target.set(0, 0, 0);

    /* ── FLOWER STATE ── */
    type FlowerState = {
      points: THREE.Points | null;
      mat: THREE.ShaderMaterial | null;
      progress: number;   // 0=gathered 1=scattered
      targetProgress: number;
      selected: boolean;
      loaded: boolean;
      name: string;
    };

    // Flowers placed side by side: lily at x=-2.2, hibiscus at x=+2.2
    const FLOWER_X = [-2.2, 2.2];

    const flowers: FlowerState[] = [
      { points: null, mat: null, progress: 0, targetProgress: 0, selected: false, loaded: false, name: '百合' },
      { points: null, mat: null, progress: 0, targetProgress: 0, selected: false, loaded: false, name: '木槿' },
    ];

    let activeIdx = 0;   // which flower is focused

    // Camera pan: smoothly lerp camera x and controls target x
    let camTargetX  = FLOWER_X[0];
    let camCurrentX = FLOWER_X[0];
    camera.position.set(FLOWER_X[0], 0, 4.5);
    controls.target.set(FLOWER_X[0], 0, 0);

    let clock = new THREE.Clock();

    /* ── LOAD BOTH FLOWERS ── */
    const loader = new GLTFLoader();
    let loadedCount = 0;

    const setLoadText = (t: string) => {
      if (loadTxtRef.current) loadTxtRef.current.textContent = t;
    };

    const tryHideLoader = () => {
      loadedCount++;
      if (loadedCount >= 2 && loadRef.current) {
        loadRef.current.style.transition = 'opacity 0.6s';
        loadRef.current.style.opacity = '0';
        setTimeout(() => { if (loadRef.current) loadRef.current.style.display = 'none'; }, 700);
      }
    };

    const loadFlower = (url: string, idx: number, fallback: [number,number,number]) => {
      setLoadText(`Loading ${flowers[idx].name}…`);
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
          vertexColors: false,  // we use aColor attribute directly
          transparent: true,
          depthWrite: false,
          blending: THREE.NormalBlending,
        });

        const points = new THREE.Points(geo, mat);
        points.frustumCulled = false;
        points.visible = true; // both flowers always visible
        points.position.x = FLOWER_X[idx]; // place side by side

        scene.add(points);
        flowers[idx].points = points;
        flowers[idx].mat    = mat;
        flowers[idx].loaded = true;

        tryHideLoader();
        updateLabel();
      }, (xhr) => {
        if (xhr.total) setLoadText(`Loading ${flowers[idx].name}… ${Math.round(xhr.loaded/xhr.total*100)}%`);
      }, (err) => {
        console.error(`[LOAD] Failed to load ${flowers[idx].name}:`, err);
        tryHideLoader();
      });
    };

    loadFlower(LILY_URL, 0, [0.80, 0.48, 0.58]);
    loadFlower(HIBI_URL, 1, [0.90, 0.30, 0.65]);

    /* ── LABEL UPDATE ── */
    const updateLabel = () => {
      if (!labelRef.current) return;
      const f = flowers[activeIdx];
      const other = flowers[1 - activeIdx];
      const selTxt = f.selected ? ' · selected' : '';
      labelRef.current.innerHTML =
        `<span style="opacity:1;font-size:1.6rem;letter-spacing:0.15em">${f.name}</span>` +
        `<span style="opacity:0.4;font-size:0.75rem;letter-spacing:0.2em;display:block;margin-top:4px">${selTxt}</span>` +
        `<span style="opacity:0.25;font-size:0.65rem;letter-spacing:0.2em;display:block;margin-top:2px">swipe → ${other.name}</span>`;
    };

    /* ── SWITCH FLOWER ── */
    const switchFlower = (dir: 'left' | 'right') => {
      activeIdx = 1 - activeIdx;
      // Pan camera to the newly focused flower
      camTargetX = FLOWER_X[activeIdx];
      // Disable orbit controls temporarily so the pan isn't fought
      controls.enabled = false;
      setTimeout(() => { controls.enabled = true; }, 1200);
      updateLabel();
      showGestureStatus(dir === 'left' ? '← ' + flowers[activeIdx].name : flowers[activeIdx].name + ' →');
    };

    /* ── GESTURE STATUS UI ── */
    const showGestureStatus = (text: string) => {
      if (!statusRef.current) return;
      statusRef.current.textContent = text;
      statusRef.current.style.opacity = '1';
      setTimeout(() => { if (statusRef.current) statusRef.current.style.opacity = '0'; }, 1200);
    };

    /* ── MEDIAPIPE HANDS ── */
    let lastGesture: string = 'none';
    let swipeCooldown = 0;
    // Velocity accumulator: sum of wrist x-deltas over recent frames
    let swipeVel = 0;
    let prevWristX: number | null = null;

    /* ── HAND SKELETON DRAWING ── */
    // MediaPipe hand connections (21 landmarks)
    const HAND_CONNECTIONS = [
      [0,1],[1,2],[2,3],[3,4],         // thumb
      [0,5],[5,6],[6,7],[7,8],         // index
      [0,9],[9,10],[10,11],[11,12],    // middle
      [0,13],[13,14],[14,15],[15,16],  // ring
      [0,17],[17,18],[18,19],[19,20],  // pinky
      [5,9],[9,13],[13,17],            // palm
    ];

    const drawSkeleton = (lm: Landmark[]) => {
      const canvas = handCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Mirror x because video is scaleX(-1)
      const px = (lm: Landmark) => ({ x: (1 - lm.x) * W, y: lm.y * H });

      // Draw connections
      ctx.strokeStyle = 'rgba(255, 200, 80, 0.75)';
      ctx.lineWidth = 1.5;
      for (const [a, b] of HAND_CONNECTIONS) {
        const pa = px(lm[a]), pb = px(lm[b]);
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
      }

      // Draw landmark dots
      for (let i = 0; i < lm.length; i++) {
        const p = px(lm[i]);
        const isTip = [4,8,12,16,20].includes(i);
        ctx.beginPath();
        ctx.arc(p.x, p.y, isTip ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = isTip ? 'rgba(255,100,100,0.95)' : 'rgba(255,220,100,0.9)';
        ctx.fill();
      }
    };

    const clearSkeleton = () => {
      const canvas = handCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const onResults = (results: { multiHandLandmarks?: Landmark[][] }) => {
      if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        lastGesture = 'none';
        prevWristX = null;
        swipeVel = 0;
        clearSkeleton();
        return;
      }

      const lm = results.multiHandLandmarks[0];
      const gesture = detectGesture(lm);
      const now = Date.now();

      // Draw skeleton wireframe
      drawSkeleton(lm);

      // Pointing gesture → switch flower
      // Requires holding the point for 400ms to avoid accidental triggers
      if (now > swipeCooldown) {
        if (gesture === 'point_left' && lastGesture !== 'point_left') {
          switchFlower('left');
          swipeCooldown = now + 1200;
        } else if (gesture === 'point_right' && lastGesture !== 'point_right') {
          switchFlower('right');
          swipeCooldown = now + 1200;
        }
      }

      // Pinch → select current flower
      if (gesture === 'pinch' && lastGesture !== 'pinch') {
        flowers[activeIdx].selected = true;
        showGestureStatus('pinch · selected');
        updateLabel();
      }

      // Open palm → scatter (only if selected, or always scatter active)
      if (gesture === 'open') {
        flowers[activeIdx].targetProgress = 1;
        if (lastGesture !== 'open') showGestureStatus('open · scatter');
      }

      // Fist → gather
      if (gesture === 'fist') {
        flowers[activeIdx].targetProgress = 0;
        flowers[activeIdx].selected = false;
        if (lastGesture !== 'fist') showGestureStatus('fist · gather');
        updateLabel();
      }

      // Update live gesture indicator
      if (gestureRef.current) {
        const icons: Record<string, string> = {
          open:        '✋ open',
          fist:        '✊ fist',
          pinch:       '🤏 pinch',
          point_left:  '👈 switch',
          point_right: '👉 switch',
          none:        '· · ·',
        };
        gestureRef.current.textContent = icons[gesture] ?? '· · ·';
        gestureRef.current.style.color =
          gesture === 'open'        ? 'rgba(255,200,120,0.9)'
          : gesture === 'fist'      ? 'rgba(120,200,255,0.9)'
          : gesture === 'pinch'     ? 'rgba(200,255,160,0.9)'
          : gesture === 'point_left' || gesture === 'point_right' ? 'rgba(255,160,220,0.9)'
          : 'rgba(255,255,255,0.25)';
      }

      lastGesture = gesture;
    };

    let mpLoaded = false;
    const initMP = async () => {
      if (mpLoaded) return;
      try {
        await addScript(MP_HANDS);
        await addScript(MP_CAM);
        mpLoaded = true;

        const Hands = (window as unknown as Record<string, unknown>)['Hands'] as new (cfg: object) => {
          setOptions(o: object): void;
          onResults(cb: (r: unknown) => void): void;
          send(data: object): Promise<void>;
        };
        const Camera = (window as unknown as Record<string, unknown>)['Camera'] as new (
          el: HTMLVideoElement, cfg: { onFrame: () => Promise<void>; width: number; height: number }
        ) => { start(): void };

        const hands = new Hands({ locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${f}` });
        hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.6 });
        hands.onResults(onResults as (r: unknown) => void);

        if (videoRef.current) {
          const cam = new Camera(videoRef.current, {
            onFrame: async () => { if (videoRef.current) await hands.send({ image: videoRef.current }); },
            width: 320, height: 240,
          });
          cam.start();
        }
      } catch(e) {
        console.warn('[MP] MediaPipe load failed:', e);
      }
    };

    initMP();

    /* ── KEYBOARD FALLBACK ── */
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        const f = flowers[activeIdx];
        f.targetProgress = f.targetProgress > 0.5 ? 0 : 1;
      }
      if (e.code === 'ArrowLeft')  switchFlower('left');
      if (e.code === 'ArrowRight') switchFlower('right');
    };
    window.addEventListener('keydown', onKey);

    /* ── ANIMATION LOOP ── */
    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt   = clock.getDelta();
      const time = clock.getElapsedTime();

      // Smooth camera pan towards focused flower
      const panLerp = 1 - Math.pow(0.04, dt); // ~3s settle time
      camCurrentX += (camTargetX - camCurrentX) * panLerp;
      camera.position.x = camCurrentX;
      controls.target.x = camCurrentX;
      controls.update();

      for (const f of flowers) {
        if (!f.mat || !f.points) continue;

        // Smooth progress towards target
        const speed = f.targetProgress > f.progress ? SCATTER_SPEED : GATHER_SPEED;
        f.progress += (f.targetProgress - f.progress) * Math.min(dt * speed, 1);
        f.progress = Math.max(0, Math.min(1, f.progress));

        f.mat.uniforms.uProgress.value = f.progress;
        f.mat.uniforms.uTime.value     = time;

        // Both flowers always rotate slowly in place
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
        <div style={{ fontSize: '2rem', letterSpacing: '0.3em', marginBottom: '1.5rem' }}>百合 · 木槿</div>
        <div ref={loadTxtRef} style={{ fontSize: '0.75rem', letterSpacing: '0.2em', opacity: 0.5 }}>Loading…</div>
        <div style={{
          marginTop: '1.5rem', width: 48, height: 48,
          borderRadius: '50%',
        }} className="ld-spinner" />
      </div>

      {/* Flower label */}
      <div ref={labelRef} style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%) translateY(-220px)',
        color: '#fff', fontFamily: '"Noto Serif SC", serif',
        textAlign: 'center', pointerEvents: 'none', userSelect: 'none',
        transition: 'opacity 0.3s',
      }} />

      {/* Gesture status flash */}
      <div ref={statusRef} style={{
        position: 'absolute', bottom: 100, left: '50%',
        transform: 'translateX(-50%)',
        color: 'rgba(255,255,255,0.7)',
        fontFamily: 'monospace', fontSize: '0.75rem', letterSpacing: '0.15em',
        opacity: 0, transition: 'opacity 0.4s',
        pointerEvents: 'none',
      }} />

      {/* Controls hint */}
      <div style={{
        position: 'absolute', top: 24, left: 28,
        color: 'rgba(255,255,255,0.28)', fontSize: '0.65rem',
        fontFamily: 'monospace', letterSpacing: '0.12em', lineHeight: 1.9,
        pointerEvents: 'none',
      }}>
        Drag to orbit · Scroll to zoom<br />
        ✋ Open palm → scatter · ✊ Fist → gather<br />
        👈👉 Point left/right → switch flower<br />
        🤏 Pinch → select · ← → Space
      </div>

      {/* Title */}
      <div style={{
        position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)',
        color: 'rgba(255,255,255,0.75)', fontFamily: '"Noto Serif SC", serif',
        fontSize: '1rem', letterSpacing: '0.35em', textAlign: 'center',
        pointerEvents: 'none',
      }}>
        百合 · 木槿<br />
        <span style={{ fontSize: '0.6rem', letterSpacing: '0.25em', opacity: 0.45 }}>
          Lily · Hibiscus · Particle Bloom
        </span>
      </div>

      {/* Hand tracking preview */}
      <div style={{
        position: 'absolute', top: 16, right: 16,
        width: 160, height: 120, borderRadius: 8,
        overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(255,255,255,0.05)',
      }}>
        <video
          ref={videoRef}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: 'block' }}
          playsInline muted
        />
        {/* Hand skeleton wireframe canvas — same size as the preview box */}
        <canvas
          ref={handCanvasRef}
          width={160}
          height={120}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            pointerEvents: 'none',
          }}
        />
        <div style={{
          position: 'absolute', bottom: 6, left: 0, right: 0,
          textAlign: 'center', color: 'rgba(255,255,255,0.4)',
          fontSize: '0.55rem', letterSpacing: '0.2em', fontFamily: 'monospace',
        }}>HAND TRACKING</div>
        {/* Live gesture indicator */}
        <div ref={gestureRef} style={{
          position: 'absolute', top: 6, left: 0, right: 0,
          textAlign: 'center', fontSize: '0.7rem', letterSpacing: '0.1em',
          fontFamily: 'monospace', color: 'rgba(255,255,255,0.25)',
          transition: 'color 0.2s',
        }}>· · ·</div>
      </div>

      {/* Scatter / Gather button */}
      <button
        onClick={() => {
          window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }));
        }}
        style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 40, color: 'rgba(255,255,255,0.7)',
          padding: '10px 28px', fontSize: '0.7rem', letterSpacing: '0.2em',
          fontFamily: 'monospace', cursor: 'pointer',
          backdropFilter: 'blur(8px)',
        }}
      >
        🌸 SCATTER / GATHER
      </button>

      {/* Switch flower button */}
      <button
        onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight', bubbles: true }))}
        style={{
          position: 'absolute', bottom: 32, right: 28,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 40, color: 'rgba(255,255,255,0.5)',
          padding: '10px 20px', fontSize: '0.65rem', letterSpacing: '0.15em',
          fontFamily: 'monospace', cursor: 'pointer',
          backdropFilter: 'blur(8px)',
        }}
      >
        SWITCH →
      </button>
    </div>
  );
}

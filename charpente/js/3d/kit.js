// Boîte à outils 3D partagée par les vues temps réel et le rendu hors-ligne :
// texture de bois procédurale, pièces de charpente, matériaux, éclairage studio
// et le trait laser cyan (le seul accent coloré du site, toujours dans l'image).
import * as THREE from '../../vendor/three.module.min.js';
import { RoundedBoxGeometry } from '../../vendor/RoundedBoxGeometry.js';
import { RoomEnvironment } from '../../vendor/RoomEnvironment.js';

export { THREE };
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const AX = { X: V(1, 0, 0), Y: V(0, 1, 0), Z: V(0, 0, 1) };
export const DEG = Math.PI / 180;

// Teintes des essences (sRGB) — multipliées par la texture de fil.
export const SPECIES = {
  epicea: '#f2dfc3',
  douglas: '#e9c49c',
  meleze: '#e0b78d',
  chene: '#d2aa7e',
  vieuxChene: '#7a5b41',
  lamelle: '#f4e2c6',
};

// Générateur pseudo-aléatoire déterministe (mêmes rendus à chaque chargement).
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------------------------------------------------
   Texture de fil du bois (périodique, générée une seule fois)
   --------------------------------------------------------- */
function hash(x, y) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function vnoise(x, y, px, py) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const x0 = ((xi % px) + px) % px, x1 = (x0 + 1) % px;
  const y0 = ((yi % py) + py) % py, y1 = (y0 + 1) % py;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(x0, y0), b = hash(x1, y0), c = hash(x0, y1), d = hash(x1, y1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// Une tuile couvre 1,6 m dans le sens du fil (u) et 0,8 m en travers (v).
const SU = 1.6, SV = 0.8;
let woodTex = null;
export function woodTexture() {
  if (woodTex) return woodTex;
  const W = 1024, H = 512;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(W, H);
  const d = img.data;
  for (let y = 0; y < H; y++) {
    const v = y / H;
    for (let x = 0; x < W; x++) {
      const u = x / W;
      const warp = vnoise(u * 3, v * 2, 3, 2) * 1.7 + vnoise(u * 8, v * 4, 8, 4) * 0.45;
      const g = v * 26 + warp;                       // 26 cernes par tuile
      const f = g - Math.floor(g);
      const late = smooth(0.6, 0.9, f) * (1 - smooth(0.9, 1, f) * 0.7);
      const fibre = vnoise(u * 96, v * 44, 96, 44);
      const tache = vnoise(u * 2, v * 6, 2, 6);
      const k = 0.95 - late * 0.19 - fibre * 0.06 + (tache - 0.5) * 0.06;
      const i = (y * W + x) * 4;
      d[i] = 255 * k;
      d[i + 1] = 255 * k * 0.975;
      d[i + 2] = 255 * k * 0.945;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  woodTex = new THREE.CanvasTexture(canvas);
  woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
  woodTex.colorSpace = THREE.SRGBColorSpace;
  woodTex.anisotropy = 8;
  return woodTex;
}

// UV « à l'échelle du monde » + couleur par sommet (essence, variation, bois de bout).
// La pièce est orientée le long de son axe X local.
const _c = new THREE.Color();
export function applyWood(geo, tint, rand, endFactor = 0.74) {
  const pos = geo.attributes.position.array, nor = geo.attributes.normal.array;
  const n = pos.length / 3;
  const uv = new Float32Array(n * 2), col = new Float32Array(n * 3);
  const ou = rand(), ov = rand();
  const vari = 0.93 + rand() * 0.11;
  _c.set(tint);
  for (let i = 0; i < n; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    const ax = Math.abs(nor[i * 3]), ay = Math.abs(nor[i * 3 + 1]), az = Math.abs(nor[i * 3 + 2]);
    let u, v, k = vari;
    if (ax > 0.8) { u = z / SV; v = y / SV; k *= endFactor; }   // bois de bout
    else if (ay >= az) { u = x / SU; v = z / SV; }
    else { u = x / SU; v = y / SV; }
    uv[i * 2] = u + ou; uv[i * 2 + 1] = v + ov;
    col[i * 3] = _c.r * k; col[i * 3 + 1] = _c.g * k; col[i * 3 + 2] = _c.b * k;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

// Variante pour les arcs en lamellé-collé : le fil suit la courbe,
// les cernes de la texture dessinent les lamelles sur les flancs.
export function applyArcWood(geo, R, tint, rand) {
  const pos = geo.attributes.position.array, nor = geo.attributes.normal.array;
  const n = pos.length / 3;
  const uv = new Float32Array(n * 2), col = new Float32Array(n * 3);
  const ou = rand(), vari = 0.95 + rand() * 0.06;
  _c.set(tint);
  for (let i = 0; i < n; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    const nx = nor[i * 3], ny = nor[i * 3 + 1], nz = nor[i * 3 + 2];
    const r = Math.hypot(x, y), th = Math.atan2(y, x);
    const tx = -Math.sin(th), ty = Math.cos(th);
    let u, v, k = vari;
    if (Math.abs(nx * tx + ny * ty) > 0.85) { u = z / SV; v = r / SV; k *= 0.74; }
    else if (Math.abs(nz) > 0.7) { u = (th * R) / SU; v = r / SV * 0.62; }
    else { u = (th * R) / SU; v = z / SV; }
    uv[i * 2] = u + ou; uv[i * 2 + 1] = v;
    col[i * 3] = _c.r * k; col[i * 3 + 1] = _c.g * k; col[i * 3 + 2] = _c.b * k;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

/* ---------------------------------------------------------
   Pièce de bois définie par son axe A → B
   b = épaisseur (axe Z local), h = hauteur de section (axe Y local),
   up = direction souhaitée pour la hauteur de section.
   --------------------------------------------------------- */
const _m = new THREE.Matrix4();
export function member(kit, A, B, b, h, up = AX.Y, opts = {}) {
  const dir = V().subVectors(B, A);
  const len = dir.length();
  dir.divideScalar(len);
  const y = up.clone().addScaledVector(dir, -up.dot(dir));
  if (y.lengthSq() < 1e-8) {
    const alt = Math.abs(dir.x) < 0.9 ? AX.X : AX.Z;
    y.copy(alt).addScaledVector(dir, -alt.dot(dir));
  }
  y.normalize();
  const z = V().crossVectors(dir, y);
  _m.makeBasis(dir, y, z);

  const r = opts.round ?? Math.min(0.006, b * 0.12, h * 0.12);
  const geo = r > 0 ? new RoundedBoxGeometry(len, h, b, 1, r) : new THREE.BoxGeometry(len, h, b);
  if (opts.pivot === 'start') geo.translate(len / 2, 0, 0);

  let material = opts.material;
  if (!material) {
    applyWood(geo, opts.tint || kit.tint, kit.rand);
    material = kit.mat.wood;
  }
  const mesh = new THREE.Mesh(geo, material);
  if (opts.pivot === 'start') mesh.position.copy(A);
  else mesh.position.addVectors(A, B).multiplyScalar(0.5);
  mesh.quaternion.setFromRotationMatrix(_m);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.dims = { len, b, h };
  return mesh;
}

// Cylindre entre deux points (pieds de trépied, tirants…)
export function rod(A, B, r, material, seg = 12) {
  const dir = V().subVectors(B, A);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(r, r, len, seg);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.addVectors(A, B).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(AX.Y, dir.normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/* ---------------------------------------------------------
   Trait laser : ligne horizontale émissive projetée par un laser rotatif.
   --------------------------------------------------------- */
export function laserize(material, U) {
  material.extensions = { derivatives: true };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, U);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLaserWorld;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvLaserWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vLaserWorld;
uniform vec3 uLaserColor;
uniform vec3 uLaserOrigin;
uniform float uLaserY;
uniform float uLaserOn;
uniform float uLaserAngle;
uniform float uLaserWidth;`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{
  float dy = abs(vLaserWorld.y - uLaserY);
  float w = max(uLaserWidth, fwidth(vLaserWorld.y) * 0.9);
  float line = 1.0 - smoothstep(w * 0.45, w, dy);
  vec2 dl = vLaserWorld.xz - uLaserOrigin.xz;
  float ang = atan(dl.y, dl.x);
  float diff = abs(mod(ang - uLaserAngle + PI, 2.0 * PI) - PI);
  float spot = exp(-diff * diff * 160.0);
  totalEmissiveRadiance += uLaserColor * line * uLaserOn * (0.55 + 3.2 * spot);
}`);
  };
  material.customProgramCacheKey = () => 'laser-v1';
  return material;
}

/* ---------------------------------------------------------
   Kit : matériaux + uniformes laser propres à une vue
   --------------------------------------------------------- */
export function createKit({ seed = 1, tint = SPECIES.epicea } = {}) {
  const laser = {
    uLaserColor: { value: new THREE.Color('#1fe4ff') },
    uLaserOrigin: { value: V() },
    uLaserY: { value: 1.1 },
    uLaserOn: { value: 0 },
    uLaserAngle: { value: 0 },
    uLaserWidth: { value: 0.011 },
  };
  const std = (o) => new THREE.MeshStandardMaterial(o);
  const mat = {
    wood: laserize(std({ map: woodTexture(), vertexColors: true, roughness: 0.7, metalness: 0, envMapIntensity: 0.55 }), laser),
    plaster: laserize(std({ color: '#f3f2ee', roughness: 0.95, envMapIntensity: 0.4 }), laser),
    plasterWarm: laserize(std({ color: '#efe9e0', roughness: 0.95, envMapIntensity: 0.4 }), laser),
    concrete: laserize(std({ color: '#dcdbd6', roughness: 0.92, envMapIntensity: 0.4 }), laser),
    glass: std({ color: '#1e2428', roughness: 0.08, metalness: 0.3, envMapIntensity: 1.4 }),
    joinery: std({ color: '#d7dadc', roughness: 0.5, metalness: 0.1, envMapIntensity: 0.6 }),
    zinc: std({ color: '#50555a', roughness: 0.36, metalness: 0.7, envMapIntensity: 0.9 }),
    steel: std({ color: '#c3c7cb', roughness: 0.3, metalness: 0.9, envMapIntensity: 1 }),
    dark: std({ color: '#2b2e31', roughness: 0.55, metalness: 0.4 }),
    osb: laserize(std({ color: '#e3cfa6', roughness: 0.9, envMapIntensity: 0.4 }), laser),
    porcelain: new THREE.MeshPhysicalMaterial({ color: '#f6f6f5', roughness: 0.24, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1.1 }),
    visor: std({ color: '#0a0d0f', roughness: 0.12, metalness: 0.4, envMapIntensity: 1.4 }),
    cyan: new THREE.MeshBasicMaterial({ color: '#36ecff', toneMapped: false }),
    shadow: new THREE.ShadowMaterial({ opacity: 0.2 }),
    ghost: std({ color: '#c9ced2', roughness: 0.8, transparent: true, opacity: 0.16, depthWrite: false }),
  };
  return { rand: rng(seed), mat, laser, tint };
}

/* ---------------------------------------------------------
   Rendu, environnement, éclairage studio « fond infini »
   --------------------------------------------------------- */
export function createRenderer(canvas, { preserve = false } = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: true, premultipliedAlpha: true,
    preserveDrawingBuffer: preserve, powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return renderer;
}

const envCache = new WeakMap();
export function environment(renderer) {
  if (!envCache.has(renderer)) {
    const pm = new THREE.PMREMGenerator(renderer);
    envCache.set(renderer, pm.fromScene(new RoomEnvironment(renderer), 0.04).texture);
    pm.dispose();
  }
  return envCache.get(renderer);
}

// Lumière clé (soleil doux) + zénith ombré (profondeur sous les pièces) + ciel/sol.
export function studio(scene, { shadowSize = 2048, extent = 12, top = true, center = V() } = {}) {
  const hemi = new THREE.HemisphereLight('#ffffff', '#ddd9d1', 1.05);
  const key = new THREE.DirectionalLight('#fff4e8', 2.5);
  key.position.set(center.x + 9, center.y + 15, center.z + 10);
  key.target.position.copy(center);
  key.castShadow = true;
  key.shadow.mapSize.set(shadowSize, shadowSize);
  Object.assign(key.shadow.camera, { left: -extent, right: extent, top: extent, bottom: -extent, near: 1, far: 70 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  const fill = new THREE.DirectionalLight('#edf3ff', 0.5);
  fill.position.set(center.x - 10, center.y + 5, center.z - 7);
  fill.target.position.copy(center);
  scene.add(hemi, key, key.target, fill, fill.target);
  let zen = null;
  if (top) {
    zen = new THREE.DirectionalLight('#ffffff', 0.55);
    zen.position.set(center.x - 1.5, center.y + 22, center.z + 1);
    zen.target.position.copy(center);
    zen.castShadow = true;
    zen.shadow.mapSize.set(shadowSize / 2, shadowSize / 2);
    Object.assign(zen.shadow.camera, { left: -extent, right: extent, top: extent, bottom: -extent, near: 1, far: 60 });
    zen.shadow.bias = -0.0006;
    zen.shadow.normalBias = 0.03;
    scene.add(zen, zen.target);
  }
  return { hemi, key, fill, zen };
}

// Sol « attrape-ombres » : seul l'ombrage est dessiné, le fond reste celui de la page.
export function shadowFloor(kit, size = 90) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), kit.mat.shadow);
  m.rotation.x = -Math.PI / 2;
  m.receiveShadow = true;
  return m;
}

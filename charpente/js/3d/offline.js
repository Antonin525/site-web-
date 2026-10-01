// Rendu hors-ligne haute qualité des images fixes (img/*.webp).
// Accumule de nombreuses images avec :
//  - un léger décalage sous-pixel de la caméra (anticrénelage),
//  - une lumière clé déplacée sur un disque (ombres douces),
//  - une lumière « ciel » tirée au hasard sur l'hémisphère (occlusion ambiante).
import { THREE, V, createKit, createRenderer, environment, studio, shadowFloor } from './kit.js';
import { heroScene, anatomyScene, processScene, WORKS, ANATOMY_CAMERA } from './models.js';

const SHOTS = {
  hero(kit) {
    const s = heroScene(kit);
    kit.laser.uLaserOn.value = 1;
    kit.laser.uLaserAngle.value = 0.55;
    s.laser.head.rotation.y = -0.55;
    return s;
  },
  anatomie(kit) {
    const a = anatomyScene(kit, 'poincon');
    return { group: a.group, camera: ANATOMY_CAMERA, center: V(0, 2, -0.8), extent: 7 };
  },
  methode(kit) {
    const s = processScene(kit);
    s.apply(1, 0);
    const cam = s.cameraAt(1, { pos: V(), target: V() });
    return { group: s.group, camera: { ...cam, fov: s.fov }, center: s.center, extent: s.extent };
  },
  ...WORKS,
};
export const SHOT_NAMES = Object.keys(SHOTS);

function halton(i, b) {
  let f = 1, r = 0;
  while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); }
  return r;
}

export async function renderShot(name, { width = 1600, height = 1200, frames = 48, background = false } = {}) {
  const kit = createKit({ seed: 7 });
  const shot = SHOTS[name](kit);
  const canvas = document.createElement('canvas');
  const renderer = createRenderer(canvas, { preserve: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  const scene = new THREE.Scene();
  scene.environment = environment(renderer);
  scene.add(shot.group);
  const center = shot.center || V(0, 2, 0), E = shot.extent || 12;
  const lights = studio(scene, { shadowSize: 4096, extent: E, top: false, center });
  lights.hemi.intensity = 0.5;
  const sky = new THREE.DirectionalLight('#ffffff', 1.3);
  sky.castShadow = true;
  sky.shadow.mapSize.set(2048, 2048);
  Object.assign(sky.shadow.camera, { left: -E * 1.3, right: E * 1.3, top: E * 1.3, bottom: -E * 1.3, near: 1, far: 100 });
  sky.shadow.bias = -0.0006;
  sky.shadow.normalBias = 0.03;
  sky.target.position.copy(center);
  scene.add(sky, sky.target);
  const floor = shadowFloor(kit);
  kit.mat.shadow.opacity = 0.3;
  scene.add(floor);

  const cam = new THREE.PerspectiveCamera(shot.camera.fov || 28, width / height, 0.1, 200);
  cam.position.copy(shot.camera.pos);
  cam.lookAt(shot.camera.target);

  const gl = renderer.getContext();
  const buf = new Uint8Array(width * height * 4);
  const acc = new Float32Array(width * height * 4);
  const keyBase = lights.key.position.clone();
  const keyDir = keyBase.clone().sub(center).normalize();
  const u = V().crossVectors(keyDir, V(0, 1, 0)).normalize();
  const v = V().crossVectors(u, keyDir).normalize();
  for (let f = 0; f < frames; f++) {
    const i = f + 1;
    cam.setViewOffset(width, height, halton(i, 2) - 0.5, halton(i, 3) - 0.5, width, height);
    const r = Math.sqrt(halton(i, 5)) * 1.5, a = halton(i, 7) * Math.PI * 2;
    lights.key.position.copy(keyBase).addScaledVector(u, Math.cos(a) * r).addScaledVector(v, Math.sin(a) * r);
    const u1 = halton(i, 11), th = halton(i, 13) * Math.PI * 2, rr = Math.sqrt(u1);
    sky.position.copy(center).add(V(rr * Math.cos(th), Math.sqrt(1 - u1), rr * Math.sin(th)).multiplyScalar(45));
    renderer.render(scene, cam);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    for (let k = 0; k < buf.length; k++) acc[k] += buf[k];
    if (f % 4 === 3) await new Promise((res) => setTimeout(res));
  }

  const out = document.createElement('canvas');
  out.width = width; out.height = height;
  const ctx = out.getContext('2d');
  const img = ctx.createImageData(width, height);
  const D = img.data;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const si = ((height - 1 - y) * width + x) * 4, di = (y * width + x) * 4;
    const al = acc[si + 3] / frames;
    if (al < 0.5) { D[di + 3] = 0; continue; }
    const k = 255 / al / frames;
    D[di] = acc[si] * k; D[di + 1] = acc[si + 1] * k; D[di + 2] = acc[si + 2] * k; D[di + 3] = al;
  }
  ctx.putImageData(img, 0, 0);
  renderer.dispose();
  if (!background) return out.toDataURL('image/webp', 0.9);
  // Version opaque (partage social) : même dégradé que les cadres du site.
  const bg = document.createElement('canvas');
  bg.width = width; bg.height = height;
  const c2 = bg.getContext('2d');
  const grd = c2.createRadialGradient(width * 0.5, height * 0.36, 0, width * 0.5, height * 0.36, Math.max(width, height) * 0.75);
  grd.addColorStop(0, '#fbfbfa'); grd.addColorStop(0.55, '#ececea'); grd.addColorStop(1, '#d4d4d1');
  c2.fillStyle = grd;
  c2.fillRect(0, 0, width, height);
  c2.drawImage(out, 0, 0);
  return bg.toDataURL('image/jpeg', 0.9);
}

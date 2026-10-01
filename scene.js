// Rendu 3D de l'objet « produit » : un coude en cuivre + vanne ¼ de tour en laiton.
// La scène lit à chaque image un état cible (position, rotation, échelle, éclatement,
// opacité) calculé par main.js à partir du scroll, et s'en rapproche en douceur.
import * as THREE from './vendor/three.module.min.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

export function initScene(canvas, getTarget, pointer) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // Éclairage chaud : liseré venant du haut à droite, appoint crème en face.
  const rim = new THREE.DirectionalLight(0xffa463, 4.2);
  rim.position.set(4, 5, -3);
  const key = new THREE.DirectionalLight(0xffedd7, 1.1);
  key.position.set(-3, 2, 5);
  const under = new THREE.PointLight(0xdc5000, 6, 10, 2);
  under.position.set(0, -3, 2);
  scene.add(rim, key, under);

  const copper = new THREE.MeshStandardMaterial({ color: 0xc0744a, metalness: 1, roughness: 0.26, envMapIntensity: 0.55 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xc9a05a, metalness: 1, roughness: 0.34, envMapIntensity: 0.6 });
  const lacquer = new THREE.MeshStandardMaterial({ color: 0x2a170c, metalness: 0.3, roughness: 0.42, envMapIntensity: 0.5 });

  const root = new THREE.Group();      // piloté par le scroll
  const model = new THREE.Group();     // recentré
  root.add(model);
  scene.add(root);

  const parts = [];
  // Ajoute une pièce avec sa direction d'éclatement.
  function part(geo, mat, pos, rot, explode) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    m.userData.base = m.position.clone();
    m.userData.dir = new THREE.Vector3(...explode);
    model.add(m);
    parts.push(m);
    return m;
  }

  const R = 0.7, r = 0.22, HALF = Math.PI / 2;
  // Coude 90° : de (R,0) vers (0,R)
  part(new THREE.TorusGeometry(R, r, 48, 96, HALF), copper, [0, 0, 0], null, [0.55, 0.55, 0.5]);
  // Tube vertical (descend depuis (R,0))
  part(new THREE.CylinderGeometry(r, r, 2.0, 64, 1, true), copper, [R, -1.0, 0], null, [0.25, -1.1, 0]);
  // Tube horizontal (part vers la gauche depuis (0,R))
  part(new THREE.CylinderGeometry(r, r, 2.6, 64, 1, true), copper, [-1.3, R, 0], [0, 0, HALF], [-0.55, 0.15, -0.2]);
  // Manchons aux jonctions
  part(new THREE.CylinderGeometry(r * 1.2, r * 1.2, 0.3, 64), copper, [R, -0.15, 0], null, [0.35, -0.45, 0.25]);
  part(new THREE.CylinderGeometry(r * 1.2, r * 1.2, 0.3, 64), copper, [-0.15, R, 0], [0, 0, HALF], [-0.2, 0.45, 0.35]);
  // Écrou en bas du tube vertical
  part(new THREE.CylinderGeometry(r * 1.45, r * 1.45, 0.28, 6), brass, [R, -2.0, 0], null, [0.3, -1.9, 0.2]);

  // Vanne ¼ de tour sur le tube horizontal
  const vx = -1.5;
  const body = new THREE.SphereGeometry(0.4, 64, 48);
  body.scale(1.25, 1, 1);
  part(body, brass, [vx, R, 0], null, [-0.9, -0.1, 0.9]);
  part(new THREE.CylinderGeometry(0.33, 0.33, 0.22, 6), brass, [vx - 0.58, R, 0], [0, 0, HALF], [-1.6, -0.1, 0.9]);
  part(new THREE.CylinderGeometry(0.33, 0.33, 0.22, 6), brass, [vx + 0.58, R, 0], [0, 0, HALF], [-0.25, -0.1, 0.9]);
  part(new THREE.CylinderGeometry(0.075, 0.075, 0.42, 24), brass, [vx, R + 0.5, 0], null, [-0.9, 0.9, 0.9]);
  const handle = new THREE.Group();
  const bar = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.1, 0.24), lacquer);
  bar.position.x = 0.38;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.12, 32), brass);
  handle.add(bar, cap);
  handle.position.set(vx, R + 0.74, 0);
  handle.userData.base = handle.position.clone();
  handle.userData.dir = new THREE.Vector3(-0.9, 1.6, 0.9);
  model.add(handle);
  parts.push(handle);

  // Recentre le modèle et normalise sa taille
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  model.position.sub(center);
  const norm = 3 / Math.max(size.x, size.y, size.z);
  model.scale.setScalar(norm);
  model.position.multiplyScalar(norm);

  // État courant (lissé)
  const cur = { x: 0, y: -4, s: 0.6, rx: 0, ry: 0, rz: 0, ex: 0, o: 0 };
  const sm = { px: 0, py: 0 };

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Sur mobile on recule la caméra pour garder l'objet entier.
    camera.position.z = w < 900 ? 12 : 9;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  const clock = new THREE.Clock();
  let running = true;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) loop(); });

  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.1);
    const t = clock.elapsedTime;
    const tgt = getTarget();
    // Lissage indépendant du nombre d'images par seconde.
    const k = 1 - Math.pow(1 - 0.075, dt * 60);
    const kp = 1 - Math.pow(1 - 0.05, dt * 60);
    for (const key in cur) cur[key] += (tgt[key] - cur[key]) * k;
    sm.px += (pointer.x - sm.px) * kp;
    sm.py += (pointer.y - sm.py) * kp;

    canvas.style.opacity = cur.o.toFixed(3);
    if (cur.o < 0.01) return;               // rien à dessiner

    root.position.set(cur.x, cur.y + Math.sin(t * 0.8) * 0.06, 0);
    root.scale.setScalar(cur.s);
    root.rotation.set(
      cur.rx + sm.py * 0.25,
      cur.ry + sm.px * 0.45 + Math.sin(t * 0.35) * 0.12,
      cur.rz
    );
    for (const p of parts) p.position.copy(p.userData.base).addScaledVector(p.userData.dir, cur.ex);
    // La manette pivote pendant le démontage (fermeture de la vanne).
    handle.rotation.y = cur.ex * HALF;

    rim.position.x = 4 + sm.px * 2;
    renderer.render(scene, camera);
  }
  loop();
}

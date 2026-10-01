// Vues 3D temps réel : héros (maison qui se monte), anatomie interactive
// (fermes, étiquettes reliées aux pièces) et méthode pilotée par le scroll.
import { THREE, V, DEG, createKit, createRenderer, environment, studio, shadowFloor } from './kit.js';
import { heroScene, anatomyScene, processScene, ANATOMY_CAMERA } from './models.js';

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const damp = (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt));
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SVG = 'http://www.w3.org/2000/svg';

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

/* ---------- Boucle commune + qualité adaptative ---------- */
const views = new Set();
let quality = 1, slow = 0, last = 0;
export function tick(time, dt) {
  const now = performance.now();
  const frame = last ? now - last : 16;
  last = now;
  let rendered = 0;
  for (const v of views) rendered += v.tick(time, dt) ? 1 : 0;
  // Si le rendu peine (> 28 ms par image pendant ~2 s), on baisse la résolution.
  if (rendered && frame > 28 && frame < 200) slow++;
  else slow = Math.max(0, slow - 1);
  if (slow > 120 && quality > 0.55) {
    quality -= 0.15;
    slow = 0;
    for (const v of views) v.resize();
  }
}
export function fps() { return last ? Math.round(1000 / Math.max(1, performance.now() - last)) : 60; }

class BaseView {
  constructor(el, { fov = 28, maxDpr = 2, seed = 1 } = {}) {
    this.el = el;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'gl';
    el.prepend(this.canvas);          // sous les étiquettes et le HUD
    this.renderer = createRenderer(this.canvas);
    this.scene = new THREE.Scene();
    this.scene.environment = environment(this.renderer);
    this.camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 200);
    this.kit = createKit({ seed });
    this.maxDpr = maxDpr;
    this.visible = false;
    this.time = 0;
    this.pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; }, { rootMargin: '60px' }).observe(el);
    new ResizeObserver(() => this.resize()).observe(el);
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      this.pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      this.pointer.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    });
    el.addEventListener('pointerleave', () => { this.pointer.tx = 0; this.pointer.ty = 0; });
    views.add(this);
  }
  resize() {
    const w = this.el.clientWidth, h = this.el.clientHeight;
    if (!w || !h) return;
    this.w = w; this.h = h;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.maxDpr) * quality);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.onResize?.();
  }
  tick(time, dt) {
    if (!this.visible || !this.w) return false;
    this.time = time;
    this.pointer.x = damp(this.pointer.x, this.pointer.tx, 4, dt);
    this.pointer.y = damp(this.pointer.y, this.pointer.ty, 4, dt);
    this.update(time, dt);
    this.renderer.render(this.scene, this.camera);
    this.afterRender?.();
    if (!this.live) {
      this.live = true;
      this.el.classList.add('is-live');
      this.onLive?.();
    }
    return true;
  }
}

/* =========================================================
   HÉROS : la maison se monte, le laser tourne, la caméra respire
   ========================================================= */
export class HeroView extends BaseView {
  constructor(el, { onLive } = {}) {
    super(el, { fov: 27, maxDpr: 1.75, seed: 11 });
    this.onLive = onLive;
    const sc = (this.sc = heroScene(this.kit));
    this.scene.add(sc.group, shadowFloor(this.kit));
    studio(this.scene, { shadowSize: 2048, extent: sc.extent, center: sc.center });
    this.camera.fov = sc.camera.fov;
    this.target = sc.camera.target.clone();
    this.sph = new THREE.Spherical().setFromVector3(sc.camera.pos.clone().sub(this.target));
    this.intro = reduceMotion ? 1 : 0;     // progression du montage (animée par main.js)
    this.scroll = 0;                       // 0 → 1 quand le bandeau se referme
    this.drag = { on: false, x: 0, theta: 0, v: 0 };
    for (const p of sc.parts) {
      p.home = p.mesh.position.clone();
      p.drop = 6 + this.kit.rand() * 5;
    }
    this.maxOrder = Math.max(...sc.parts.map((p) => p.order));
    if (finePointer) this.bindDrag();
    this.resize();
  }
  bindDrag() {
    const el = this.el;
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      this.drag.on = true;
      this.drag.x = e.clientX;
      el.setPointerCapture(e.pointerId);
      el.classList.add('is-dragging');
    });
    el.addEventListener('pointermove', (e) => {
      if (!this.drag.on) return;
      const dx = e.clientX - this.drag.x;
      this.drag.x = e.clientX;
      this.drag.v = -dx * 0.004;
      this.drag.theta += this.drag.v;
    });
    const end = () => { this.drag.on = false; el.classList.remove('is-dragging'); };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }
  update(time, dt) {
    const { sc, kit } = this;
    const prog = this.intro * (this.maxOrder + 0.7);
    for (const p of sc.parts) {
      const t = easeOut(clamp01((prog - p.order) / 0.6));
      p.mesh.visible = t > 0.001;
      p.mesh.position.y = p.home.y + (1 - t) * p.drop;
    }
    const ang = reduceMotion ? 0.6 : time * 2.1;
    kit.laser.uLaserOn.value = clamp01((this.intro - 0.82) / 0.18);
    kit.laser.uLaserAngle.value = ang;
    sc.laser.head.rotation.y = -ang;

    if (!this.drag.on) {
      this.drag.theta += this.drag.v;
      this.drag.v *= Math.pow(0.02, dt);
    }
    this.drag.theta = Math.max(-1.1, Math.min(0.8, this.drag.theta));
    const s = this.sph.clone();
    const aspect = this.w / this.h;
    s.radius *= Math.pow(Math.max(1, 2.18 / aspect), 0.6) * (1 + this.scroll * 0.16);
    s.theta += this.drag.theta + (reduceMotion ? 0 : Math.sin(time * 0.12) * 0.05) + this.pointer.x * 0.07;
    s.phi += this.pointer.y * 0.03 - this.scroll * 0.07;
    this.camera.position.setFromSpherical(s).add(this.target);
    this.camera.lookAt(this.target);
  }
}

/* =========================================================
   ANATOMIE : ferme interactive, étiquettes reliées aux pièces
   ========================================================= */
const _v = new THREE.Vector3();
export class AnatomyView extends BaseView {
  constructor(el, { overlay, legend, onChange } = {}) {
    super(el, { fov: ANATOMY_CAMERA.fov, maxDpr: 2, seed: 5 });
    this.overlay = overlay;
    this.legend = legend;
    this.onChange = onChange;
    this.scene.add(shadowFloor(this.kit));
    studio(this.scene, { shadowSize: 2048, extent: 8, center: V(0, 2, -0.8) });
    this.root = new THREE.Group();
    this.scene.add(this.root);
    this.camera.position.copy(ANATOMY_CAMERA.pos);
    this.camera.lookAt(ANATOMY_CAMERA.target);
    this.items = [];
    this.current = [];
    this.explode = 0;
    this.explodeTarget = 0;
    this.rot = 0;
    this.rotV = 0;
    this.sway = 0;
    this.idleAt = 0;
    this.hl = null;
    this.selected = null;
    this.edgeMat = new THREE.LineBasicMaterial({ color: '#00c2dc', transparent: true, opacity: 0.95, depthTest: false });
    this.raycaster = new THREE.Raycaster();
    this.ndc = new THREE.Vector2(9, 9);
    this.bindInput();
    this.resize();
    this.setType('poincon', { instant: true });
  }

  bindInput() {
    const el = this.el;
    let down = null;
    el.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.callout')) return;
      down = { x: e.clientX, moved: 0 };
      this.dragging = true;
      el.setPointerCapture(e.pointerId);
      el.classList.add('is-dragging');
    });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      this.idleAt = this.time;
      if (!down) return;
      const dx = e.clientX - down.x;
      down.x = e.clientX;
      down.moved += Math.abs(dx);
      this.rotV = dx * 0.006;
      this.rot += this.rotV;
    });
    const end = (e) => {
      if (down && down.moved < 4 && e.type === 'pointerup') this.pick(true);
      down = null;
      this.dragging = false;
      el.classList.remove('is-dragging');
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('pointerleave', () => { this.ndc.set(9, 9); });
  }

  // Survol / clic direct sur une pièce 3D
  pick(click = false) {
    if (this.ndc.x > 2) { if (!click) this.setHighlight(this.selected); return; }
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const meshes = this.current.filter((p) => p.label).map((p) => p.mesh);
    const hit = this.raycaster.intersectObjects(meshes, false)[0];
    const part = hit && this.current.find((p) => p.mesh === hit.object);
    const key = part ? part.key : null;
    if (click) {
      this.selected = key && key !== this.selected ? key : null;
      this.setHighlight(this.selected);
    } else {
      this.setHighlight(key || this.selected);
    }
    this.el.classList.toggle('is-picking', !!key);
  }

  setType(type, { instant = false } = {}) {
    if (this.type === type) return;
    this.type = type;
    this.selected = null;
    this.setHighlight(null);
    const now = this.time;
    for (const p of this.current) { p.leaving = true; p.t0 = now + Math.random() * 0.12; }
    const asm = anatomyScene(this.kit, type);
    const off = asm.group.position.clone();
    const keys = new Set(asm.info.labels.map((l) => l.key));
    this.current = asm.parts.map((p, i) => {
      p.home.add(off);
      p.mesh.position.copy(p.home);
      p.t0 = now + (instant ? -10 : 0.3 + i * 0.016);
      p.label = keys.has(p.key);
      this.root.add(p.mesh);
      return p;
    });
    this.items.push(...this.current);
    this.info = asm.info;
    this.buildCallouts();
    this.onChange?.(type, asm.info);
  }

  setExplode(on) { this.explodeTarget = on ? 1 : 0; }

  setHighlight(key) {
    if (this.hl === key) return;
    this.hl = key;
    const { ghost } = this.kit.mat;
    for (const p of this.current) {
      const on = !key || p.key === key;
      if (!p.orig) p.orig = p.mesh.material;
      p.mesh.material = on ? p.orig : ghost;
      p.mesh.castShadow = on;
      if (key && p.key === key && p.mesh.userData.dims) {
        if (!p.edges) {
          const { len, h, b } = p.mesh.userData.dims;
          p.edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(len, h, b)), this.edgeMat);
          p.edges.renderOrder = 10;
          p.mesh.add(p.edges);
        }
        p.edges.visible = true;
      } else if (p.edges) p.edges.visible = false;
    }
    for (const c of this.callouts || []) {
      c.btn.classList.toggle('is-active', c.lab.key === key);
      c.leg?.classList.toggle('is-active', c.lab.key === key);
      c.g.classList.toggle('is-active', c.lab.key === key);
    }
    this.el.classList.toggle('has-highlight', !!key);
  }

  buildCallouts() {
    const { overlay, legend } = this;
    if (!overlay) return;
    overlay.innerHTML = '';
    if (legend) legend.innerHTML = '';
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('class', 'callouts__svg');
    overlay.appendChild(svg);
    this.svg = svg;
    const cols = { L: [], R: [] };
    this.callouts = this.info.labels.map((lab, i) => {
      const part = this.current.find((p) => p.key === lab.key && (lab.side == null || p.side === lab.side))
        || this.current.find((p) => p.key === lab.key);
      const n = String(i + 1).padStart(2, '0');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `callout callout--${lab.col === 'L' ? 'l' : 'r'}`;
      btn.innerHTML = `<span class="callout__name"><span class="callout__n">${n}</span>${lab.name}</span><span class="callout__note">${lab.note}</span>`;
      const enter = () => { this.overUI = true; this.setHighlight(lab.key); };
      const leave = () => { this.overUI = false; this.setHighlight(this.selected); };
      const toggle = () => { this.selected = this.selected === lab.key ? null : lab.key; this.setHighlight(this.selected); };
      btn.addEventListener('pointerenter', enter);
      btn.addEventListener('pointerleave', leave);
      btn.addEventListener('focus', enter);
      btn.addEventListener('blur', leave);
      btn.addEventListener('click', toggle);
      overlay.appendChild(btn);
      let leg = null;
      if (legend) {
        leg = document.createElement('li');
        leg.innerHTML = `<button type="button"><span class="mono">${n}</span>${lab.name}</button>`;
        leg.firstChild.addEventListener('click', toggle);
        legend.appendChild(leg);
      }
      const g = document.createElementNS(SVG, 'g');
      const line = document.createElementNS(SVG, 'polyline');
      const dot = document.createElementNS(SVG, 'circle');
      const num = document.createElementNS(SVG, 'text');
      dot.setAttribute('r', '3.5');
      num.textContent = n;
      g.append(line, dot, num);
      svg.appendChild(g);
      const dims = part?.mesh.userData.dims;
      const local = V(dims ? (lab.at || 0) * dims.len * 0.5 : 0, 0, 0);
      const c = { lab, part, btn, leg, g, line, dot, num, local };
      cols[lab.col === 'L' ? 'L' : 'R'].push(c);
      return c;
    });
    this.cols = cols;
    this.layoutCallouts();
  }

  layoutCallouts() {
    if (!this.cols || !this.h) return;
    const h = this.h, w = this.w;
    for (const key of ['L', 'R']) {
      const list = this.cols[key];
      const top = h * 0.14, span = h * 0.7;
      list.forEach((c, i) => {
        const y = list.length > 1 ? top + (span * i) / (list.length - 1) : h / 2;
        c.btn.style.top = `${y}px`;
        c.y = y;
        const bw = c.btn.offsetWidth;
        c.x = key === 'L' ? 28 + bw + 10 : w - 28 - bw - 10;
        c.side = key;
      });
    }
  }
  onResize() { this.layoutCallouts(); }

  update(time, dt) {
    this.explode = damp(this.explode, this.explodeTarget, 4.5, dt);
    if (!this.dragging) {
      this.rot += this.rotV;
      this.rotV *= Math.pow(0.03, dt);
    }
    const idle = !reduceMotion && time - this.idleAt > 2.5 && !this.dragging;
    this.sway = damp(this.sway, idle ? Math.sin(time * 0.32) * 0.26 : this.sway, 1.5, dt);
    this.root.rotation.y = this.rot + this.sway - 0.12;
    for (const p of this.items) {
      let k;
      if (p.leaving) {
        k = 1 - easeIO(clamp01((time - p.t0) / 0.55));
        if (k <= 0) { this.root.remove(p.mesh); p.dead = true; continue; }
      } else k = easeOut(clamp01((time - p.t0) / 0.9));
      const away = (1 - k) * 3 + (p.leaving ? 0 : this.explode * 1.25);
      p.mesh.position.copy(p.home).addScaledVector(p.dir, away);
      p.mesh.scale.setScalar(Math.max(k, 0.001));
      p.mesh.visible = k > 0.002;
    }
    if (this.items.some((p) => p.dead)) this.items = this.items.filter((p) => !p.dead);
    if (finePointer && !this.dragging && !this.overUI) this.pick(false);
  }

  afterRender() {
    if (!this.callouts) return;
    const w = this.w, h = this.h;
    for (const c of this.callouts) {
      if (!c.part) continue;
      _v.copy(c.local).applyMatrix4(c.part.mesh.matrixWorld).project(this.camera);
      const x = (_v.x * 0.5 + 0.5) * w, y = (-_v.y * 0.5 + 0.5) * h;
      const elbow = c.side === 'L' ? c.x + 22 : c.x - 22;
      c.line.setAttribute('points', `${c.x},${c.y} ${elbow},${c.y} ${x},${y}`);
      c.dot.setAttribute('cx', x);
      c.dot.setAttribute('cy', y);
      c.num.setAttribute('x', x + 7);
      c.num.setAttribute('y', y - 7);
    }
  }
}

/* =========================================================
   MÉTHODE : relevé → conception → taille → levage → couverture
   ========================================================= */
export class ProcessView extends BaseView {
  constructor(el) {
    super(el, { fov: 30, maxDpr: 1.75, seed: 3 });
    this.sc = processScene(this.kit);
    this.scene.add(this.sc.group, shadowFloor(this.kit));
    studio(this.scene, { shadowSize: 2048, extent: this.sc.extent, center: this.sc.center });
    this.camera.fov = this.sc.fov;
    this.p = 0;
    this.ps = 0;
    this.cam = { pos: V(), target: V() };
    this.resize();
  }
  setProgress(p) { this.p = p; }
  onResize() {
    this.sc.cloud.material.uniforms.uScale.value =
      (this.h * this.renderer.getPixelRatio()) / (2 * Math.tan((this.camera.fov * DEG) / 2));
  }
  update(time, dt) {
    this.ps = damp(this.ps, this.p, 5, dt);
    this.sc.apply(this.ps, time);
    this.sc.cameraAt(this.ps, this.cam);
    const aspect = this.w / this.h;
    const off = this.cam.pos.clone().sub(this.cam.target).multiplyScalar(Math.pow(Math.max(1, 1.33 / aspect), 0.55));
    off.applyAxisAngle(V(0, 1, 0), this.pointer.x * 0.08 + (reduceMotion ? 0 : Math.sin(time * 0.2) * 0.03));
    this.camera.position.copy(this.cam.target).add(off);
    this.camera.position.y += this.pointer.y * 0.4;
    this.camera.lookAt(this.cam.target);
  }
}

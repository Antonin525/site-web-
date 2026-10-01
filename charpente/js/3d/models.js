// Modèles procéduraux : fermes, toitures, maisons, halles… et scènes composées
// (héros, anatomie, méthode, ouvrages). Unités : mètres, Y vers le haut.
import { THREE, V, AX, DEG, SPECIES, member, rod, applyArcWood } from './kit.js';

const { X, Y } = AX;
export const PANNE = { b: 0.1, h: 0.2 };
const CHEV = { b: 0.065, h: 0.16 };
const LIT = { b: 0.045, h: 0.028 };

const mx = (v) => V(-v.x, v.y, v.z);                 // symétrie gauche → droite
const mn = (n, side) => (side < 0 ? n.clone() : V(-n.x, n.y, 0));
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const seg = (p, a, b) => clamp01((p - a) / (b - a));
const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

// Perpendiculaire « vers le haut » dans le plan XY d'une pièce A → B.
function upIn(A, B) {
  const d = V().subVectors(B, A).normalize();
  const u = V(-d.y, d.x, 0);
  if (u.y < -1e-6 || (Math.abs(u.y) < 1e-6 && u.x < 0)) u.negate();
  return u;
}
function shade(mesh) { mesh.castShadow = true; mesh.receiveShadow = true; return mesh; }
const push = (P, mesh, key, extra = {}) => { P.push({ mesh, key, ...extra }); return mesh; };

/* =========================================================
   FERMES
   ========================================================= */
export function poinconGeom(span = 8, pitch = 40) {
  const s = span / 2, t = Math.tan(pitch * DEG), cos = Math.cos(pitch * DEG);
  const tie = { b: 0.18, h: 0.24 }, raf = { b: 0.18, h: 0.22 }, kp = { b: 0.18, h: 0.18 };
  const st = { b: 0.14, h: 0.14 }, fa = { b: 0.16, h: 0.22 };
  const footL = V(-(s - 0.06), tie.h + raf.h / 2, 0);
  const apexY = footL.y + (s - 0.06) * t;
  const topL = V(-kp.h / 2, footL.y + (s - 0.06 - kp.h / 2) * t, 0);
  const d = V().subVectors(topL, footL).normalize();
  const nL = V(-d.y, d.x, 0);
  const ridgeTop = apexY + (raf.h / 2 + PANNE.h) / cos;   // plan de pose des chevrons au faîtage
  return { s, t, cos, tie, raf, kp, st, fa, footL, topL, d, nL, apexY, ridgeTop, kpTop: ridgeTop - fa.h };
}

function trussPoincon(kit, P, { span = 8, pitch = 40, tint } = {}) {
  const g = poinconGeom(span, pitch);
  const { s, tie, raf, kp, st } = g;
  const o = { tint };
  push(P, member(kit, V(-s - 0.3, tie.h / 2, 0), V(s + 0.3, tie.h / 2, 0), tie.b, tie.h, Y, o), 'entrait');
  for (const side of [-1, 1]) {
    const A = side < 0 ? g.footL : mx(g.footL), B = side < 0 ? g.topL : mx(g.topL);
    push(P, member(kit, A, B, raf.b, raf.h, upIn(A, B), o), 'arbaletrier', { side });
  }
  push(P, member(kit, V(0, tie.h + 0.015, 0), V(0, g.kpTop, 0), kp.b, kp.h, X, o), 'poincon');
  for (const side of [-1, 1]) {
    const A = side < 0 ? g.footL : mx(g.footL), B = side < 0 ? g.topL : mx(g.topL);
    const R = A.clone().lerp(B, 0.52).addScaledVector(mn(g.nL, side), -raf.h / 2 + 0.01);
    const S = V(side * kp.h / 2, tie.h + (g.apexY - tie.h) * 0.2, 0);
    push(P, member(kit, S, R, st.b, st.h, upIn(S, R), o), 'contrefiche', { side });
  }
  return g;
}

function trussFermette(kit, P, { span = 8, pitch = 35, tint } = {}) {
  const s = span / 2, t = Math.tan(pitch * DEG), cos = Math.cos(pitch * DEG);
  const b = 0.045, ch = 0.145, web = 0.095;
  const o = { tint, round: 0.003 };
  push(P, member(kit, V(-s - 0.22, ch / 2, 0), V(s + 0.22, ch / 2, 0), b, ch, Y, o), 'entrait');
  const heel = V(-s - 0.22, ch * 0.95, 0);
  const apex = V(0, heel.y + (s + 0.22) * t, 0);
  for (const side of [-1, 1]) {
    const A = side < 0 ? heel : mx(heel);
    push(P, member(kit, A, apex, b, ch, upIn(A, apex), o), 'arbaletrier', { side });
  }
  const under = ch / 2 / cos;
  const yTop = (x) => heel.y + (x - heel.x) * t - under;
  const T1 = V(-(s + 0.22) / 2, 0, 0); T1.y = yTop(T1.x);
  const B1 = V(-s / 3, ch, 0);
  const A = V(0, apex.y - under, 0);
  [[T1, B1], [B1, A], [A, mx(B1)], [mx(B1), mx(T1)]].forEach(([p, q], i) =>
    push(P, member(kit, p, q, b, web, upIn(p, q), o), 'diagonale', { side: i < 2 ? -1 : 1 }));
  const nodes = [V(-s + 0.02, ch * 0.95, 0), mx(V(-s + 0.02, ch * 0.95, 0)), B1, mx(B1), T1, mx(T1), V(0, apex.y - 0.1, 0)];
  for (const nd of nodes) for (const zf of [-1, 1]) {
    const plate = shade(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.003), kit.mat.steel));
    plate.position.set(nd.x, nd.y, zf * (b / 2 + 0.002));
    plate.userData.dims = { len: 0.2, b: 0.003, h: 0.15 };
    push(P, plate, 'connecteur', { side: Math.sign(nd.x) || 1 });
  }
  return { s, t, cos, heel, apex, ch, b };
}

function trussRetrousse(kit, P, { span = 8, pitch = 45, tint } = {}) {
  const s = span / 2, t = Math.tan(pitch * DEG), cos = Math.cos(pitch * DEG);
  const tie = { b: 0.18, h: 0.24 }, raf = { b: 0.16, h: 0.22 };
  const o = { tint };
  push(P, member(kit, V(-s - 0.3, tie.h / 2, 0), V(s + 0.3, tie.h / 2, 0), tie.b, tie.h, Y, o), 'entrait');
  const foot = V(-(s - 0.06), tie.h + raf.h / 2, 0);
  const apexY = foot.y + (s - 0.06) * t;
  const top = V(-0.05, apexY - 0.05 * t, 0);
  const axis = (x) => foot.y + (x - foot.x) * t;
  const under = raf.h / 2 / cos;
  for (const side of [-1, 1]) {
    const A = side < 0 ? foot : mx(foot), B = side < 0 ? top : mx(top);
    push(P, member(kit, A, B, raf.b, raf.h, upIn(A, B), o), 'arbaletrier', { side });
  }
  const yC = tie.h + (apexY - tie.h) * 0.6, cH = 0.2;
  const xC = foot.x + (yC - foot.y) / t;
  push(P, member(kit, V(xC, yC, 0), V(-xC, yC, 0), 0.16, cH, Y, o), 'retrousse');
  for (const side of [-1, 1]) {
    const x = side * (s - 1.05);
    push(P, member(kit, V(x, tie.h, 0), V(x, axis(-Math.abs(x)) - under + 0.02, 0), 0.14, 0.14, X, o), 'jambette', { side });
  }
  for (const side of [-1, 1]) {
    const xr = foot.x + (yC - 0.85 + under - foot.y) / t;
    const A = V(xC + 0.7, yC - cH / 2, 0), B = V(xr, yC - 0.85, 0);
    const AA = side < 0 ? A : mx(A), BB = side < 0 ? B : mx(B);
    push(P, member(kit, AA, BB, 0.12, 0.12, upIn(AA, BB), o), 'aisselier', { side });
  }
  push(P, member(kit, V(0, yC + cH / 2, 0), V(0, apexY - under, 0), 0.14, 0.14, X, o), 'aiguille');
  const d = V().subVectors(top, foot).normalize();
  return { s, t, cos, footL: foot, topL: top, raf, tie, d, nL: V(-d.y, d.x, 0) };
}

/* =========================================================
   ANATOMIE : une ferme + amorces de toiture
   ========================================================= */
export const TRUSS_TYPES = {
  poincon: {
    title: 'Ferme à poinçon',
    spec: ['PORTÉE 8,00 M', 'PENTE 40°', 'ENTRAIT 18 × 24 CM', 'CHÊNE · DOUGLAS'],
    text: 'La ferme traditionnelle par excellence. Assemblée à tenons, mortaises et chevilles, elle franchit de grandes portées sans appui intermédiaire et reste apparente sous les combles.',
    labels: [
      { key: 'faitiere', col: 'R', at: 0.7, name: 'Faîtière', note: 'La panne du sommet.' },
      { key: 'poincon', col: 'R', at: 0.25, name: 'Poinçon', note: 'Pièce verticale, suspendue au faîtage.' },
      { key: 'chevron', col: 'R', side: 1, at: -0.3, name: 'Chevrons', note: 'Support direct de la couverture.' },
      { key: 'arbaletrier', col: 'R', side: 1, at: 0.1, name: 'Arbalétriers', note: 'Pièces inclinées qui portent les pannes.' },
      { key: 'panne', col: 'L', side: -1, at: 0.8, name: 'Pannes', note: 'Poutres filantes qui reçoivent les chevrons.' },
      { key: 'contrefiche', col: 'L', side: -1, name: 'Contrefiches', note: 'Raidissent les arbalétriers à mi-portée.' },
      { key: 'entrait', col: 'L', at: -0.62, name: 'Entrait', note: 'Tirant horizontal qui empêche la ferme de s’ouvrir.' },
      { key: 'sabliere', col: 'L', side: -1, at: 0.85, name: 'Sablières', note: 'Posées sur les murs, elles reçoivent la ferme.' },
    ],
  },
  fermette: {
    title: 'Fermette industrielle',
    spec: ['PORTÉE 8,00 M', 'PENTE 35°', 'SECTIONS 36 × 97 MM', 'CONNECTEURS GALVANISÉS'],
    text: 'Des fermes légères posées tous les 60 cm, assemblées par connecteurs métalliques. Rapide et économique, idéale pour les combles perdus.',
    labels: [
      { key: 'liteau', col: 'R', side: 1, at: 0.9, name: 'Liteaux', note: 'Reçoivent directement tuiles ou ardoises.' },
      { key: 'diagonale', col: 'R', side: 1, name: 'Diagonales en W', note: 'Triangulent la ferme pour la rendre indéformable.' },
      { key: 'entrait', col: 'R', at: 0.55, name: 'Membrure basse', note: 'Reprend la poussée et porte le plafond.' },
      { key: 'arbaletrier', col: 'L', side: -1, at: 0.15, name: 'Membrures hautes', note: 'Elles donnent la pente et portent les liteaux.' },
      { key: 'connecteur', col: 'L', side: -1, name: 'Connecteurs', note: 'Plaques crantées pressées en atelier.' },
      { key: 'sabliere', col: 'L', side: -1, at: 0.85, name: 'Sablières', note: 'Lisses d’appui fixées sur les murs.' },
    ],
  },
  retrousse: {
    title: 'Ferme à entrait retroussé',
    spec: ['PORTÉE 8,00 M', 'PENTE 45°', 'COMBLES HABITABLES', 'ÉPICÉA C24'],
    text: 'L’entrait est remonté pour libérer le volume : les combles deviennent une pièce à vivre, sous une charpente apparente.',
    labels: [
      { key: 'aiguille', col: 'R', at: 0.3, name: 'Aiguille', note: 'Courte pièce verticale sous le faîtage.' },
      { key: 'retrousse', col: 'R', at: 0.45, name: 'Entrait retroussé', note: 'Remonté pour dégager la hauteur sous plafond.' },
      { key: 'panne', col: 'R', side: 1, at: 0.8, name: 'Pannes', note: 'Filantes d’un pignon à l’autre.' },
      { key: 'jambette', col: 'R', side: 1, name: 'Jambettes', note: 'Petits poteaux qui soulagent les arbalétriers.' },
      { key: 'chevron', col: 'L', side: -1, at: -0.3, name: 'Chevrons', note: 'Support direct de la couverture.' },
      { key: 'arbaletrier', col: 'L', side: -1, at: 0.05, name: 'Arbalétriers', note: 'Ils forment la pente et portent les pannes.' },
      { key: 'aisselier', col: 'L', side: -1, name: 'Aisseliers', note: 'Bracons qui rigidifient l’angle.' },
      { key: 'entrait', col: 'L', at: -0.6, name: 'Entrait', note: 'Devient la solive porteuse du plancher.' },
    ],
  },
};

export function anatomyScene(kit, type = 'poincon') {
  const P = [];
  let g;
  if (type === 'fermette') g = trussFermette(kit, P, { span: 8, pitch: 35 });
  else if (type === 'retrousse') g = trussRetrousse(kit, P, { span: 8, pitch: 45 });
  else g = trussPoincon(kit, P, { span: 8, pitch: 40 });
  const s = 4, z0 = -2.5, z1 = 0.32;            // amorces vers l'arrière (vue en coupe)
  for (const side of [-1, 1]) {
    push(P, member(kit, V(side * (s - 0.06), -0.08, z0), V(side * (s - 0.06), -0.08, z1), 0.16, 0.16, Y), 'sabliere', { side });
  }
  if (type === 'fermette') {
    const d = V().subVectors(g.apex, g.heel).normalize(), n = V(-d.y, d.x, 0);
    const len = g.heel.distanceTo(g.apex);
    for (const side of [-1, 1]) for (let k = 0.4; k < len - 0.08; k += 0.42) {
      const p = g.heel.clone().addScaledVector(d, k).addScaledVector(n, g.ch / 2 + LIT.h / 2);
      const pp = side < 0 ? p : mx(p);
      push(P, member(kit, V(pp.x, pp.y, z0), V(pp.x, pp.y, z1), LIT.b, LIT.h, mn(n, side), { round: 0.003 }), 'liteau', { side });
    }
  } else {
    const { footL: foot, topL: top, raf, d, nL: n } = g;
    for (const f of [0.34, 0.72]) for (const side of [-1, 1]) {
      const p = foot.clone().lerp(top, f).addScaledVector(n, raf.h / 2 + PANNE.h / 2);
      const pp = side < 0 ? p : mx(p);
      push(P, member(kit, V(pp.x, pp.y, z0 - 0.1), V(pp.x, pp.y, z1 + 0.1), PANNE.b, PANNE.h, mn(n, side)), 'panne', { side });
    }
    if (type === 'poincon') {
      const y = g.ridgeTop - g.fa.h / 2;
      push(P, member(kit, V(0, y, z0 - 0.1), V(0, y, z1 + 0.1), g.fa.b, g.fa.h, Y), 'faitiere');
    }
    const off = raf.h / 2 + PANNE.h + CHEV.h / 2;
    const start = foot.clone().addScaledVector(d, -0.55).addScaledVector(n, off);
    const kEnd = -(foot.x + n.x * off) / d.x;
    const end = foot.clone().addScaledVector(d, kEnd).addScaledVector(n, off);
    for (const z of [-0.3, -0.9, -1.5, -2.1]) for (const side of [-1, 1]) {
      const A = side < 0 ? start : mx(start), B = side < 0 ? end : mx(end);
      push(P, member(kit, V(A.x, A.y, z), V(B.x, B.y, z), CHEV.b, CHEV.h, mn(n, side)), 'chevron', { side });
    }
  }
  for (const side of [-1, 1]) {
    const wall = shade(new THREE.Mesh(new THREE.BoxGeometry(0.34, 1, z1 - z0 + 0.2), kit.mat.plaster));
    wall.position.set(side * (s - 0.06), -0.66, (z0 + z1) / 2);
    push(P, wall, 'mur', { side });
  }

  const group = new THREE.Group();
  group.position.y = 1.16;
  const centroid = V(0, type === 'fermette' ? 1.3 : 1.7, 0);
  const zKick = { panne: -0.8, chevron: -1.1, liteau: -0.9, faitiere: -0.6, connecteur: 0.7, sabliere: -0.2 };
  P.forEach((p, i) => {
    group.add(p.mesh);
    p.home = p.mesh.position.clone();
    const dir = p.home.clone().sub(centroid);
    dir.z = 0;
    dir.normalize().multiplyScalar(0.9);
    dir.z = zKick[p.key] ?? (i % 2 ? 0.45 : -0.45);
    if (p.key === 'mur') dir.set(p.side * 0.45, -0.55, 0);
    p.dir = dir;
  });
  return { group, parts: P, type, info: TRUSS_TYPES[type] };
}

/* =========================================================
   TOITURE COMPLÈTE (fermes à poinçon, pannes, chevrons, liteaux, zinc)
   ========================================================= */
export function roof(kit, {
  span = 7.7, length = 10, pitch = 40, baseY = 3, trussZ = [-1.7, 1.7], purlins = [0.34, 0.72],
  spacing = 0.6, eave = 0.5, gable = 0.4, battens = true, cover = 0,
  tint, trussTints = [], chevronTint = null, purlinTint = null,
} = {}) {
  const group = new THREE.Group();
  group.position.y = baseY + 0.16;
  const parts = [];
  const add = (mesh, cat, extra = {}) => { group.add(mesh); parts.push({ mesh, cat, ...extra }); return mesh; };
  const g = poinconGeom(span, pitch);
  const { s, raf, d, nL: n } = g;
  const zA = -length / 2 - gable, zB = length / 2 + gable;

  for (const side of [-1, 1]) add(member(kit, V(side * s, -0.08, -length / 2 - 0.05), V(side * s, -0.08, length / 2 + 0.05), 0.16, 0.16, Y, { tint }), 'sabliere', { side });
  trussZ.forEach((z, i) => {
    const P = [];
    trussPoincon(kit, P, { span, pitch, tint: trussTints[i] || tint });
    for (const p of P) { p.mesh.position.z += z; add(p.mesh, 'ferme', { truss: i, key: p.key }); }
  });
  for (const f of purlins) for (const side of [-1, 1]) {
    const p = g.footL.clone().lerp(g.topL, f).addScaledVector(n, raf.h / 2 + PANNE.h / 2);
    const pp = side < 0 ? p : mx(p);
    add(member(kit, V(pp.x, pp.y, zA), V(pp.x, pp.y, zB), PANNE.b, PANNE.h, mn(n, side), { tint: purlinTint || tint }), 'panne', { side, f });
  }
  const yf = g.ridgeTop - g.fa.h / 2;
  add(member(kit, V(0, yf, zA), V(0, yf, zB), g.fa.b, g.fa.h, Y, { tint: purlinTint || tint }), 'faitiere');

  const off = raf.h / 2 + PANNE.h + CHEV.h / 2;
  const start = g.footL.clone().addScaledVector(d, -eave).addScaledVector(n, off);
  const kEnd = -(g.footL.x + n.x * off) / d.x;
  const end = g.footL.clone().addScaledVector(d, kEnd).addScaledVector(n, off);
  const zs = [];
  for (let z = zA + 0.04; z <= zB - 0.04; z += spacing) zs.push(z);
  if (zB - 0.04 - zs[zs.length - 1] > 0.15) zs.push(zB - 0.04);
  zs.forEach((z, i) => {
    for (const side of [-1, 1]) {
      const A = side < 0 ? start : mx(start), B = side < 0 ? end : mx(end);
      const t = chevronTint ? chevronTint(z) : tint;
      add(member(kit, V(A.x, A.y, z), V(B.x, B.y, z), CHEV.b, CHEV.h, mn(n, side), { tint: t }), 'chevron', { side, i, z });
    }
  });

  const chevLen = start.distanceTo(end);
  if (battens) {
    let k = 0;
    for (let a = 0.12; a < chevLen - 0.05; a += 0.34, k++) for (const side of [-1, 1]) {
      const p = start.clone().addScaledVector(d, a).addScaledVector(n, CHEV.h / 2 + LIT.h / 2);
      const pp = side < 0 ? p : mx(p);
      add(member(kit, V(pp.x, pp.y, zA), V(pp.x, pp.y, zB), LIT.b, LIT.h, mn(n, side), { tint, pivot: 'start', round: 0.003 }), 'liteau', { side, k });
    }
  }
  if (cover > 0) {
    const zc0 = zA - 0.02, zc1 = zA + (zB - zA) * cover;
    const covOff = CHEV.h / 2 + LIT.h + 0.012;
    for (const side of [-1, 1]) {
      const A0 = start.clone().addScaledVector(d, -0.03).addScaledVector(n, covOff);
      const B0 = end.clone().addScaledVector(n, covOff);
      const A = side < 0 ? A0 : mx(A0), B = side < 0 ? B0 : mx(B0), nn = mn(n, side);
      const zm = (zc0 + zc1) / 2;
      add(member(kit, V(A.x, A.y, zm), V(B.x, B.y, zm), zc1 - zc0, 0.022, nn, { material: kit.mat.zinc, pivot: 'start', round: 0.004 }), 'couverture', { side });
      for (let z = zc0 + 0.25; z < zc1 - 0.1; z += 0.5) {
        const a = V(A.x, A.y, z).addScaledVector(nn, 0.026), b = V(B.x, B.y, z).addScaledVector(nn, 0.026);
        add(member(kit, a, b, 0.02, 0.034, nn, { material: kit.mat.zinc, pivot: 'start', round: 0.004 }), 'couverture', { side, seam: true });
      }
    }
  }
  return { group, parts, g, start, end, zA, zB };
}

/* =========================================================
   MAISON MAÇONNÉE (murs enduits, pignons, baies)
   ========================================================= */
// Menuiserie : dormant clair + vitrage sombre, en saillie légère sur le mur.
function windowUnit(kit, w, h, x, y, z, axis) {
  const g = new THREE.Group();
  const sz = (a, b, d) => (axis === 'x' ? new THREE.BoxGeometry(d, b, a) : new THREE.BoxGeometry(a, b, d));
  const frame = shade(new THREE.Mesh(sz(w + 0.12, h + 0.12, 0.035), kit.mat.joinery));
  const pane = shade(new THREE.Mesh(sz(w, h, 0.05), kit.mat.glass));
  g.add(frame, pane);
  g.position.set(x, y, z);
  return g;
}
export function masonryHouse(kit, { width = 8, length = 10, wallTop = 3, pitch = 40, t = 0.3, base = 0.25, material, windows = true } = {}) {
  const group = new THREE.Group();
  const mat = material || kit.mat.plaster;
  const walls = [];
  const slab = shade(new THREE.Mesh(new THREE.BoxGeometry(width + 1.4, base, length + 1.4), kit.mat.concrete));
  slab.position.y = base / 2;
  group.add(slab);
  const W2 = width / 2, L2 = length / 2, h = wallTop - base;
  const glass = (w, hh, x, y, z, axis) => windowUnit(kit, w, hh, x, y, z, axis);
  for (const side of [-1, 1]) {
    const geo = new THREE.BoxGeometry(t, h, length);
    geo.translate(0, h / 2, 0);
    const m = shade(new THREE.Mesh(geo, mat));
    m.position.set(side * (W2 - t / 2), base, 0);
    if (windows) for (const z of [-3, 0, 3]) m.add(glass(1.1, 1.35, side * (t / 2 + 0.008), 0.85 + 0.675, z, 'x'));
    group.add(m);
    walls.push(m);
  }
  const rg = poinconGeom(width - t, pitch);
  const ridgeW = wallTop + 0.16 + rg.ridgeTop;
  const yAt = (x) => ridgeW - Math.abs(x) * rg.t;
  for (const side of [-1, 1]) {
    const sh = new THREE.Shape();
    sh.moveTo(-W2 + t, 0); sh.lineTo(W2 - t, 0); sh.lineTo(W2 - t, h); sh.lineTo(W2, h);
    sh.lineTo(W2, yAt(W2) - base); sh.lineTo(0, yAt(0) - base); sh.lineTo(-W2, yAt(-W2) - base);
    sh.lineTo(-W2, h); sh.lineTo(-W2 + t, h); sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false });
    geo.translate(0, 0, -t / 2);
    const m = shade(new THREE.Mesh(geo, mat));
    m.position.set(0, base, side * (L2 - t / 2));
    if (windows) {
      const zf = side * (t / 2 + 0.008);
      if (side > 0) {
        m.add(glass(1.0, 2.15, 1.7, 1.075, zf, 'z'));
        m.add(glass(1.2, 1.35, -1.6, 0.85 + 0.675, zf, 'z'));
      } else {
        m.add(glass(0.9, 0.9, 0, 3.9, zf, 'z'));
      }
    }
    group.add(m);
    walls.push(m);
  }

  // Échantillonnage de surfaces pour le nuage de points du relevé laser.
  function samplePoints(count, rand) {
    const pts = [];
    const areaLong = length * h, gableH = ridgeW - base;
    const total = areaLong * 2 + width * gableH * 1.1 + 40;
    const nLong = Math.round(count * areaLong / total), nGable = Math.round(count * width * gableH * 0.55 / total);
    for (const side of [-1, 1]) for (let i = 0; i < nLong; i++) pts.push(side * W2, base + rand() * h, -L2 + rand() * length);
    for (const side of [-1, 1]) for (let i = 0; i < nGable * 2; i++) {
      const x = -W2 + rand() * width, y = base + rand() * gableH;
      if (y - base <= h || y <= yAt(x)) pts.push(x, y, side * L2);
    }
    const nGround = count - pts.length / 3;
    for (let i = 0; i < nGround; i++) {
      const a = rand() * Math.PI * 2, r = 5 + Math.sqrt(rand()) * 6;
      const x = Math.cos(a) * r, z = Math.sin(a) * r * 1.15;
      if (Math.abs(x) < W2 + 0.7 && Math.abs(z) < L2 + 0.7) pts.push(x, base, z);
      else pts.push(x, 0.005, z);
    }
    return new Float32Array(pts);
  }
  return { group, walls, slab, ridgeW, samplePoints };
}

/* =========================================================
   OSSATURE BOIS : murs à montants, baies, pignons
   ========================================================= */
function frameWall(kit, add, { from, to, base, topAt, rake = null, openings = [], spacing = 0.6, tint, cat = 'mur' }) {
  const T = 0.145, SW = 0.045, PL = 0.045;
  const along = V(to.x - from.x, 0, to.z - from.z);
  const len = along.length();
  along.divideScalar(len);
  const nrm = V(along.z, 0, -along.x);
  const at = (s, y) => V(from.x + along.x * s, y, from.z + along.z * s);
  const o = { tint };
  add(member(kit, at(0, base + PL / 2), at(len, base + PL / 2), T, PL, Y, o), cat);
  if (!rake) {
    const yt = topAt(0);
    add(member(kit, at(0, yt - PL / 2), at(len, yt - PL / 2), T, PL, Y, o), cat);
    add(member(kit, at(0, yt - PL * 1.5), at(len, yt - PL * 1.5), T, PL, Y, o), cat);
  } else if (rake === 'peak') {
    const mid = len / 2;
    add(member(kit, at(0, topAt(0) - PL / 2), at(mid, topAt(mid) - PL / 2), T, PL, Y, o), cat);
    add(member(kit, at(mid, topAt(mid) - PL / 2), at(len, topAt(len) - PL / 2), T, PL, Y, o), cat);
  } else {
    add(member(kit, at(0, topAt(0) - PL / 2), at(len, topAt(len) - PL / 2), T, PL, Y, o), cat);
  }
  const studTop = (s) => topAt(s) - (rake ? PL * 1.2 : PL * 2);
  const stud = (s, y0, y1) => { if (y1 - y0 > 0.06) add(member(kit, at(s, y0), at(s, y1), SW, T, nrm, o), cat); };
  const inOpening = (s) => openings.find((op) => s > op.s0 - SW * 1.5 && s < op.s1 + SW * 1.5);
  const pos = [];
  for (let s = SW / 2; s < len - SW / 2 + 1e-6; s += spacing) pos.push(s);
  if (len - SW / 2 - pos[pos.length - 1] > 0.12) pos.push(len - SW / 2);
  for (const s of pos) {
    const op = inOpening(s);
    if (!op) { stud(s, base + PL, studTop(s)); continue; }
    if (s > op.s0 + SW && s < op.s1 - SW) {
      if (op.sill > 0) stud(s, base + PL, base + op.sill - PL);
      stud(s, base + op.head + 0.22, studTop(s));
    }
  }
  for (const op of openings) {
    stud(op.s0 - SW / 2, base + PL, studTop(op.s0 - SW / 2));
    stud(op.s1 + SW / 2, base + PL, studTop(op.s1 + SW / 2));
    stud(op.s0 + SW / 2, base + PL, base + op.head);
    stud(op.s1 - SW / 2, base + PL, base + op.head);
    add(member(kit, at(op.s0, base + op.head + 0.11), at(op.s1, base + op.head + 0.11), T, 0.22, Y, o), cat);
    if (op.sill > 0) add(member(kit, at(op.s0 + SW, base + op.sill - PL / 2), at(op.s1 - SW, base + op.sill - PL / 2), T, PL, Y, o), cat);
  }
}

export function frameHouse(kit, { width = 7.2, length = 10, eave = 2.75, pitch = 35, base = 0.25, tint = SPECIES.epicea } = {}) {
  const group = new THREE.Group();
  const parts = [];
  const add = (mesh, cat, extra = {}) => { group.add(mesh); parts.push({ mesh, cat, ...extra }); return mesh; };
  const slab = shade(new THREE.Mesh(new THREE.BoxGeometry(width + 0.9, base, length + 0.9), kit.mat.concrete));
  slab.position.y = base / 2;
  group.add(slab);
  const W2 = width / 2, L2 = length / 2, T = 0.145, tp = base + eave;
  const t = Math.tan(pitch * DEG), cos = Math.cos(pitch * DEG);
  const xc = W2 - T / 2;
  const under = (x) => tp + (xc - Math.abs(x)) * t;      // sous-face des chevrons
  const flat = () => tp;

  frameWall(kit, add, { from: V(xc, 0, L2), to: V(xc, 0, -L2), base, topAt: flat, tint,
    openings: [{ s0: 1.2, s1: 3.4, sill: 0.9, head: 2.15 }, { s0: 4.6, s1: 5.6, sill: 0, head: 2.15 }, { s0: 6.6, s1: 8.8, sill: 0.9, head: 2.15 }] });
  frameWall(kit, add, { from: V(-xc, 0, -L2), to: V(-xc, 0, L2), base, topAt: flat, tint,
    openings: [{ s0: 2.0, s1: 3.2, sill: 0.9, head: 2.15 }, { s0: 6.5, s1: 7.7, sill: 0.9, head: 2.15 }] });
  const gx = W2 - T;
  const gableTop = (x0) => (s) => under(x0 + s) - 0.24;
  frameWall(kit, add, { from: V(-gx, 0, L2 - T / 2), to: V(gx, 0, L2 - T / 2), base, topAt: gableTop(-gx), rake: 'peak', tint,
    openings: [{ s0: 2.0, s1: 4.9, sill: 0.25, head: 2.3 }] });
  frameWall(kit, add, { from: V(gx, 0, -L2 + T / 2), to: V(-gx, 0, -L2 + T / 2), base, topAt: (s) => under(gx - s) - 0.24, rake: 'peak', tint,
    openings: [{ s0: 3.0, s1: 3.9, sill: 1.0, head: 2.1 }] });

  const zA = -L2 - 0.45, zB = L2 + 0.45;
  add(member(kit, V(0, under(0) - 0.18, zA), V(0, under(0) - 0.18, zB), 0.12, 0.36, Y, { tint: SPECIES.lamelle }), 'faitiere');
  for (const side of [-1, 1]) {
    const x = side * xc / 2;
    add(member(kit, V(x, under(x) - 0.12, zA), V(x, under(x) - 0.12, zB), 0.1, 0.24, Y, { tint }), 'panne', { side });
  }
  const zs = [];
  for (let z = zA + 0.03; z <= zB - 0.03; z += 0.6) zs.push(z);
  if (zB - 0.03 - zs[zs.length - 1] > 0.15) zs.push(zB - 0.03);
  for (const z of zs) for (const side of [-1, 1]) {
    const x0 = side * (xc + 0.55);
    const A = V(x0, under(x0) + 0.1 / cos, z), B = V(0, under(0) + 0.1 / cos, z);
    add(member(kit, A, B, 0.06, 0.2, upIn(A, B), { tint }), 'chevron', { side, z });
  }
  return { group, parts, ridgeY: under(0) };
}

/* =========================================================
   ACCESSOIRES : pile de bois, laser rotatif sur trépied
   ========================================================= */
export function lumberStack(kit, { layers = 4, per = 6, len = 4.4, b = 0.1, h = 0.2, gap = 0.035, tint = SPECIES.douglas } = {}) {
  const g = new THREE.Group();
  let y = 0;
  const w = per * (b + gap);
  for (let l = 0; l < layers; l++) {
    for (const z of [-len * 0.38, 0, len * 0.38]) g.add(member(kit, V(-w / 2 - 0.05, y + 0.0175, z), V(w / 2 + 0.05, y + 0.0175, z), 0.035, 0.035, Y, { tint: SPECIES.epicea, round: 0.003 }));
    y += 0.035;
    const count = l === layers - 1 ? per - 2 : per;
    for (let i = 0; i < count; i++) {
      const x = -w / 2 + b / 2 + gap / 2 + i * (b + gap);
      const dz = (kit.rand() - 0.5) * 0.12;
      g.add(member(kit, V(x, y + h / 2, -len / 2 + dz), V(x, y + h / 2, len / 2 + dz), b, h, Y, { tint }));
    }
    y += h;
  }
  return g;
}

export function laserTripod(kit, { height = 1.12 } = {}) {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3 + 0.5;
    g.add(rod(V(Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5), V(Math.cos(a) * 0.05, height - 0.11, Math.sin(a) * 0.05), 0.013, kit.mat.dark));
  }
  const plate = shade(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.035, 32), kit.mat.dark));
  plate.position.y = height - 0.1;
  const body = shade(new THREE.Mesh(new THREE.CylinderGeometry(0.094, 0.1, 0.17, 48), kit.mat.porcelain));
  body.position.y = height - 0.0;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0975, 0.0035, 8, 64), kit.mat.cyan);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = height + 0.07;
  const head = new THREE.Group();
  head.position.y = height + 0.115;
  const band = shade(new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.088, 0.06, 48), kit.mat.visor));
  const aperture = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.026, 0.03), kit.mat.cyan);
  aperture.position.x = 0.087;
  const cap = shade(new THREE.Mesh(new THREE.SphereGeometry(0.09, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), kit.mat.porcelain));
  cap.position.y = 0.03;
  head.add(band, aperture, cap);
  g.add(plate, body, ring, head);
  return { group: g, head, beamY: height + 0.115 };
}

/* =========================================================
   HALLE EN LAMELLÉ-COLLÉ, PERGOLA, SURÉLÉVATION, RÉNOVATION
   ========================================================= */
export function glulamHall(kit, { R = 5.2, n = 5, spacing = 3.2, depth = 0.44, width = 0.16, plinth = 0.45 } = {}) {
  const group = new THREE.Group();
  const L = (n - 1) * spacing;
  const slab = shade(new THREE.Mesh(new THREE.BoxGeometry(2 * R + 2.6, 0.2, L + 3.4), kit.mat.concrete));
  slab.position.y = 0.1;
  group.add(slab);
  const y0 = 0.2 + plinth;
  for (let i = 0; i < n; i++) {
    const z = i * spacing - L / 2;
    const sh = new THREE.Shape();
    sh.absarc(0, 0, R + depth / 2, 0, Math.PI, false);
    sh.absarc(0, 0, R - depth / 2, Math.PI, 0, true);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: width, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 1, curveSegments: 72 });
    geo.translate(0, 0, -width / 2);
    applyArcWood(geo, R, SPECIES.lamelle, kit.rand);
    const arch = shade(new THREE.Mesh(geo, kit.mat.wood));
    arch.position.set(0, y0, z);
    group.add(arch);
    for (const side of [-1, 1]) {
      const pl = shade(new THREE.Mesh(new THREE.BoxGeometry(0.7, plinth, 0.5), kit.mat.concrete));
      pl.position.set(side * R, 0.2 + plinth / 2, z);
      group.add(pl);
    }
  }
  for (let a = 14; a <= 166.1; a += 13.8) {
    const r = R + depth / 2 + 0.1, c = Math.cos(a * DEG), s = Math.sin(a * DEG);
    const p = V(c * r, y0 + s * r, 0);
    group.add(member(kit, V(p.x, p.y, -L / 2 - 0.7), V(p.x, p.y, L / 2 + 0.7), 0.1, 0.2, V(c, s, 0), { tint: SPECIES.epicea }));
  }
  for (const zc of [-L / 2 + spacing / 2, L / 2 - spacing / 2]) for (const sgn of [-1, 1]) {
    const a1 = 40 * DEG, a2 = 80 * DEG, r = R + depth / 2 + 0.22;
    const A = V(sgn * Math.cos(a1) * r, y0 + Math.sin(a1) * r, zc - spacing / 2);
    const B = V(sgn * Math.cos(a2) * r, y0 + Math.sin(a2) * r, zc + spacing / 2);
    const C = V(sgn * Math.cos(a1) * r, y0 + Math.sin(a1) * r, zc + spacing / 2);
    const D = V(sgn * Math.cos(a2) * r, y0 + Math.sin(a2) * r, zc - spacing / 2);
    group.add(rod(A, B, 0.012, kit.mat.steel), rod(C, D, 0.012, kit.mat.steel));
  }
  return { group };
}

export function pergola(kit, { L = 6.6, W = 4.2, H = 2.55, tint = SPECIES.douglas } = {}) {
  const group = new THREE.Group();
  const slab = shade(new THREE.Mesh(new THREE.BoxGeometry(W + 1.8, 0.12, L + 1.8), kit.mat.concrete));
  slab.position.y = 0.06;
  group.add(slab);
  for (const x of [-W / 2, W / 2]) for (const z of [-L / 2 + 0.2, 0, L / 2 - 0.2]) {
    group.add(member(kit, V(x, 0.18, z), V(x, H, z), 0.15, 0.15, X, { tint }));
    const foot = shade(new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.06, 0.17), kit.mat.steel));
    foot.position.set(x, 0.15, z);
    group.add(foot);
  }
  for (const x of [-W / 2, W / 2]) group.add(member(kit, V(x, H + 0.15, -L / 2 - 0.35), V(x, H + 0.15, L / 2 + 0.35), 0.1, 0.3, Y, { tint }));
  for (let z = -L / 2 - 0.25; z <= L / 2 + 0.26; z += 0.6) group.add(member(kit, V(-W / 2 - 0.5, H + 0.4, z), V(W / 2 + 0.5, H + 0.4, z), 0.07, 0.2, Y, { tint }));
  for (let x = -W / 2 - 0.2; x <= W / 2 + 0.21; x += 0.14) group.add(member(kit, V(x, H + 0.53, -L / 2 - 0.3), V(x, H + 0.53, L / 2 + 0.3), 0.035, 0.06, Y, { tint, round: 0.003 }));
  return { group };
}

export function surelevation(kit) {
  const group = new THREE.Group();
  const add = (m) => { group.add(m); return m; };
  const W = 9, D = 7, H0 = 3, base = 0.25;
  const slab = shade(new THREE.Mesh(new THREE.BoxGeometry(W + 1.4, base, D + 1.4), kit.mat.concrete));
  slab.position.y = base / 2;
  add(slab);
  const box = shade(new THREE.Mesh(new THREE.BoxGeometry(W, H0 - base, D), kit.mat.plaster));
  box.position.y = base + (H0 - base) / 2;
  add(box);
  for (const [x, w, h, y] of [[-2.6, 1.6, 1.3, 1.6], [0.4, 1.0, 2.1, 1.3], [2.8, 1.6, 1.3, 1.6]]) add(windowUnit(kit, w, h, x, y, D / 2 + 0.012, 'z'));
  for (let x = -W / 2 + 0.06; x <= W / 2 - 0.05; x += 0.5) add(member(kit, V(x, H0 + 0.11, -D / 2), V(x, H0 + 0.11, D / 2), 0.075, 0.22, Y));
  for (const z of [-D / 2 + 0.04, D / 2 - 0.04]) add(member(kit, V(-W / 2, H0 + 0.11, z), V(W / 2, H0 + 0.11, z), 0.075, 0.22, Y));
  const deck = shade(new THREE.Mesh(new THREE.BoxGeometry(W * 0.62, 0.022, D), kit.mat.osb));
  deck.position.set(-W / 2 + W * 0.31, H0 + 0.231, 0);
  add(deck);
  const b2 = H0 + 0.242, T = 0.145, hF = 2.5, slope = Math.tan(8 * DEG);
  const front = D / 2 - T / 2, back = -D / 2 + T / 2;
  const topZ = (z) => b2 + hF + (front - z) * slope;
  const wadd = (m) => add(m);
  frameWall(kit, wadd, { from: V(-W / 2, 0, front), to: V(W / 2, 0, front), base: b2, topAt: () => topZ(front),
    openings: [{ s0: 0.9, s1: 3.7, sill: 0.4, head: 2.15 }, { s0: 5.2, s1: 7.8, sill: 0.9, head: 2.15 }] });
  frameWall(kit, wadd, { from: V(W / 2, 0, back), to: V(-W / 2, 0, back), base: b2, topAt: () => topZ(back) });
  frameWall(kit, wadd, { from: V(W / 2 - T / 2, 0, front - T / 2), to: V(W / 2 - T / 2, 0, back + T / 2), base: b2, topAt: (s) => topZ(front - T / 2 - s), rake: 'slope',
    openings: [{ s0: 2.4, s1: 3.6, sill: 0.9, head: 2.1 }] });
  frameWall(kit, wadd, { from: V(-W / 2 + T / 2, 0, back + T / 2), to: V(-W / 2 + T / 2, 0, front - T / 2), base: b2, topAt: (s) => topZ(back + T / 2 + s), rake: 'slope' });
  for (let x = -W / 2 - 0.2; x <= W / 2 + 0.21; x += 0.6) {
    const zf = D / 2 + 0.55, zb = -D / 2 - 0.45;
    add(member(kit, V(x, topZ(zf) + 0.1, zf), V(x, topZ(zb) + 0.1, zb), 0.06, 0.2, V(0, 1, slope)));
  }
  for (let z = D / 2 - 0.2; z > -D / 2 * 0.15; z -= 0.155) {
    const x = W / 2 + 0.03;
    add(member(kit, V(x, b2 - 0.1, z), V(x, topZ(z) - 0.06, z), 0.14, 0.02, X, { tint: SPECIES.meleze, round: 0.002 }));
  }
  return { group };
}

export function renovation(kit) {
  const group = new THREE.Group();
  const house = masonryHouse(kit, { material: kit.mat.plasterWarm });
  group.add(house.group);
  const R = roof(kit, {
    battens: false, tint: SPECIES.vieuxChene, purlinTint: SPECIES.vieuxChene,
    trussTints: [SPECIES.vieuxChene, SPECIES.vieuxChene],
    chevronTint: (z) => (z > -0.6 ? SPECIES.epicea : SPECIES.vieuxChene),
  });
  group.add(R.group);
  // Moisage : pièces neuves jumelées le long des pannes anciennes, côté gauche.
  for (const p of R.parts) {
    if (p.cat !== 'panne' || p.side > 0) continue;
    const m = p.mesh, { len, b, h } = m.userData.dims;
    const along = V(1, 0, 0).applyQuaternion(m.quaternion);
    const side = V(0, 0, 1).applyQuaternion(m.quaternion);
    const c = m.position.clone().addScaledVector(side, b + 0.004);
    const A = c.clone().addScaledVector(along, -len * 0.42), B = c.clone().addScaledVector(along, len * 0.42);
    R.group.add(member(kit, A, B, b * 0.8, h, V(0, 1, 0).applyQuaternion(m.quaternion), { tint: SPECIES.epicea }));
  }
  return { group };
}

/* =========================================================
   SCÈNES COMPOSÉES
   ========================================================= */
export function heroScene(kit) {
  const group = new THREE.Group();
  const house = frameHouse(kit);
  group.add(house.group);
  const stack = lumberStack(kit);
  stack.position.set(0.9, 0, 9.9);
  stack.rotation.y = 0.64;
  group.add(stack);
  const laser = laserTripod(kit);
  laser.group.position.set(7.6, 0, 5.3);
  group.add(laser.group);
  kit.laser.uLaserY.value = laser.beamY;
  kit.laser.uLaserOrigin.value.copy(laser.group.position);
  // Ordre de montage : murs, puis faîtière, pannes, chevrons.
  const rank = { mur: 0, faitiere: 1, panne: 1.2, chevron: 2 };
  house.parts.forEach((p, i) => { p.order = rank[p.cat] + (i / house.parts.length) * 0.9; });
  return {
    group, parts: house.parts, laser,
    camera: { pos: V(10.3, 1.7, 14.7), target: V(-0.6, 2.8, 0.2), fov: 27 },
    center: V(0, 2, 1), extent: 14,
  };
}

// Méthode : relevé → conception → taille → levage → couverture, piloté par p ∈ [0, 1].
export function processScene(kit) {
  const group = new THREE.Group();
  const house = masonryHouse(kit);
  group.add(house.group);
  const R = roof(kit, { battens: true, cover: 0.62 });
  group.add(R.group);
  const scanner = laserTripod(kit, { height: 1.2 });
  scanner.group.position.set(6.4, 0, 7.4);
  group.add(scanner.group);

  // Nuage de points
  const pts = house.samplePoints(14000, kit.rand);
  const n = pts.length / 3;
  const ang = new Float32Array(n), rnd = new Float32Array(n);
  const o = scanner.group.position;
  const a0 = Math.atan2(-o.z, -o.x) - Math.PI * 0.8;     // la maison passe au milieu du balayage
  for (let i = 0; i < n; i++) {
    const a = Math.atan2(pts[i * 3 + 2] - o.z, pts[i * 3] - o.x);
    ang[i] = (((a - a0) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / (Math.PI * 2);
    rnd[i] = kit.rand();
  }
  const pgeo = new THREE.BufferGeometry();
  pgeo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  pgeo.setAttribute('aAng', new THREE.BufferAttribute(ang, 1));
  pgeo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 1));
  const pmat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uSweep: { value: 0 }, uOpacity: { value: 1 }, uColor: { value: new THREE.Color('#06a9c2') }, uSize: { value: 0.045 }, uScale: { value: 500 } },
    vertexShader: `attribute float aAng; attribute float aRnd; uniform float uSweep; uniform float uSize; uniform float uScale; varying float vOn; varying float vFresh;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
        vOn = smoothstep(aAng - 0.015, aAng, uSweep);
        vFresh = 1.0 - smoothstep(0.0, 0.07, uSweep - aAng);
        gl_PointSize = uSize * uScale / -mv.z * (0.75 + aRnd * 0.5) * (1.0 + vFresh * 1.4); }`,
    fragmentShader: `uniform vec3 uColor; uniform float uOpacity; varying float vOn; varying float vFresh;
      void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c); if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.25, d) * vOn * uOpacity * (0.75 + vFresh * 0.25);
        gl_FragColor = vec4(mix(uColor, vec3(0.55, 0.97, 1.0), vFresh * 0.6), a);
        #include <colorspace_fragment>
      }`,
  });
  const cloud = new THREE.Points(pgeo, pmat);
  cloud.frustumCulled = false;
  group.add(cloud);

  // Pièces de la charpente : positions « posé », « en pile » et filaire.
  const frame = R.parts.filter((p) => p.cat !== 'liteau' && p.cat !== 'couverture');
  const finish = R.parts.filter((p) => p.cat === 'liteau' || p.cat === 'couverture');
  const ground = -R.group.position.y;
  const laidQ = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(V(0, 0, 1), V(0, 1, 0), V(-1, 0, 0)));
  const catOrder = { sabliere: 0, ferme: 1, faitiere: 2, panne: 3, chevron: 4 };
  const assembly = frame.slice().sort((a, b) => catOrder[a.cat] - catOrder[b.cat] || (a.truss ?? 0) - (b.truss ?? 0) || (a.i ?? 0) - (b.i ?? 0));
  assembly.forEach((p, k) => { p.seq = k / assembly.length; });
  const piles = frame.slice().sort((a, b) => b.mesh.userData.dims.len - a.mesh.userData.dims.len);
  const perLayer = 10, layers = 3;
  piles.forEach((p, i) => {
    const pile = Math.floor(i / (perLayer * layers)), j = i % (perLayer * layers);
    const layer = Math.floor(j / perLayer), col = j % perLayer;
    p.cut = i / piles.length;
    p.laidPos = V(6.9 + pile * 3.3 + col * 0.3, ground + 0.13 + layer * 0.27, 0.3);
    p.homePos = p.mesh.position.clone();
    p.homeQ = p.mesh.quaternion.clone();
    const { len, b, h } = p.mesh.userData.dims;
    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(len, h, b)),
      new THREE.LineBasicMaterial({ color: '#27313a', transparent: true, opacity: 0, depthWrite: false }),
    );
    wire.position.copy(p.homePos);
    wire.quaternion.copy(p.homeQ);
    R.group.add(wire);
    p.wire = wire;
  });
  finish.forEach((p) => { p.mesh.visible = false; });
  const covers = finish.filter((p) => p.cat === 'couverture');
  const lits = finish.filter((p) => p.cat === 'liteau');
  const maxK = Math.max(...lits.map((p) => p.k));

  const tmpQ = new THREE.Quaternion();
  function apply(p, t = 0) {
    // 01 · Relevé
    pmat.uniforms.uSweep.value = seg(p, 0.02, 0.17) * 1.04;
    pmat.uniforms.uOpacity.value = 1 - seg(p, 0.27, 0.36);
    cloud.visible = pmat.uniforms.uOpacity.value > 0.001 && pmat.uniforms.uSweep.value > 0;
    scanner.head.rotation.y = -(t * 2.2);
    const sc = 1 - easeIO(seg(p, 0.3, 0.38));
    scanner.group.scale.setScalar(Math.max(sc, 0.0001));
    scanner.group.visible = sc > 0.001;
    // 02 · Conception : murs qui se dressent + épure filaire
    const wg = easeOut(seg(p, 0.2, 0.33));
    for (const w of house.walls) { w.scale.y = Math.max(wg, 0.0001); w.visible = wg > 0.001; }
    for (const q of frame) {
      const a = seg(p, 0.23 + q.seq * 0.12, 0.27 + q.seq * 0.12) * (1 - seg(p, 0.45 + q.cut * 0.08, 0.5 + q.cut * 0.08));
      q.wire.material.opacity = a * 0.9;
      q.wire.visible = a > 0.001;
    }
    // 03 · Taille (apparition en pile)  ·  04 · Levage (vol jusqu'à sa place)
    for (const q of frame) {
      const cut = easeOut(seg(p, 0.42 + q.cut * 0.1, 0.46 + q.cut * 0.1));
      const lift = easeIO(seg(p, 0.6 + q.seq * 0.17, 0.64 + q.seq * 0.17));
      const m = q.mesh;
      m.visible = cut > 0.001;
      m.scale.x = Math.max(cut, 0.0001);
      m.position.lerpVectors(q.laidPos, q.homePos, lift);
      m.position.y += Math.sin(Math.PI * lift) * 2.2;
      tmpQ.copy(laidQ).slerp(q.homeQ, lift);
      m.quaternion.copy(tmpQ);
    }
    // 05 · Liteaux puis couverture
    for (const q of lits) {
      const k = easeOut(seg(p, 0.82 + (q.k / maxK) * 0.07, 0.86 + (q.k / maxK) * 0.07));
      q.mesh.visible = k > 0.001;
      q.mesh.scale.x = Math.max(k, 0.0001);
    }
    for (const q of covers) {
      const k = easeOut(seg(p, 0.9 + (q.seam ? 0.03 : 0), 0.97 + (q.seam ? 0.02 : 0)));
      q.mesh.visible = k > 0.001;
      q.mesh.scale.x = Math.max(k, 0.0001);
    }
  }

  const keys = [
    { p: 0.0, pos: V(15, 7.5, 17), target: V(0.8, 1.8, 0.5) },
    { p: 0.1, pos: V(14, 6.4, 16.5), target: V(0.6, 2, 0.4) },
    { p: 0.3, pos: V(-12.5, 13, 15.5), target: V(0, 3.2, 0) },
    { p: 0.5, pos: V(14.5, 13.5, 22.5), target: V(4.4, 1.4, 0) },
    { p: 0.7, pos: V(18, 9.5, 19), target: V(1.6, 3.4, 0) },
    { p: 0.9, pos: V(15.5, 5.6, 19.5), target: V(0, 3.6, 0) },
    { p: 1.0, pos: V(15, 5.4, 19.5), target: V(0, 3.6, 0) },
  ];
  function cameraAt(p, out) {
    let i = 0;
    while (i < keys.length - 2 && p > keys[i + 1].p) i++;
    const a = keys[i], b = keys[i + 1];
    const k = easeIO(seg(p, a.p, b.p));
    out.pos.lerpVectors(a.pos, b.pos, k);
    out.target.lerpVectors(a.target, b.target, k);
    return out;
  }
  return { group, apply, cameraAt, cloud, center: V(3, 2, 0), extent: 16, fov: 30 };
}

// Ouvrages : une scène par typologie (rendus fixes haute qualité).
export const WORKS = {
  traditionnelle: (kit) => {
    const g = new THREE.Group();
    g.add(masonryHouse(kit).group, roof(kit, { cover: 0.5, tint: SPECIES.douglas }).group);
    return { group: g, camera: { pos: V(-17.5, 8, 19), target: V(0.3, 3.5, 0), fov: 28 }, center: V(0, 3, 0), extent: 11 };
  },
  ossature: (kit) => {
    const h = frameHouse(kit);
    return { group: h.group, camera: { pos: V(16, 10.5, 18.5), target: V(0, 2.4, 0), fov: 28 }, center: V(0, 2, 0), extent: 10 };
  },
  lamelle: (kit) => ({ ...glulamHall(kit), camera: { pos: V(14, 7.5, 19), target: V(0, 3, 0), fov: 30 }, center: V(0, 3, 0), extent: 11 }),
  surelevation: (kit) => ({ ...surelevation(kit), camera: { pos: V(15, 8.8, 16.5), target: V(0, 3.4, 0), fov: 30 }, center: V(0, 3, 0), extent: 10 }),
  pergola: (kit) => ({ ...pergola(kit), camera: { pos: V(9.8, 5.6, 12), target: V(0, 1.4, 0), fov: 32 }, center: V(0, 1.5, 0), extent: 7 }),
  renovation: (kit) => ({ ...renovation(kit), camera: { pos: V(17.5, 12.5, 18.5), target: V(0, 3.9, 0), fov: 28 }, center: V(0, 3, 0), extent: 11 }),
};

// Cadrage de la vue « anatomie » (partagé par la vue temps réel et le rendu fixe).
export const ANATOMY_CAMERA = { pos: V(2.1, 4.3, 19.8), target: V(0, 2.3, -0.6), fov: 26 };

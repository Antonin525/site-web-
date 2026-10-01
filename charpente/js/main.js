// FAÎTE — orchestration : chargement, scroll fluide, révélations au scroll,
// survols (curseur instrument, pastilles magnétiques, visionneuse inclinable)
// et branchement des trois vues 3D temps réel.

const { gsap, ScrollTrigger, Lenis } = window;
const root = document.documentElement;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const small = () => window.innerWidth <= 900;
let menuOpen = false;

if (!gsap || !ScrollTrigger) {
  root.classList.remove('js');
  window.__faiteReady = true;
} else {
  try {
    window.__faiteBoot = true;
    boot();
  } catch (err) {
    // En cas d'erreur, on affiche le contenu tel quel plutôt qu'une page bloquée.
    console.error(err);
    root.classList.remove('js');
    window.__faiteReady = true;
  }
}

function boot() {
  gsap.registerPlugin(ScrollTrigger);
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
  prepareText();
  const lenis = setupScroll();
  setupHeader();
  setupMenu(lenis);
  setupClock();
  if (fine && !reduce) {
    setupCursor();
    setupMagnetic();
  }
  setupReveals();
  setupCounters();
  setupWorks();
  setupForm();
  const loading = setupLoader();
  const three = load3D(loading);
  setupBand(three, loading, lenis);
  setupAnatomy(three);
  setupProcess(three);
}

/* ---------------------------------------------------------
   Texte : lignes, lettres, libellés « roll »
   --------------------------------------------------------- */
function prepareText() {
  $$('[data-lines]').forEach((el) => {
    el.innerHTML = el.innerHTML
      .split(/<br\s*\/?>/i)
      .map((l) => `<span class="line"><span>${l.trim()}</span></span>`)
      .join(' ');
  });
  $$('[data-monument], [data-footer-mark]').forEach((el) => {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    for (const c of text) {
      const o = document.createElement('span');
      o.className = 'ch';
      o.setAttribute('aria-hidden', 'true');
      const i = document.createElement('span');
      i.textContent = c;
      o.appendChild(i);
      el.appendChild(o);
    }
  });
  $$('.roll').forEach((el) => setRollText(el, el.textContent.trim()));
}
function setRollText(el, text) {
  el.textContent = '';
  const s = document.createElement('span');
  s.className = 'roll__in';
  s.textContent = text;
  s.dataset.text = text;
  el.appendChild(s);
}

/* ---------------------------------------------------------
   Scroll fluide + ancres
   --------------------------------------------------------- */
function setupScroll() {
  let lenis = null;
  if (Lenis && !reduce) {
    lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4) });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id === '#top' ? 0 : $(id);
      if (target === null) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { duration: 1.6, force: true });
      else if (target === 0) window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });
  return lenis;
}

/* ---------------------------------------------------------
   En-tête, menu mobile, horloge
   --------------------------------------------------------- */
function setupHeader() {
  const header = $('.header');
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (st) => {
      const y = st.scroll();
      header.classList.toggle('is-scrolled', y > 10);
      header.classList.toggle('is-hidden', st.direction === 1 && y > window.innerHeight * 0.6 && !menuOpen);
    },
  });
}

function setupMenu(lenis) {
  const btn = $('.menu-toggle');
  const menu = $('#menu');
  const label = $('[data-menu-label]');
  const open = (on) => {
    menuOpen = on;
    btn.setAttribute('aria-expanded', String(on));
    setRollText(label, on ? 'Fermer' : 'Menu');
    if (on) {
      menu.hidden = false;
      $('.header').classList.remove('is-hidden');
      lenis?.stop();
      gsap.fromTo($$('.menu__nav a', menu), { yPercent: 50, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.06 });
    } else {
      menu.hidden = true;
      lenis?.start();
    }
  };
  btn.addEventListener('click', () => open(!menuOpen));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => open(false)));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) open(false); });
}

function setupClock() {
  const el = $('[data-clock]');
  const fmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Paris' });
  const update = () => { el.textContent = fmt.format(new Date()); };
  update();
  setInterval(update, 1000);
}

/* ---------------------------------------------------------
   Survols : curseur « instrument », pastilles magnétiques
   --------------------------------------------------------- */
function setupCursor() {
  root.classList.add('has-cursor');
  const c = $('.cursor');
  const label = $('.cursor__label');
  const coords = $('.cursor__coords');
  const xTo = gsap.quickTo(c, 'x', { duration: 0.35, ease: 'power3.out' });
  const yTo = gsap.quickTo(c, 'y', { duration: 0.35, ease: 'power3.out' });
  const pad = (n) => String(Math.max(0, Math.round(n))).padStart(4, '0');
  gsap.set(c, { opacity: 0 });
  let shown = false;
  window.addEventListener('pointermove', (e) => {
    if (!shown) {
      shown = true;
      gsap.set(c, { x: e.clientX, y: e.clientY });
      gsap.to(c, { opacity: 1, duration: 0.3 });
    }
    xTo(e.clientX);
    yTo(e.clientY);
    coords.textContent = `X ${pad(e.clientX)} · Y ${pad(e.clientY)}`;
  }, { passive: true });
  document.addEventListener('pointerover', (e) => {
    const lab = e.target.closest('[data-cursor]');
    const link = e.target.closest('a, button, label, input, textarea');
    c.classList.toggle('is-label', !!lab && !link);
    c.classList.toggle('is-link', !!link);
    label.textContent = lab && !link ? lab.dataset.cursor : '';
  });
  root.addEventListener('pointerleave', () => gsap.to(c, { opacity: 0, duration: 0.2 }));
  root.addEventListener('pointerenter', () => { if (shown) gsap.to(c, { opacity: 1, duration: 0.2 }); });
}

function setupMagnetic() {
  $$('[data-magnetic], .floatnav .pill, .chip span').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.28);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.4);
    });
    el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.4)' }));
  });
}

/* ---------------------------------------------------------
   Révélations au scroll
   --------------------------------------------------------- */
function setupReveals() {
  if (reduce) {
    gsap.set('[data-fade]', { opacity: 1, y: 0 });
    gsap.set('[data-lines] .line > span', { yPercent: 0, y: 0 });
    gsap.set('[data-rule]', { scaleX: 1 });
    return;
  }
  ScrollTrigger.batch('[data-fade]', {
    start: 'top 90%',
    once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08 }),
  });
  $$('[data-lines]').forEach((el) => {
    gsap.fromTo($$('.line > span', el), { yPercent: 105, y: 0 }, {
      yPercent: 0, duration: 1.4, ease: 'expo.out', stagger: 0.12,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });
  $$('[data-rule]').forEach((el) => {
    gsap.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
  });
  $$('[data-monument]').forEach((el) => {
    gsap.fromTo($$('.ch', el), { yPercent: 35, opacity: 0, filter: 'blur(14px)' }, {
      yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 1.5, ease: 'expo.out', stagger: 0.045,
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
    gsap.fromTo(el, { xPercent: 2.5 }, {
      xPercent: -2.5, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
  // Grand nom du pied de page : les lettres montent avec le scroll.
  gsap.fromTo('.footer__mark .ch > span', { yPercent: 100 }, {
    yPercent: 0, ease: 'none', stagger: 0.1,
    scrollTrigger: { trigger: '.footer', start: 'top bottom', end: () => ScrollTrigger.maxScroll(window), scrub: 1, invalidateOnRefresh: true },
  });
}

function setupCounters() {
  $$('[data-count]').forEach((el) => {
    const end = +el.dataset.count;
    const o = { v: 0 };
    el.textContent = '0';
    gsap.to(o, {
      v: end, duration: 2, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => { el.textContent = Math.round(o.v); },
    });
  });
}

/* ---------------------------------------------------------
   Chargement
   --------------------------------------------------------- */
function setupLoader() {
  const num = $('[data-load]');
  const bar = $('.loader__bar i');
  const steps = { fonts: 30, module: 65, hero: 100 };
  const state = { target: 4, shown: 0 };
  let resolveDone;
  const done = new Promise((r) => { resolveDone = r; });
  const tween = () => gsap.to(state, {
    shown: state.target, duration: 0.8, ease: 'power2.out', overwrite: true,
    onUpdate: () => {
      num.textContent = String(Math.round(state.shown)).padStart(3, '0');
      bar.style.transform = `scaleX(${state.shown / 100})`;
    },
    onComplete: () => { if (state.target >= 100) resolveDone(); },
  });
  const api = {
    done,
    step(name, final = false) {
      state.target = Math.max(state.target, final ? 100 : steps[name] || 0);
      tween();
    },
  };
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => api.step('fonts'));
  setTimeout(() => api.step('timeout', true), 6500);
  tween();
  return api;
}

function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

async function load3D(loading) {
  if (!webglOK()) return null;
  try {
    const mod = await import('./3d/views.js');
    root.classList.add('webgl');
    gsap.ticker.add((time, deltaMs) => mod.tick(time, Math.min(deltaMs / 1000, 0.1)));
    loading.step('module');
    return mod;
  } catch (err) {
    console.warn('3D indisponible :', err);
    return null;
  }
}

/* ---------------------------------------------------------
   Bandeau 3D : ouverture, montage de la maison, repli au scroll
   --------------------------------------------------------- */
async function setupBand(threeP, loading, lenis) {
  const frame = $('.band__frame');
  const mod = await threeP;
  let hero = null;
  if (mod) hero = new mod.HeroView($('[data-view="hero"]'), { onLive: () => loading.step('hero') });
  else loading.step('none', true);
  if (!fine) $('[data-drag-hint]').textContent = 'Maquette temps réel';

  await loading.done;
  const tl = gsap.timeline({ onComplete: () => { window.__faiteReady = true; } });
  tl.to('.loader__mark, .loader__foot', { yPercent: -40, opacity: 0, duration: 0.6, ease: 'power3.in', stagger: 0.05 })
    .to('.loader', { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, '-=0.25')
    .set('.loader', { display: 'none' })
    .fromTo('.band', { clipPath: 'inset(50% 0% 50% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut', clearProps: 'clipPath' }, '-=0.8')
    .fromTo('.header', { yPercent: -100 }, { yPercent: 0, duration: 1.1, ease: 'expo.out', clearProps: 'transform' }, '-=1.1')
    .fromTo('.band .hud > span', { opacity: 0, y: 8 }, { opacity: 0.72, y: 0, duration: 0.9, stagger: 0.08, ease: 'power2.out' }, '-=0.6')
    .add(() => { lenis?.start(); ScrollTrigger.refresh(); }, '-=1');
  if (hero) tl.to(hero, { intro: 1, duration: reduce ? 0.01 : 3.6, ease: 'power1.inOut' }, '-=1.6');

  // Au scroll, le bandeau se replie en un grand cadre arrondi et la caméra recule.
  gsap.fromTo(frame, { clipPath: 'inset(0% 0% 0% 0% round 0px)' }, {
    clipPath: () => `inset(6% ${small() ? 4 : 2.6}% 0% ${small() ? 4 : 2.6}% round ${small() ? 32 : 80}px)`,
    ease: 'none',
    scrollTrigger: {
      trigger: '.band', start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true,
      onUpdate: (st) => { if (hero) hero.scroll = st.progress; },
    },
  });
  gsap.to('.band .hud', { opacity: 0, ease: 'none', scrollTrigger: { trigger: '.band', start: 'top top', end: '45% top', scrub: true } });

  if (mod) {
    const el = $('[data-fps]');
    let avg = 60;
    setInterval(() => { avg = avg * 0.7 + mod.fps() * 0.3; el.textContent = Math.min(120, Math.round(avg)); }, 500);
  }
}

/* ---------------------------------------------------------
   Anatomie : choix de la ferme, vue éclatée
   --------------------------------------------------------- */
async function setupAnatomy(threeP) {
  const well = $('[data-view="anatomy"]');
  const pills = $$('[data-truss]');
  const explode = $('[data-explode]');
  const spec = $('[data-truss-spec]');
  const text = $('[data-truss-text]');
  const fig = $('[data-truss-fig]');
  const mod = await threeP;
  if (!mod) {
    $('.floatnav').hidden = true;
    explode.hidden = true;
    return;
  }
  let view = null;
  const onChange = (type, info) => {
    fig.textContent = `Fig. 02 — ${info.title}`;
    spec.textContent = info.spec.join(' · ');
    text.textContent = info.text;
    if (view) gsap.fromTo([spec, text], { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', stagger: 0.06 });
  };
  const create = () => {
    if (!view) view = new mod.AnatomyView(well, { overlay: $('[data-callouts]'), legend: $('[data-legend]'), onChange });
    return view;
  };
  ScrollTrigger.create({ trigger: well, start: 'top 180%', once: true, onEnter: create });
  pills.forEach((p) => p.addEventListener('click', () => {
    pills.forEach((q) => {
      const on = q === p;
      q.classList.toggle('is-active', on);
      q.setAttribute('aria-selected', String(on));
    });
    create().setType(p.dataset.truss);
  }));
  explode.addEventListener('click', () => {
    const on = explode.getAttribute('aria-pressed') !== 'true';
    explode.setAttribute('aria-pressed', String(on));
    create().setExplode(on);
  });
}

/* ---------------------------------------------------------
   Méthode : la progression du scroll pilote la scène et les étapes
   --------------------------------------------------------- */
async function setupProcess(threeP) {
  const track = $('[data-process]');
  const steps = $$('.step');
  const names = steps.map((s) => $('.step__title', s).textContent);
  const label = $('[data-step-label]');
  const pct = $('[data-step-pct]');
  const bar = $('[data-step-bar]');
  let view = null, active = -1, lastP = 0;
  const setP = (p) => {
    lastP = p;
    view?.setProgress(p);
    const i = Math.min(4, Math.floor(p * 5));
    if (i !== active) {
      active = i;
      steps.forEach((s, k) => {
        s.classList.toggle('is-active', k === i);
        s.classList.toggle('is-done', k < i);
      });
      label.textContent = `Étape ${String(i + 1).padStart(2, '0')} / 05 — ${names[i]}`;
    }
    pct.textContent = String(Math.round(p * 100)).padStart(3, '0');
    bar.style.transform = `scaleX(${p})`;
  };
  ScrollTrigger.create({ trigger: track, start: 'top top', end: 'bottom bottom', onUpdate: (st) => setP(st.progress) });
  setP(0);
  const mod = await threeP;
  if (!mod) return;
  ScrollTrigger.create({
    trigger: track, start: 'top 200%', once: true,
    onEnter: () => {
      view = new mod.ProcessView($('[data-view="process"]'));
      view.setProgress(lastP);
    },
  });
}

/* ---------------------------------------------------------
   Ouvrages : liste + visionneuse (balayage, inclinaison 3D)
   --------------------------------------------------------- */
function setupWorks() {
  const items = $$('.work');
  const btns = $$('.work__btn');
  const imgs = $$('.viewer__img');
  const label = $('[data-viewer-label]');
  const viewer = $('.viewer');
  let current = 0, hovering = false;
  const set = (i) => {
    if (i === current) return;
    const prev = imgs[current];
    prev.classList.remove('is-active');
    prev.classList.add('is-leaving');
    setTimeout(() => prev.classList.remove('is-leaving'), 950);
    imgs[i].classList.add('is-active');
    current = i;
    items.forEach((it, k) => it.classList.toggle('is-active', k === i));
    label.textContent = `Fig. 04.${String(i + 1).padStart(2, '0')} — ${$('.work__title', btns[i]).textContent}`;
  };
  btns.forEach((b, i) => {
    b.addEventListener('pointerenter', () => set(i));
    b.addEventListener('focus', () => set(i));
    b.addEventListener('click', () => set(i));
  });
  const list = $('.works__list');
  list.addEventListener('pointerenter', () => { hovering = true; });
  list.addEventListener('pointerleave', () => { hovering = false; });
  // Au scroll (grand écran), l'ouvrage au centre de l'écran s'affiche.
  items.forEach((it, i) => ScrollTrigger.create({
    trigger: it, start: 'top 58%', end: 'bottom 58%',
    onToggle: (st) => { if (st.isActive && !hovering && !small()) set(i); },
  }));
  if (fine && !reduce) {
    gsap.set(viewer, { transformPerspective: 1400 });
    const rx = gsap.quickTo(viewer, 'rotationX', { duration: 0.9, ease: 'power3.out' });
    const ry = gsap.quickTo(viewer, 'rotationY', { duration: 0.9, ease: 'power3.out' });
    viewer.addEventListener('pointermove', (e) => {
      const r = viewer.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 7);
      rx(-((e.clientY - r.top) / r.height - 0.5) * 5);
    });
    viewer.addEventListener('pointerleave', () => { rx(0); ry(0); });
  }
}

/* ---------------------------------------------------------
   Formulaire : ouvre la messagerie avec la demande pré-remplie
   --------------------------------------------------------- */
function setupForm() {
  const form = $('[data-form]');
  const status = $('.form__status');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const missing = ['nom', 'tel', 'message'].filter((k) => !String(d.get(k) || '').trim());
    if (missing.length) {
      status.textContent = 'Merci de renseigner nom, téléphone et projet.';
      gsap.fromTo(form, { x: -6 }, { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)' });
      form.querySelector(`[name="${missing[0]}"]`).focus();
      return;
    }
    const body = [
      `Nom : ${d.get('nom')}`,
      `Téléphone : ${d.get('tel')}`,
      `Email : ${d.get('email') || '—'}`,
      `Commune du chantier : ${d.get('commune') || '—'}`,
      `Type de projet : ${d.getAll('type').join(', ') || 'non précisé'}`,
      '',
      d.get('message'),
    ].join('\n');
    window.location.href = `mailto:contact@faite-charpente.fr?subject=${encodeURIComponent('Demande de devis — charpente')}&body=${encodeURIComponent(body)}`;
    status.textContent = 'Votre messagerie s’ouvre avec la demande pré-remplie.';
  });
}

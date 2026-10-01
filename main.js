// VORA — animations : loader, scroll fluide, révélations au scroll,
// effets de survol (curseur, boutons magnétiques, aperçu des services),
// et pilotage de l'objet 3D en fonction de la section affichée.

const { gsap, ScrollTrigger, Lenis } = window;
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const isMobile = () => window.innerWidth < 900;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

if (!gsap || !ScrollTrigger) {
  root.classList.remove('js');
  window.__voraReady = true;
} else {
  start();
}

function start() {
  gsap.registerPlugin(ScrollTrigger);
  $('.year').textContent = new Date().getFullYear();

  prepareText();

  // ---------- Scroll fluide ----------
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
      const target = $(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { duration: 1.6 });
      else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  const pointer = { x: 0, y: 0 };   // normalisé -1..1, lu par la scène 3D
  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  // L'ordre compte : les sections épinglées d'abord, pour que les déclencheurs
  // suivants mesurent leurs positions avec les espaces d'épinglage en place.
  const anatomyST = setupAnatomy();
  setupMethod();
  setupReveals();
  setupHero();
  setupCounters();
  setupMarquee(lenis);
  setupNav();
  setupServicesPreview();
  setupSteps();
  setupForm();
  if (finePointer && !reduce) {
    setupCursor();
    setupMagnetic();
  }
  const getTarget = setupObjectPath(anatomyST);
  setupGlow(getTarget);

  // La 3D est chargée à part : si WebGL ou le module échoue, le site reste entier.
  import('./scene.js')
    .then((m) => m.initScene($('.webgl'), getTarget, pointer))
    .catch((err) => console.warn('3D indisponible :', err));

  intro(lenis);
}

/* ---------------------------------------------------------
   Découpage du texte en mots / lettres
   --------------------------------------------------------- */
function splitWords(el) {
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span');
          w.className = 'w';
          const i = document.createElement('span');
          i.textContent = part;
          w.appendChild(i);
          frag.appendChild(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1 && child.tagName !== 'BR') {
        walk(child);
      }
    });
  };
  walk(el);
}

function splitChars(el) {
  const text = el.textContent;
  el.textContent = '';
  [...text].forEach((c) => {
    const o = document.createElement('span');
    o.className = 'ch';
    const i = document.createElement('span');
    i.textContent = c;
    o.appendChild(i);
    el.appendChild(o);
  });
}

function prepareText() {
  $$('[data-split], [data-scrub]').forEach(splitWords);
  $$('[data-chars], [data-chars-footer]').forEach(splitChars);
  // Effet "roll" : on double le libellé pour le faire défiler au survol.
  $$('.roll').forEach((el) => {
    const label = el.textContent.trim();
    el.innerHTML = `<span class="roll__mask"><span class="roll__inner"><span>${label}</span><span aria-hidden="true">${label}</span></span></span>`;
    if (!el.getAttribute('aria-label') && el.tagName === 'A') el.setAttribute('aria-label', label);
  });
}

/* ---------------------------------------------------------
   Loader + entrée du hero
   --------------------------------------------------------- */
function intro(lenis) {
  const num = $('.loader__num');
  const counter = { v: 0 };
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  const tl = gsap.timeline({ paused: true });

  tl.to(counter, {
    v: 100,
    duration: reduce ? 0.2 : 1.8,
    ease: 'power2.inOut',
    onUpdate: () => { num.textContent = String(Math.round(counter.v)).padStart(3, '0'); },
  }, 0)
    .to('.loader__bar span', { scaleX: 1, duration: reduce ? 0.2 : 1.8, ease: 'power2.inOut' }, 0)
    .to('.loader__num', { yPercent: -100, duration: 0.6, ease: 'power3.in' })
    .to('.loader', { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, '-=0.1')
    .set('.loader', { display: 'none' })
    .to('.hero__chars .ch > span', { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.07 }, '-=0.55')
    .fromTo('[data-hero-fade]', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.1 }, '-=1.0')
    .from('.hero__cross-h', { scaleX: 0, transformOrigin: 'left', duration: 1.4, ease: 'expo.inOut' }, '-=1.4')
    .from('.hero__cross-v', { scaleY: 0, transformOrigin: 'top', duration: 1.4, ease: 'expo.inOut' }, '<')
    .to('.hero__card .dash', { scaleX: 1, duration: 1, ease: 'expo.out' }, '-=0.6')
    .add(() => {
      window.__voraReady = true;
      if (lenis) lenis.start();
      ScrollTrigger.refresh();
    });

  // Les lettres partent sous leur masque (le CSS les y place déjà avant le JS).
  gsap.set('.hero__chars .ch > span', { yPercent: 105, y: 0 });

  // Attendre les polices (max 1,2 s) pour éviter un saut de mise en page.
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1200))]).then(() => tl.play());
}

/* ---------------------------------------------------------
   Révélations au scroll
   --------------------------------------------------------- */
function setupReveals() {
  // Titres : les mots montent depuis un masque.
  $$('[data-split]').forEach((el) => {
    gsap.set(el.querySelectorAll('.w > span'), { y: 0, yPercent: 110, rotate: 4 });
    gsap.to(el.querySelectorAll('.w > span'), {
      yPercent: 0, rotate: 0,
      duration: 1.2,
      ease: 'expo.out',
      stagger: 0.06,
      scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' },
    });
  });

  // Corps de texte : les mots s'allument au rythme du scroll.
  $$('[data-scrub]').forEach((el) => {
    gsap.to(el.querySelectorAll('.w'), {
      opacity: 1,
      stagger: 0.05,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 45%', scrub: true },
    });
  });

  // Séparateurs pointillés : tracés de gauche à droite.
  $$('.reveal .dash, .step .dash, .fig .dash, .footer > .dash').forEach((el) => {
    gsap.to(el, {
      scaleX: 1, duration: 1.4, ease: 'expo.inOut',
      scrollTrigger: { trigger: el, start: 'top 92%' },
    });
  });

  $$('[data-fade]').forEach((el) => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1.2, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  // Lignes de services : arrivée en cascade.
  gsap.from('.svc__row', {
    opacity: 0, y: 40, duration: 1, ease: 'expo.out', stagger: 0.08,
    scrollTrigger: { trigger: '.svc', start: 'top 80%' },
  });

  // Grand logo du pied de page : les lettres remontent avec le scroll.
  gsap.fromTo('.footer__mark .ch > span', { yPercent: 100 }, {
    yPercent: 0, ease: 'none', stagger: 0.08,
    scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: 1 },
  });
}

/* Hero : au scroll, les lettres se dispersent à des vitesses différentes. */
function setupHero() {
  const chars = $$('.hero__chars .ch');
  chars.forEach((ch, i) => {
    gsap.to(ch, {
      yPercent: -40 - i * 28,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
  });
  gsap.to('.hero__card, .hero__urgent', {
    y: -80, opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: '40% top', end: 'bottom top', scrub: true },
  });
  gsap.to('.hero__cross', {
    opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: '60% top', scrub: true },
  });
}

/* ---------------------------------------------------------
   Anatomie : section épinglée, la pièce se démonte
   --------------------------------------------------------- */
function setupAnatomy() {
  const section = $('#anatomie');
  const items = $$('.anatomy__list li');
  const pct = $('.anatomy__pct');
  const update = (p) => {
    pct.textContent = String(Math.round(p * 100)).padStart(3, '0') + '%';
    items.forEach((li) => li.classList.toggle('is-on', p >= parseFloat(li.dataset.part)));
  };
  return ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: () => (isMobile() ? 'bottom bottom' : '+=160%'),
    pin: !isMobile(),
    pinSpacing: true,
    invalidateOnRefresh: true,
    onUpdate: (self) => update(self.progress),
    onRefresh: (self) => update(self.progress),
  });
}

/* ---------------------------------------------------------
   Méthode : défilement horizontal épinglé (desktop)
   --------------------------------------------------------- */
function setupMethod() {
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    const track = $('.method__track');
    const dist = () => track.scrollWidth - window.innerWidth;
    gsap.to(track, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: {
        trigger: '#methode',
        start: 'top top',
        end: () => '+=' + dist(),
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });
    gsap.fromTo('.method__progress span', { scaleX: 0 }, {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: '#methode', start: 'top top', end: () => '+=' + dist(), scrub: true },
    });
    // Les cartes penchent légèrement selon la vitesse de défilement.
    const steps = $$('.step');
    ScrollTrigger.create({
      trigger: '#methode', start: 'top top', end: () => '+=' + dist(),
      onUpdate: (self) => {
        const skew = gsap.utils.clamp(-6, 6, self.getVelocity() / -400);
        gsap.to(steps, { skewX: skew, duration: 0.4, ease: 'power3.out', overwrite: true });
      },
      onLeave: () => gsap.to(steps, { skewX: 0, duration: 0.6 }),
      onLeaveBack: () => gsap.to(steps, { skewX: 0, duration: 0.6 }),
    });
  });
}

/* Halo de survol qui part de la position du curseur dans la carte. */
function setupSteps() {
  $$('.step').forEach((card) => {
    card.addEventListener('pointerenter', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
    card.addEventListener('pointerleave', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

/* ---------------------------------------------------------
   Compteurs
   --------------------------------------------------------- */
function setupCounters() {
  $$('[data-count]').forEach((el) => {
    const end = +el.dataset.count;
    const suffix = el.dataset.suffix || '';
    const o = { v: 0 };
    const render = (n) => { el.innerHTML = n + (suffix ? `<small>${suffix}</small>` : ''); };
    render(0);
    gsap.to(o, {
      v: end,
      duration: 2.2,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
      onUpdate: () => render(Math.round(o.v)),
    });
  });
}

/* ---------------------------------------------------------
   Bandeau des communes : vitesse et sens suivent le scroll
   --------------------------------------------------------- */
function setupMarquee(lenis) {
  const rows = $$('.marquee__row').map((row) => {
    const span = row.firstElementChild;
    // On duplique le contenu pour une boucle sans couture.
    for (let i = 0; i < 3; i++) row.appendChild(span.cloneNode(true));
    return { row, x: 0, dir: +row.dataset.dir, w: span.offsetWidth, hover: false };
  });
  rows.forEach((r) => {
    r.row.addEventListener('pointerenter', () => { r.hover = true; });
    r.row.addEventListener('pointerleave', () => { r.hover = false; });
  });
  window.addEventListener('resize', () => rows.forEach((r) => { r.w = r.row.firstElementChild.offsetWidth; }));
  if (reduce) return;
  let boost = 0, sign = 1;
  gsap.ticker.add((_, dt) => {
    const v = lenis ? lenis.velocity : 0;
    if (Math.abs(v) > 0.1) sign = Math.sign(v);
    boost += (Math.min(Math.abs(v), 40) - boost) * 0.1;
    rows.forEach((r) => {
      const base = r.hover ? 0.15 : 1;
      r.x -= (base + boost * 0.35) * r.dir * sign * dt * 0.06;
      if (r.x <= -r.w) r.x += r.w;
      if (r.x > 0) r.x -= r.w;
      r.row.style.transform = `translate3d(${r.x}px,0,0)`;
    });
  });
}

/* ---------------------------------------------------------
   Navigation : masquée en descendant, lien actif, rail de progression
   --------------------------------------------------------- */
function setupNav() {
  const nav = $('.nav');
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      nav.classList.toggle('is-hidden', self.direction === 1 && self.scroll() > 200);
      gsap.set('.rail__fill', { scaleY: self.progress });
    },
  });
  const links = $$('.nav__links a');
  ['intro', 'services', 'methode', 'contact'].forEach((id) => {
    ScrollTrigger.create({
      trigger: '#' + id,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: (self) => {
        if (!self.isActive) return;
        links.forEach((l) => l.classList.toggle('is-active', l.dataset.section === id));
      },
    });
  });
}

/* ---------------------------------------------------------
   Survols : curseur, boutons magnétiques, aperçu des services
   --------------------------------------------------------- */
function setupCursor() {
  root.classList.add('has-cursor');
  const ring = $('.cursor');
  const dot = $('.cursor-dot');
  const label = $('.cursor__label');
  const rx = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3.out' });
  const ry = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3.out' });
  const dx = gsap.quickTo(dot, 'x', { duration: 0.1 });
  const dy = gsap.quickTo(dot, 'y', { duration: 0.1 });
  gsap.set([ring, dot], { autoAlpha: 0 });
  let shown = false;
  window.addEventListener('pointermove', (e) => {
    if (!shown) {
      shown = true;
      gsap.set([ring, dot], { x: e.clientX, y: e.clientY });
      gsap.to([ring, dot], { autoAlpha: 1, duration: 0.4 });
    }
    rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY);
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => gsap.to([ring, dot], { autoAlpha: 0, duration: 0.3 }));
  document.documentElement.addEventListener('pointerenter', () => shown && gsap.to([ring, dot], { autoAlpha: 1, duration: 0.3 }));

  document.addEventListener('pointerover', (e) => {
    const withLabel = e.target.closest('[data-cursor]');
    const link = e.target.closest('a, button, input, textarea, .radar__pin');
    // Sur la liste des services, l'aperçu flottant remplace le curseur.
    ring.classList.toggle('is-hidden', !!e.target.closest('.svc'));
    ring.classList.toggle('is-hover', !!withLabel);
    ring.classList.toggle('is-link', !withLabel && !!link);
    label.textContent = withLabel ? withLabel.dataset.cursor : '';
  });
}

function setupMagnetic() {
  $$('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.35);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.45);
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.35)' });
    });
  });
}

function setupServicesPreview() {
  const list = $('.svc');
  const prev = $('.svc-preview');
  const inner = $('.svc-preview__inner');
  const icons = $$('svg', prev);
  if (!finePointer || reduce) return;
  const xTo = gsap.quickTo(prev, 'x', { duration: 0.7, ease: 'power3.out' });
  const yTo = gsap.quickTo(prev, 'y', { duration: 0.7, ease: 'power3.out' });
  let lastX = 0;
  gsap.set(inner, { scale: 0, rotate: -8 });

  list.addEventListener('pointerenter', (e) => {
    gsap.set(prev, { x: e.clientX, y: e.clientY, visibility: 'visible' });
    gsap.to(inner, { scale: 1, duration: 0.6, ease: 'expo.out' });
    list.classList.add('is-dim');
  });
  list.addEventListener('pointerleave', () => {
    gsap.to(inner, { scale: 0, duration: 0.45, ease: 'power3.in', onComplete: () => gsap.set(prev, { visibility: 'hidden' }) });
    list.classList.remove('is-dim');
  });
  list.addEventListener('pointermove', (e) => {
    xTo(e.clientX + 140);
    yTo(e.clientY);
    // inclinaison selon la vitesse horizontale
    gsap.to(inner, { rotate: gsap.utils.clamp(-14, 14, (e.clientX - lastX) * 0.8), duration: 0.6, ease: 'power3.out' });
    lastX = e.clientX;
  });
  $$('.svc__row').forEach((row) => {
    row.addEventListener('pointerenter', (e) => {
      icons.forEach((svg) => svg.classList.toggle('is-on', svg.dataset.icon === row.dataset.icon));
      // le fond se déroule depuis le côté par lequel on entre
      const r = row.getBoundingClientRect();
      row.style.setProperty('--origin', e.clientY < r.top + r.height / 2 ? 'top' : 'bottom');
    });
    row.addEventListener('pointerleave', (e) => {
      const r = row.getBoundingClientRect();
      row.style.setProperty('--origin', e.clientY < r.top + r.height / 2 ? 'top' : 'bottom');
    });
  });
}

/* ---------------------------------------------------------
   Formulaire : ouvre le client mail avec la demande pré-remplie
   --------------------------------------------------------- */
function setupForm() {
  const form = $('.form');
  const status = $('.form__status');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = new FormData(form);
    if (!d.get('nom') || !d.get('tel') || !d.get('message')) {
      status.textContent = 'MERCI DE RENSEIGNER NOM, TÉLÉPHONE ET BESOIN.';
      gsap.fromTo(form, { x: -8 }, { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)' });
      return;
    }
    const body = `Nom : ${d.get('nom')}\nTéléphone : ${d.get('tel')}\nCommune : ${d.get('commune') || 'Voreppe'}\n\n${d.get('message')}`;
    window.location.href = `mailto:contact@vora-plomberie.fr?subject=${encodeURIComponent('Demande de devis')}&body=${encodeURIComponent(body)}`;
    status.textContent = 'VOTRE MESSAGERIE S\'OUVRE — MERCI !';
  });
}

/* ---------------------------------------------------------
   Trajectoire de l'objet 3D : une pose par section
   --------------------------------------------------------- */
function setupObjectPath(anatomyST) {
  // x/y en unités 3D, s = échelle, r* = rotations, ex = éclatement, o = opacité
  const desk = {
    intro:     { x: 1.4,  y: -0.6, s: 0.88, rx: 0.45, ry: -0.7, rz: 0.15, ex: 0, o: 1 },
    atelier:   { x: 0,    y: 0,    s: 1.05, rx: 0.15, ry: 0.65, rz: -0.1, ex: 0, o: 1 },
    anaStart:  { x: 0,    y: -0.1, s: 0.95, rx: 0.3,  ry: 1.4,  rz: 0,    ex: 0, o: 1 },
    anaEnd:    { x: 0,    y: -0.1, s: 0.9,  rx: 0.5,  ry: 2.6,  rz: 0.1,  ex: 1, o: 1 },
    services:  { x: -2.7, y: -1.65, s: 0.45, rx: 1.0, ry: 3.6,  rz: 0.4,  ex: 0, o: 0.6 },
    methode:   { x: -1.0, y: -4.5, s: 0.5,  rx: 1.4,  ry: 4.2,  rz: 0.6,  ex: 0, o: 0 },
    chiffres:  { x: 0,    y: 3.8,  s: 0.6,  rx: 0.2,  ry: 5.0,  rz: 0,    ex: 0.3, o: 0 },
    zone:      { x: 0.1,  y: 1.45, s: 0.45, rx: 0.6,  ry: 5.6,  rz: -0.3, ex: 0, o: 0.55 },
    contact:   { x: -0.6, y: 1.9,  s: 0.4,  rx: 0.35, ry: 6.6,  rz: 0.1,  ex: 0, o: 0.5 },
    footer:    { x: 0,    y: 0.3,  s: 0.85, rx: 0.35, ry: 7.3,  rz: 0.05, ex: 0, o: 1 },
  };
  const mobile = {
    intro:     { x: 0,    y: -0.2, s: 0.9,  rx: 0.45, ry: -0.7, rz: 0.15, ex: 0, o: 0.9 },
    atelier:   { x: 0,    y: 0.1,  s: 0.9,  rx: 0.15, ry: 0.65, rz: -0.1, ex: 0, o: 0.8 },
    anaStart:  { x: 0,    y: 0.9,  s: 0.75, rx: 0.3,  ry: 1.4,  rz: 0,    ex: 0, o: 1 },
    anaEnd:    { x: 0,    y: 0.9,  s: 0.7,  rx: 0.5,  ry: 2.6,  rz: 0.1,  ex: 1, o: 0.5 },
    services:  { x: 1.4,  y: -2.0, s: 0.45, rx: 1.0,  ry: 3.6,  rz: 0.4,  ex: 0, o: 0.2 },
    methode:   { x: 0,    y: -6,   s: 0.5,  rx: 1.4,  ry: 4.2,  rz: 0.6,  ex: 0, o: 0 },
    chiffres:  { x: 0,    y: 6,    s: 0.5,  rx: 0.2,  ry: 5.0,  rz: 0,    ex: 0, o: 0 },
    zone:      { x: 0,    y: 6,    s: 0.5,  rx: 0.6,  ry: 5.6,  rz: -0.3, ex: 0, o: 0 },
    contact:   { x: 0.8,  y: 2.2,  s: 0.55, rx: 0.35, ry: 6.6,  rz: 0.1,  ex: 0, o: 0.35 },
    footer:    { x: 0,    y: 0.6,  s: 0.7,  rx: 0.35, ry: 7.3,  rz: 0.05, ex: 0, o: 1 },
  };

  // Points de passage : la pose est atteinte quand le haut de la section touche le haut de l'écran.
  const stops = [
    { key: 'intro', st: mk('#intro') },
    { key: 'atelier', st: mk('#atelier') },
    { key: 'anaStart', st: anatomyST },
    { key: 'anaEnd', st: anatomyST, end: true },
    { key: 'services', st: mk('#services', 'top 30%') },
    { key: 'services', st: mk('#services', 'bottom bottom') },   // la pose tient toute la section
    { key: 'methode', st: mk('#methode') },
    { key: 'chiffres', st: mk('#chiffres') },
    { key: 'zone', st: mk('#zone', 'top 40%') },
    { key: 'contact', st: mk('#contact', 'top 30%') },
    { key: 'footer', st: mk('.footer', 'top 70%') },
  ];
  function mk(sel, start = 'top top') { return ScrollTrigger.create({ trigger: sel, start }); }

  const ease = gsap.parseEase('power2.inOut');
  const out = {};
  return function getTarget() {
    const poses = isMobile() ? mobile : desk;
    const y = window.scrollY;
    const pts = stops.map((s) => ({ pos: s.end ? s.st.end : s.st.start, pose: poses[s.key] }));
    if (y <= pts[0].pos) return Object.assign(out, pts[0].pose);
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      if (y <= b.pos) {
        const t = ease(b.pos === a.pos ? 1 : (y - a.pos) / (b.pos - a.pos));
        for (const k in a.pose) out[k] = a.pose[k] + (b.pose[k] - a.pose[k]) * t;
        return out;
      }
    }
    return Object.assign(out, pts[pts.length - 1].pose);
  };
}

/* Le halo chaud suit l'objet (approximation écran de sa position 3D). */
function setupGlow(getTarget) {
  const glow = $('.glow');
  const s = { x: 62, y: 52, o: 0 };
  gsap.ticker.add(() => {
    const t = getTarget();
    const tx = 50 + t.x * (isMobile() ? 16 : 10.5);
    const ty = 50 - t.y * 18;
    s.x += (tx - s.x) * 0.07;
    s.y += (ty - s.y) * 0.07;
    s.o += (t.o - s.o) * 0.07;
    glow.style.setProperty('--gx', s.x + '%');
    glow.style.setProperty('--gy', s.y + '%');
    glow.style.setProperty('--go', s.o.toFixed(3));
  });
}

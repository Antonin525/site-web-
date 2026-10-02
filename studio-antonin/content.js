/* ═══════════════════════════════════════════════════════════
   STUDIO ANTONIN — content.js (template « Site Immersif »)
   ► L'UNIQUE FICHIER À MODIFIER pour faire évoluer le site.
   Les images sont toutes locales, dans images/.
   La partie « injection » en bas de fichier ne se modifie pas.
   ═══════════════════════════════════════════════════════════ */

window.SITE_CONTENT = {

  brand: {
    name: 'Studio Antonin',
    title: 'Studio Antonin — Identité visuelle & sites web sur mesure',
    description: 'Studio Antonin dessine des identités visuelles et des sites web sur mesure pour les indépendants et les petites marques : un seul interlocuteur, des sites rapides et vivants.',
    kicker: 'STUDIO ANTONIN — IDENTITÉ & SITES WEB, FRANCE',
    copyright: '© 2026 — STUDIO ANTONIN, FRANCE',
    signature: 'FAIT MAIN, PIXEL PAR PIXEL',
    socials: [
      { label: 'INSTAGRAM ↗', url: 'https://www.instagram.com/studioantonin/' },
      { label: 'LINKEDIN ↗', url: 'https://www.linkedin.com/company/studio-antonin/' }
    ]
  },

  nav: { proof: 'TRAVAUX', universes: 'MÉTHODE', cta: 'CONTACT' },

  /* 1 · ACCROCHE */
  hook: {
    line1: 'Une marque qui se voit,',
    line2a: 'un site qui',
    line2b: 'se vit.',
    image: 'images/hero.jpg',
    imageAlt: 'Un poste de travail de designer, maquettes de site et carnet de croquis',
    floaters: [
      'images/fl-01.jpg', 'images/fl-02.jpg', 'images/fl-03.jpg', 'images/fl-04.jpg', 'images/fl-05.jpg',
      'images/fl-06.jpg', 'images/fl-07.jpg', 'images/fl-08.jpg', 'images/fl-09.jpg', 'images/fl-10.jpg'
    ]
  },

  /* 2 · POSITIONNEMENT — ≤ 42 caractères */
  positioning: 'Identités & sites web pour indépendants',

  /* 3 · DÉMARCHE — [[…]] : 2 à 3 mots maximum */
  manifesto: {
    text: 'Un site n’est pas une plaquette en ligne : c’est le premier rendez-vous avec vos clients. Je dessine votre identité et votre site [[d’un même geste]], pour qu’ils parlent enfin d’une seule voix.'
  },

  /* 4 · PREUVE — masonry, 8 réalisations */
  proof: {
    layout: 'masonry',
    kicker: 'TRAVAUX CHOISIS',
    title: 'Des marques qui ont trouvé leur voix',
    sub: 'Identités, sites vitrines et boutiques — dessinés et développés au studio.',
    meta: 'HUIT PROJETS — 2021 → 2026',
    projects: [
      { img: 'images/work-01.jpg', title: 'Torréfacteur artisanal', meta: 'IDENTITÉ + BOUTIQUE — 2025' },
      { img: 'images/work-02.jpg', title: 'Atelier céramique', meta: 'IDENTITÉ + SITE — 2024' },
      { img: 'images/work-03.jpg', title: 'Cabinet d’architectes', meta: 'SITE VITRINE — 2025' },
      { img: 'images/work-04.jpg', title: 'Studio de yoga', meta: 'IDENTITÉ — 2023' },
      { img: 'images/work-05.jpg', title: 'Domaine viticole', meta: 'IDENTITÉ + SITE — 2024' },
      { img: 'images/work-06.jpg', title: 'Bistrot de quartier', meta: 'SITE + RÉSERVATION — 2023' },
      { img: 'images/work-07.jpg', title: 'Marque de cosmétiques', meta: 'BOUTIQUE EN LIGNE — 2026' },
      { img: 'images/work-08.jpg', title: 'Photographe de mariage', meta: 'PORTFOLIO — 2022' }
    ]
  },

  /* 5 · DEVISE */
  motto: {
    kicker: 'CE QUI GUIDE CHAQUE PROJET',
    words: [
      { word: 'Clarté', hint: 'Un message, une page, une action — rien de superflu.' },
      { word: 'Caractère', hint: 'Une identité qu’on reconnaît avant même de lire le nom.' },
      { word: 'Mouvement', hint: 'Des sites qui respirent et donnent envie de défiler.' }
    ]
  },

  /* 6-7 · PROCESSUS */
  universes: {
    introA: 'Un',
    introB: 'site,',
    introC: '3 étapes.',
    cta: 'Démarrer un projet →',
    image: 'images/process.jpg',
    items: [
      { name: 'Écouter', meta: 'ÉTAPE — 01', desc: 'Un atelier d’une heure pour comprendre votre métier, vos clients et ce qui vous rend unique.' },
      { name: 'Dessiner', meta: 'ÉTAPE — 02', desc: 'Identité, maquettes, textes : on avance ensemble, écran par écran, jusqu’à ce que ce soit juste.' },
      { name: 'Lancer', meta: 'ÉTAPE — 03', desc: 'Développement sur mesure, mise en ligne et référencement — puis un suivi les mois qui suivent.' }
    ]
  },

  /* 8 · PREUVE SOCIALE */
  testimonial: {
    kicker: 'IDENTITÉ + SITE, ATELIER CÉRAMIQUE',
    figure: '+180',
    unit: '%',
    quote: 'Pour la première fois, mon site me ressemble. Les clients arrivent en sachant déjà ce que je fais, et ils me demandent des pièces plutôt que des prix.',
    author: 'CLAIRE M. — CÉRAMISTE'
  },

  /* 9 · OBJECTIONS */
  objections: {
    items: ['Pas de template recyclé.', 'Pas de jargon.', 'Pas d’agence à rallonge.'],
    finale: 'Juste votre marque,',
    pill: 'en mieux.'
  },

  /* 10 · CONVERSION */
  contact: {
    kicker: 'UN PROJET, UNE IDÉE EN TÊTE ?',
    email: 'contact@studioantonin.fr',
    reassurance: 'RÉPONSE SOUS 48 H — PREMIER ÉCHANGE OFFERT, SANS ENGAGEMENT'
  },

  /* traînée sous la souris — 20 visuels */
  trail: [
    'images/tr-01.jpg', 'images/tr-02.jpg', 'images/tr-03.jpg', 'images/tr-04.jpg', 'images/tr-05.jpg',
    'images/tr-06.jpg', 'images/tr-07.jpg', 'images/tr-08.jpg', 'images/tr-09.jpg', 'images/tr-10.jpg',
    'images/tr-11.jpg', 'images/tr-12.jpg', 'images/tr-13.jpg', 'images/tr-14.jpg', 'images/tr-15.jpg',
    'images/tr-16.jpg', 'images/tr-17.jpg', 'images/tr-18.jpg', 'images/tr-19.jpg', 'images/tr-20.jpg'
  ]
};

/* ═══════════════════════════════════════════════════════════
   INJECTION — NE PAS MODIFIER (remplit le DOM avant app.js)
   ═══════════════════════════════════════════════════════════ */
(() => {
  const C = window.SITE_CONTENT;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const set = (sel, txt) => { const el = $(sel); if (el) el.textContent = txt; };

  document.title = C.brand.title;
  const md = document.querySelector('meta[name="description"]');
  if (md) md.setAttribute('content', C.brand.description);

  // chrome
  set('.loader-wordmark', C.brand.name);
  set('.dock-wordmark', C.brand.name);
  set('.dock-link[href="#travaux"]', C.nav.proof);
  set('.dock-link[href="#explorer"]', C.nav.universes);
  set('.dock-cta', C.nav.cta);

  // 1 · accroche
  set('#heroKicker', C.brand.kicker);
  set('#heroLine1', C.hook.line1);
  const hls = $$('#heroLine2 .hl');
  if (hls.length === 2) { hls[0].textContent = C.hook.line2a; hls[1].textContent = C.hook.line2b; }
  const g1 = $('#grow1 img');
  if (g1) { g1.src = C.hook.image; g1.alt = C.hook.imageAlt; }
  $$('.floaters .fl img').forEach((img, i) => { if (C.hook.floaters[i]) img.src = C.hook.floaters[i]; });

  // 2 · positionnement (un span par mot)
  const intro = $('#spotIntro');
  if (intro) intro.innerHTML = C.positioning.split(' ').map((w) => `<span>${w}</span>`).join(' ');

  // 3 · démarche
  const fill = $('#fillText');
  if (fill) {
    fill.innerHTML = C.manifesto.text.replace(
      /\[\[(.+?)\]\]/,
      '<span class="boxed" id="boxedPhrase">$1<svg class="box-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path id="boxPath" d="M50,6 C88,4 98,22 97,50 C96,82 76,96 49,95 C16,94 3,76 4,48 C5,18 20,7 50,6 Z"/></svg></span>'
    );
  }

  // 4 · preuve : masonry (8 photos) ou bento (4 features big/tall/tall/big)
  const head = $$('.coll-head > *');
  if (head.length === 4) {
    head[0].textContent = C.proof.kicker;
    head[1].textContent = C.proof.title;
    head[2].textContent = C.proof.sub;
    head[3].textContent = C.proof.meta;
  }
  const grid = $('#collGrid');
  if (grid && C.proof.layout === 'bento') {
    grid.className = 'bento-grid';
    grid.innerHTML = C.proof.features.map((f) =>
      `<figure class="card${f.size ? ' b-' + f.size : ''}"><div class="card-img"><img src="${f.illu}" alt="${f.title}"></div><figcaption>${f.title}<span class="mono">${f.meta}</span></figcaption></figure>`
    ).join('');
  } else if (grid) {
    grid.className = 'coll-grid';
    const SPEEDS = [-0.05, 0.06, -0.028, 0.085];
    grid.innerHTML = SPEEDS.map((s, ci) =>
      `<div class="col" data-pspeed="${s}">` +
      C.proof.projects.slice(ci * 2, ci * 2 + 2).map((p) =>
        `<figure class="card"><div class="card-img"><img src="${p.img}" alt="${p.title} — ${p.meta}"></div><figcaption>${p.title}<span class="mono">${p.meta}</span></figcaption></figure>`
      ).join('') + '</div>'
    ).join('');
  }

  // 5 · devise (train de mots-clés)
  set('#mottoKicker', C.motto.kicker);
  const mtrack = $('#mottoTrack');
  if (mtrack) mtrack.innerHTML = C.motto.words.map((w) => `<span class="mw">${w.word}</span>`).join('');

  // 6-7 · processus immersif (visuels posés un à un)
  set('#nw1', C.universes.introA);
  set('#nw2', C.universes.introB);
  set('#nw3', C.universes.introC);
  const g2 = $('#grow2 img');
  if (g2) g2.src = C.universes.image || (C.universes.items[0] || {}).img || g2.src;
  const psteps = $('#psteps');
  if (psteps) {
    psteps.innerHTML = C.universes.items.map((u) =>
      `<div class="pstep"><span class="pstep-meta mono ash">${u.meta}</span><h3>${u.name}</h3><p>${u.desc || ''}</p></div>`
    ).join('');
  }
  const sCta = $('#stepsCtaLink');
  if (sCta) sCta.childNodes[0].textContent = C.universes.cta;

  // 8 · preuve sociale — le chiffre qui frappe
  set('#figKicker', C.testimonial.kicker || '');
  const figM = String(C.testimonial.figure || '').trim().match(/^([^\d.,+-]*[+\u2212-]?)\s*(-?[\d.,]+)/);
  set('#figPre', figM ? figM[1] : '');
  set('#figVal', figM ? figM[2] : '');
  set('#figUnit', C.testimonial.unit || '');
  set('#quoteText', C.testimonial.quote);
  set('#quoteAuthor', C.testimonial.author);

  // 9 · objections
  C.objections.items.forEach((t, i) => set('#fs' + (i + 1), t));
  const fs4 = $('#fs4');
  if (fs4) {
    fs4.innerHTML = `${C.objections.finale} <span class="pill" id="pillPhrase">${C.objections.pill}<svg class="pill-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path id="pillPath" d="M50,6 C88,4 98,22 97,50 C96,82 76,96 49,95 C16,94 3,76 4,48 C5,18 20,7 50,6 Z"/></svg></span>`;
  }
  $$('#trail img').forEach((img, i) => { img.src = C.trail[i % C.trail.length]; });

  // 10 · conversion
  set('.footer-kicker', C.contact.kicker);
  const mail = $('.footer-mail');
  if (mail) { mail.href = 'mailto:' + C.contact.email; mail.querySelector('.footer-mail-text').textContent = C.contact.email; }
  set('.footer-reassurance', C.contact.reassurance);
  const fname = $('#footerName');
  if (fname) { fname.textContent = C.brand.name; fname.setAttribute('aria-label', C.brand.name); }
  const bottom = $$('.footer-bottom > p');
  if (bottom.length === 3) {
    bottom[0].textContent = C.brand.copyright;
    bottom[1].innerHTML = C.brand.socials.map((s) => `<a href="${s.url}" target="_blank" rel="noopener">${s.label}</a>`).join('&nbsp;&nbsp;&nbsp;');
    bottom[2].textContent = C.brand.signature;
  }
})();

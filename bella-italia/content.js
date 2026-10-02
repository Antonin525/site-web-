/* ═══════════════════════════════════════════════════════════
   RESTAURANT BELLA ITALIA — content.js (template « Site Immersif »)
   ► L'UNIQUE FICHIER À MODIFIER pour faire évoluer le site :
     textes, plats, prix, photos (toutes locales, dans images/).
   La partie « injection » en bas de fichier ne se modifie pas.
   ═══════════════════════════════════════════════════════════ */

window.SITE_CONTENT = {

  brand: {
    name: 'Restaurant Bella Italia',
    title: 'Restaurant Bella Italia — Cuisine italienne gastronomique',
    description: 'Restaurant Bella Italia : cuisine italienne de saison, pâtes fraîches faites maison, produits importés d’Italie et cave de vins italiens. Réservez votre table.',
    kicker: 'RESTAURANT BELLA ITALIA — CUISINE ITALIENNE',
    copyright: '© 2026 — RESTAURANT BELLA ITALIA',
    signature: 'FATTO A MANO, OGNI GIORNO',
    socials: [
      { label: 'INSTAGRAM ↗', url: 'https://www.instagram.com/bellaitalia.restaurant/' },
      { label: 'GOOGLE MAPS ↗', url: 'https://www.google.com/maps/search/Restaurant+Bella+Italia' }
    ]
  },

  nav: { proof: 'LA MAISON', universes: 'LA CARTE', cta: 'RÉSERVER UNE TABLE' },

  /* 1 · ACCROCHE */
  hook: {
    line1: 'La grande cuisine italienne,',
    line2a: 'servie avec',
    line2b: 'élégance.',
    image: 'images/hero.jpg',
    imageAlt: 'Tagliolini à la truffe noire, verre de vin rouge et huile d’olive sur une table sombre',
    floaters: [
      'images/fl-01.jpg', 'images/fl-02.jpg', 'images/fl-03.jpg', 'images/fl-04.jpg', 'images/fl-05.jpg',
      'images/fl-06.jpg', 'images/fl-07.jpg', 'images/fl-08.jpg', 'images/fl-09.jpg', 'images/fl-10.jpg'
    ]
  },

  /* 2 · POSITIONNEMENT — ≤ 42 caractères */
  positioning: 'Cuisine italienne de saison, faite maison',

  /* 3 · DÉMARCHE — [[…]] : 2 à 3 mots maximum */
  manifesto: {
    text: 'Chez Bella Italia, chaque assiette commence au marché et se termine à votre table. Pâtes tirées à la main chaque matin, produits venus d’Italie, et un service [[attentif, jamais pressé]].'
  },

  /* 4 · PREUVE — masonry, 8 signatures de la maison */
  proof: {
    layout: 'masonry',
    kicker: 'LES SIGNATURES DE LA MAISON',
    title: 'Ce que l’on vient goûter ici',
    sub: 'Des recettes de famille, revisitées avec les plus beaux produits de saison.',
    meta: 'HUIT ASSIETTES — DE MILAN À PALERME',
    projects: [
      { img: 'images/work-01.jpg', title: 'Tagliolini à la truffe noire', meta: 'PRIMI — OMBRIE' },
      { img: 'images/work-02.jpg', title: 'Burrata des Pouilles', meta: 'ANTIPASTI — POUILLES' },
      { img: 'images/work-03.jpg', title: 'Carpaccio de bœuf', meta: 'ANTIPASTI — PIÉMONT' },
      { img: 'images/work-04.jpg', title: 'Risotto alla milanese', meta: 'PRIMI — LOMBARDIE' },
      { img: 'images/work-05.jpg', title: 'Bar de ligne & caponata', meta: 'SECONDI — SICILE' },
      { img: 'images/work-06.jpg', title: 'Tagliata de bœuf', meta: 'SECONDI — TOSCANE' },
      { img: 'images/work-07.jpg', title: 'Tiramisù de la maison', meta: 'DOLCI — VÉNÉTIE' },
      { img: 'images/work-08.jpg', title: 'Cannoli siciliens', meta: 'DOLCI — SICILE' }
    ]
  },

  /* 5 · DEVISE */
  motto: {
    kicker: 'CE QUI GUIDE NOTRE CUISINE',
    words: [
      { word: 'Tradition', hint: 'Des recettes transmises, jamais figées.' },
      { word: 'Saison', hint: 'Une carte qui suit le marché, semaine après semaine.' },
      { word: 'Partage', hint: 'Une table où l’on prend le temps, ensemble.' }
    ]
  },

  /* ★ LA CARTE — catégories, plats, descriptions, prix et photos.
     Modifier librement : le nombre de plats par catégorie est libre.
     photo : 800×1000 (4:5) dans images/. */
  menu: {
    kicker: 'LA CARTE',
    title: 'Une cuisine de saison, à l’italienne',
    sub: 'Pâtes fraîches faites chaque matin, produits sélectionnés chez de petits producteurs italiens.',
    categories: [
      {
        name: 'Antipasti', label: 'POUR COMMENCER', photo: 'images/carte-antipasti.jpg', photoAlt: 'Burrata, tomates anciennes et basilic',
        dishes: [
          { name: 'Burrata des Pouilles', desc: 'Tomates anciennes, basilic, huile d’olive de Sicile', price: '16 €' },
          { name: 'Vitello tonnato', desc: 'Veau rosé, sauce au thon, câpres de Pantelleria', price: '18 €' },
          { name: 'Carpaccio de bœuf', desc: 'Roquette, copeaux de parmigiano 24 mois', price: '19 €' }
        ]
      },
      {
        name: 'Primi', label: 'PÂTES & RISOTTI', photo: 'images/carte-primi.jpg', photoAlt: 'Tagliolini à la truffe noire',
        dishes: [
          { name: 'Tagliolini al tartufo', desc: 'Pâtes fraîches, beurre noisette, truffe noire râpée à table', price: '29 €' },
          { name: 'Risotto alla milanese', desc: 'Safran, moelle, parmigiano reggiano', price: '26 €' },
          { name: 'Ravioli ricotta & citron', desc: 'Citron de Sorrente, beurre de sauge', price: '24 €' }
        ]
      },
      {
        name: 'Secondi', label: 'VIANDES & POISSONS', photo: 'images/carte-secondi.jpg', photoAlt: 'Bar de ligne sur caponata',
        dishes: [
          { name: 'Bar de ligne', desc: 'Caponata sicilienne, huile d’olive au basilic', price: '36 €' },
          { name: 'Osso buco', desc: 'Gremolata, polenta crémeuse', price: '34 €' },
          { name: 'Tagliata de bœuf', desc: 'Romarin, roquette, pommes grenaille rôties', price: '38 €' }
        ]
      },
      {
        name: 'Dolci', label: 'DESSERTS', photo: 'images/carte-dolci.jpg', photoAlt: 'Tiramisù de la maison et espresso',
        dishes: [
          { name: 'Tiramisù de la maison', desc: 'Mascarpone, café serré, cacao amer', price: '11 €' },
          { name: 'Panna cotta', desc: 'Vanille de Madagascar, coulis de fruits rouges', price: '10 €' },
          { name: 'Cannoli siciliens', desc: 'Ricotta de brebis, pistaches de Bronte', price: '12 €' }
        ]
      }
    ],
    tasting: 'MENU DÉGUSTATION EN 5 TEMPS — 78 € · ACCORD METS & VINS — 42 €',
    book: {
      title: 'Votre table vous attend.',
      text: 'Déjeuner, dîner en tête-à-tête ou grande tablée : réservez en quelques secondes.',
      cta: 'Réserver une table',
      hours: 'DU MARDI AU SAMEDI — 12 H–14 H 30 · 19 H–22 H 30'
    }
  },

  /* 6-7 · PROCESSUS */
  universes: {
    introA: 'Une',
    introB: 'soirée,',
    introC: '3 temps.',
    cta: 'Réserver une table →',
    image: 'images/process.jpg',
    items: [
      { name: 'Accueillir', meta: 'TEMPS — 01', desc: 'Un apéritif, une table dressée avec soin, le temps de choisir sans se presser.' },
      { name: 'Savourer', meta: 'TEMPS — 02', desc: 'Antipasti, pâtes fraîches et plats de saison, accordés à notre cave italienne.' },
      { name: 'Prolonger', meta: 'TEMPS — 03', desc: 'Un dolce, un espresso serré, un digestif — la soirée n’a pas à finir.' }
    ]
  },

  /* 8 · PREUVE SOCIALE — sans chiffre : la citation prend toute la place */
  testimonial: {
    kicker: 'CLIENTS FIDÈLES DEPUIS L’OUVERTURE',
    figure: '',
    unit: '',
    quote: 'Les tagliolini à la truffe valent à eux seuls le détour, mais c’est l’accueil qui nous fait revenir chaque mois. On s’y sent attendus, jamais pressés.',
    author: 'SOPHIE & MARC — CLIENTS'
  },

  /* 9 · OBJECTIONS */
  objections: {
    items: ['Pas de surgelé.', 'Pas de raccourci.', 'Pas de chichis.'],
    finale: 'Juste l’Italie,',
    pill: 'dans l’assiette.'
  },

  /* 10 · CONVERSION — réservation */
  contact: {
    kicker: 'RÉSERVER UNE TABLE',
    email: 'reservation@bellaitalia.fr',
    reassurance: 'DU MARDI AU SAMEDI — 12 H–14 H 30 · 19 H–22 H 30 — CONFIRMATION SOUS 2 H'
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

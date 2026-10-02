/* ═══════════════════════════════════════════════════════════
   RESTAURANT BELLA ITALIA — carte.js
   Construit la section « La Carte » à partir de SITE_CONTENT.menu.
   Chargé APRÈS content.js et AVANT app.js : les éléments .reveal
   doivent exister quand le moteur les recense.
   ═══════════════════════════════════════════════════════════ */
(() => {
  const C = window.SITE_CONTENT, M = C.menu;
  const root = document.getElementById('carte');
  if (!root || !M) return;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const subject = encodeURIComponent('Réservation — ' + C.brand.name);
  const bookHref = `mailto:${C.contact.email}?subject=${subject}`;

  root.querySelector('.carte-kicker').textContent = M.kicker;
  root.querySelector('.carte-title').textContent = M.title;
  root.querySelector('.carte-sub').textContent = M.sub;

  root.querySelector('#carteList').innerHTML = M.categories.map((cat, i) => `
    <article class="carte-cat">
      <figure class="carte-img reveal"><img src="${esc(cat.photo)}" alt="${esc(cat.photoAlt || cat.name)}" loading="lazy"></figure>
      <div class="carte-body">
        <p class="mono ash reveal">${String(i + 1).padStart(2, '0')} — ${esc(cat.label)}</p>
        <h3 class="carte-cat-name reveal">${esc(cat.name)}</h3>
        <ul class="carte-dishes">
          ${cat.dishes.map((d, k) => `
          <li class="dish reveal" style="--i:${k}">
            <p class="dish-row"><span class="dish-name">${esc(d.name)}</span><span class="dish-dots" aria-hidden="true"></span><span class="dish-price">${esc(d.price)}</span></p>
            <p class="dish-desc">${esc(d.desc)}</p>
          </li>`).join('')}
        </ul>
      </div>
    </article>`).join('');

  root.querySelector('.carte-tasting').textContent = M.tasting || '';
  const b = M.book;
  root.querySelector('.book-title').textContent = b.title;
  root.querySelector('.book-text').textContent = b.text;
  root.querySelector('.book-hours').textContent = b.hours;
  const btn = root.querySelector('.btn-book');
  btn.textContent = b.cta;
  btn.href = bookHref;
})();

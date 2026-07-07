// ══════════════════════════════════════════════════
// Opravna Machalovi — public site renderer
// Loads all content from /data JSON files (Crystal Valley architecture)
// ══════════════════════════════════════════════════

const GH_OWNER = localStorage.getItem('om_gh_owner') || 'PetrBroz-ofc';
const GH_REPO  = localStorage.getItem('om_gh_repo')  || 'machalovi-web';

// ── Fetch JSON: fresh from GitHub raw (after admin saves), fallback to local /data ──
async function fetchJson(file) {
  try {
    const r = await fetch(`https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/main/data/${file}?t=${Date.now()}`, { cache: 'no-store' });
    if (r.ok) return await r.json();
  } catch (e) { /* offline / repo not set up yet */ }
  try {
    const r = await fetch(`data/${file}?t=${Date.now()}`, { cache: 'no-store' });
    if (r.ok) return await r.json();
  } catch (e) { /* ignore */ }
  return null;
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text || '';
}

// ── SEO ──
function renderSeo(seo) {
  if (!seo) return;
  if (seo.title) document.title = seo.title;
  const set = (sel, attr, val) => { const el = document.querySelector(sel); if (el && val) el.setAttribute(attr, val); };
  set('meta[name="description"]', 'content', seo.description);
  set('meta[property="og:title"]', 'content', seo.title);
  set('meta[property="og:description"]', 'content', seo.description);
  set('meta[property="og:image"]', 'content', seo.ogImage);
  if (seo.favicon) document.getElementById('favicon').href = seo.favicon;
}

// ── HEADER / BRAND ──
function renderHeader(contact) {
  if (!contact) return;
  setText('brand-small', 'Opravna & klíče');
  setText('brand-title', contact.shortName || contact.businessName || '');
  const phoneBtn = document.getElementById('header-phone');
  if (contact.phone) {
    phoneBtn.href = 'tel:' + contact.phone.replace(/\s/g, '');
    phoneBtn.querySelector('span').textContent = contact.phone;
  } else {
    phoneBtn.style.display = 'none';
  }
}

// ── HERO ──
function renderHero(hero) {
  if (!hero) return;
  setText('hero-eyebrow', hero.eyebrow);
  document.getElementById('hero-title').innerHTML = esc(hero.title);
  setText('hero-desc', hero.description);

  const actions = document.getElementById('hero-actions');
  const btns = [];
  if (hero.btn1?.text) btns.push(`<a href="${esc(hero.btn1.link || '#')}" class="btn btn-primary">${esc(hero.btn1.text)}</a>`);
  if (hero.btn2?.text) btns.push(`<a href="${esc(hero.btn2.link || '#')}" class="btn btn-ghost">${esc(hero.btn2.text)}</a>`);
  actions.innerHTML = btns.join('');

  document.getElementById('hero-badges').innerHTML = (hero.badges || []).map(b =>
    `<span class="hero-badge">${esc(b.icon || '')} ${esc(b.text || b)}</span>`
  ).join('');

  const heroEl = document.getElementById('uvod');
  if (hero.bgImage) {
    heroEl.style.backgroundImage = `url('${esc(hero.bgImage)}')`;
    heroEl.classList.add('has-bg');
  }

  const visual = document.getElementById('hero-visual');
  if (hero.heroImage) {
    visual.innerHTML = `<div class="frame"><img src="${esc(hero.heroImage)}" alt="${esc(hero.subtitle || '')}"></div>`;
  } else {
    visual.style.display = 'none';
  }
}

// ── ABOUT ──
function renderAbout(about) {
  if (!about) return;
  setText('about-eyebrow', about.eyebrow || 'O nás');
  setText('about-title', about.title);
  setText('about-text', about.text);
  const visual = document.getElementById('about-visual');
  if (about.image) visual.innerHTML = `<div class="frame"><img src="${esc(about.image)}" alt="${esc(about.title || '')}"></div>`;
  else visual.style.display = 'none';
  document.getElementById('about-stats').innerHTML = (about.stats || []).map(s => `
    <div class="about-stat"><div class="num">${esc(s.num)}</div><div class="label">${esc(s.label)}</div></div>
  `).join('');
}

// ── SERVICES ──
function renderServices(services) {
  if (!Array.isArray(services)) return;
  document.getElementById('services-grid').innerHTML = services.map((s, i) => `
    <a class="service-card reveal" href="#sluzba-${i}">
      <span class="icon">${esc(s.icon || '🛠️')}</span>
      <h3>${esc(s.title)}</h3>
      <p>${esc(s.short || '')}</p>
      <span class="more">Více informací</span>
    </a>
  `).join('');

  document.getElementById('service-details').innerHTML = services.map((s, i) => `
    <div class="service-detail reveal" id="sluzba-${i}">
      <div class="sd-visual">
        ${s.image ? `<img src="${esc(s.image)}" alt="${esc(s.title)}">` : `<span class="icon-fallback">${esc(s.icon || '🛠️')}</span>`}
      </div>
      <div class="sd-body">
        <h3><span class="chip">${esc(s.icon || '🛠️')}</span> ${esc(s.title)}</h3>
        <p>${esc(s.description || '')}</p>
        <ul class="sd-features">${(s.features || []).map(f => `<li>${esc(f)}</li>`).join('')}</ul>
      </div>
    </div>
  `).join('');
}

// ── WHY US ──
function renderWhy(why) {
  if (!why) return;
  setText('why-eyebrow', why.eyebrow);
  setText('why-title', why.title);
  setText('why-sub', why.subtitle);
  document.getElementById('why-grid').innerHTML = (why.items || []).map(w => `
    <div class="why-card reveal">
      <div class="icon">${esc(w.icon || '⭐')}</div>
      <h3>${esc(w.title)}</h3>
      <p>${esc(w.text)}</p>
    </div>
  `).join('');
}

// ── PRICING ──
let pricingData = null;
function renderPricing(pricing) {
  if (!pricing) return;
  pricingData = pricing;
  setText('pricing-eyebrow', pricing.eyebrow || 'Ceník');
  setText('pricing-title', pricing.title);
  setText('price-note', pricing.note);
  const cats = pricing.categories || [];
  document.getElementById('price-tabs').innerHTML = cats.map((c, i) => `
    <button class="price-tab ${i === 0 ? 'active' : ''}" onclick="showPriceCat(${i}, this)">${esc(c.icon || '')} ${esc(c.name)}</button>
  `).join('');
  if (cats.length) showPriceCat(0);
}

function showPriceCat(i, btn) {
  const cat = pricingData?.categories?.[i];
  if (!cat) return;
  document.querySelectorAll('.price-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  else document.querySelectorAll('.price-tab')[i]?.classList.add('active');
  document.getElementById('price-card').innerHTML = (cat.items || []).map(it => `
    <div class="price-row">
      <span class="name">${esc(it.name)}</span>
      <span class="dots"></span>
      <span class="price">${esc(it.price)}</span>
    </div>
  `).join('') || '<p style="text-align:center;color:var(--muted)">Ceník připravujeme.</p>';
}

// ── GALLERY ──
let galleryImages = [];
function renderGallery(gallery) {
  if (!gallery) return;
  setText('gallery-eyebrow', gallery.eyebrow || 'Galerie');
  setText('gallery-title', gallery.title);
  galleryImages = gallery.images || [];
  const wrap = document.getElementById('gallery-content');
  if (!galleryImages.length) {
    wrap.innerHTML = `<div class="gallery-empty reveal"><span class="icon">📷</span>Fotografie z naší dílny právě připravujeme. Zastavte se zatím osobně!</div>`;
    return;
  }
  wrap.innerHTML = `<div class="gallery-grid">${galleryImages.map((g, i) => `
    <div class="gallery-item reveal" onclick="openLightbox(${i})">
      <img src="${esc(g.url)}" alt="${esc(g.label || '')}" loading="lazy">
      ${g.label ? `<div class="g-label">${esc(g.label)}</div>` : ''}
    </div>
  `).join('')}</div>`;
}

let lbIndex = 0;
function openLightbox(i) {
  lbIndex = i;
  updateLightbox();
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function updateLightbox() {
  const g = galleryImages[lbIndex];
  if (!g) return;
  document.getElementById('lightbox-img').src = g.url;
  document.getElementById('lightbox-label').textContent = g.label || '';
}
function stepLightbox(dir) {
  lbIndex = (lbIndex + dir + galleryImages.length) % galleryImages.length;
  updateLightbox();
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}
document.getElementById('lightbox').addEventListener('click', e => { if (e.target === e.currentTarget) closeLightbox(); });
document.addEventListener('keydown', e => {
  if (!document.getElementById('lightbox').classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') stepLightbox(-1);
  if (e.key === 'ArrowRight') stepLightbox(1);
});

// ── FAQ ──
function renderFaq(faq) {
  if (!faq) return;
  setText('faq-eyebrow', faq.eyebrow || 'Časté dotazy');
  setText('faq-title', faq.title);
  document.getElementById('faq-list').innerHTML = (faq.items || []).map((f, i) => `
    <div class="faq-item reveal">
      <button class="faq-q" onclick="toggleFaq(this)">
        ${esc(f.q)}
        <span class="faq-icon">+</span>
      </button>
      <div class="faq-a"><div class="faq-a-inner">${esc(f.a)}</div></div>
    </div>
  `).join('');
}

function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const answer = item.querySelector('.faq-a');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(o => {
    o.classList.remove('open');
    o.querySelector('.faq-a').style.maxHeight = null;
  });
  if (!isOpen) {
    item.classList.add('open');
    answer.style.maxHeight = answer.scrollHeight + 'px';
  }
}

// ── REVIEWS ──
function renderReviews(reviews) {
  if (!reviews) return;
  setText('reviews-eyebrow', reviews.eyebrow || 'Recenze');
  setText('reviews-title', reviews.title);
  document.getElementById('reviews-grid').innerHTML = (reviews.items || []).map(r => {
    const rating = Math.max(0, Math.min(5, parseInt(r.rating) || 5));
    const initial = (r.name || '?').trim().charAt(0).toUpperCase();
    return `
      <div class="review-card reveal">
        <div class="review-stars">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</div>
        <p class="review-text">${esc(r.text)}</p>
        <div class="review-name"><span class="avatar">${esc(initial)}</span> ${esc(r.name)}</div>
      </div>
    `;
  }).join('');
}

// ── CONTACT ──
function renderContact(contact) {
  if (!contact) return;
  setText('contact-eyebrow', contact.eyebrow || 'Kontakt');
  setText('contact-title', contact.title);

  const cards = [];
  cards.push(`
    <div class="contact-card">
      <span class="icon">🏠</span>
      <div><h4>Kde nás najdete</h4><p>${esc(contact.businessName)}</p><p style="font-weight:400">${esc(contact.address)}</p></div>
    </div>`);
  if (contact.phone) cards.push(`
    <div class="contact-card">
      <span class="icon">📞</span>
      <div><h4>Telefon</h4><a href="tel:${esc(contact.phone.replace(/\s/g, ''))}">${esc(contact.phone)}</a></div>
    </div>`);
  if (contact.email) cards.push(`
    <div class="contact-card">
      <span class="icon">✉️</span>
      <div><h4>E-mail</h4><a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a></div>
    </div>`);
  if (contact.hours?.length) cards.push(`
    <div class="contact-card">
      <span class="icon">🕐</span>
      <div style="flex:1"><h4>Otevírací doba</h4>
        <table class="hours-table">${contact.hours.map(h => `<tr><td>${esc(h.days)}</td><td>${esc(h.time)}</td></tr>`).join('')}</table>
      </div>
    </div>`);
  if (contact.note) cards.push(`<p class="contact-note">💳 ${esc(contact.note)}</p>`);
  document.getElementById('contact-cards').innerHTML = cards.join('');

  const mapWrap = document.getElementById('contact-map');
  let src = (contact.map || '').trim();
  const m = src.match(/src=["']([^"']+)["']/);
  if (m) src = m[1];
  if (src && /^https:\/\//.test(src)) {
    mapWrap.innerHTML = `<iframe src="${esc(src)}" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>`;
  } else {
    mapWrap.innerHTML = `<div class="map-placeholder"><span class="icon">📍</span>${esc(contact.address || 'Mapu právě připravujeme.')}</div>`;
  }
}

// ── FOOTER ──
function renderFooter(footer, contact) {
  if (!footer) footer = {};
  setText('footer-brand-name', contact?.businessName || '');
  setText('footer-text', footer.text);
  setText('footer-copyright', footer.copyright);

  const credit = document.getElementById('footer-credit');
  if (footer.credit?.text) {
    credit.innerHTML = footer.credit.link
      ? `<a href="${esc(footer.credit.link)}" target="_blank" rel="noopener">${esc(footer.credit.text)}</a>`
      : esc(footer.credit.text);
  }

  document.getElementById('footer-socials').innerHTML = (footer.socials || [])
    .filter(s => s.url)
    .map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener" title="${esc(s.label)}">${esc(s.icon || '🔗')}</a>`)
    .join('');

  const fc = [];
  if (contact?.address) fc.push(`<li>📍 ${esc(contact.address)}</li>`);
  if (contact?.phone) fc.push(`<li>📞 <a href="tel:${esc(contact.phone.replace(/\s/g, ''))}">${esc(contact.phone)}</a></li>`);
  if (contact?.email) fc.push(`<li>✉️ <a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a></li>`);
  document.getElementById('footer-contact').innerHTML = fc.join('');
}

// ── UI: header shadow + mobile nav ──
window.addEventListener('scroll', () => {
  document.getElementById('site-header').classList.toggle('scrolled', window.scrollY > 10);
});
const navToggle = document.getElementById('nav-toggle');
const mainNav = document.getElementById('main-nav');
navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('open');
  mainNav.classList.toggle('open');
});
mainNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  navToggle.classList.remove('open');
  mainNav.classList.remove('open');
}));

// ── Reveal animations ──
function initReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

// ── INIT ──
async function init() {
  const [seo, contact, hero, about, services, why, pricing, gallery, faq, reviews, footer] = await Promise.all([
    fetchJson('seo.json'), fetchJson('contact.json'), fetchJson('hero.json'), fetchJson('about.json'),
    fetchJson('services.json'), fetchJson('why.json'), fetchJson('pricing.json'), fetchJson('gallery.json'),
    fetchJson('faq.json'), fetchJson('reviews.json'), fetchJson('footer.json')
  ]);

  renderSeo(seo);
  renderHeader(contact);
  renderHero(hero);
  renderAbout(about);
  renderServices(services);
  renderWhy(why);
  renderPricing(pricing);
  renderGallery(gallery);
  renderFaq(faq);
  renderReviews(reviews);
  renderContact(contact);
  renderFooter(footer, contact);
  initReveal();
}

init();

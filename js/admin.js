// ══════════════════════════════════════════════════
// Opravna Machalovi — admin panel (Crystal Valley CMS architecture)
// Saving goes exclusively through /api/save (Vercel → GitHub).
// ══════════════════════════════════════════════════

// ── CONFIG ──
const API_URL = '/api/save';
const GH_OWNER = localStorage.getItem('om_gh_owner') || 'PetrBroz-ofc';
const GH_REPO  = localStorage.getItem('om_gh_repo')  || 'machalovi-web';
const DEFAULT_USER = 'admin';
const DEFAULT_PASS = 'machalovi2026';

const FILES = ['hero','about','services','why','pricing','gallery','faq','reviews','contact','footer','seo'];

let DATA = {
  hero: {}, about: {}, services: [], why: {}, pricing: {},
  gallery: {}, faq: {}, reviews: {}, contact: {}, footer: {}, seo: {}
};
let fileSHAs = {};
let currentModal = null;
let editIndex = -1;

// ── AUTH ──
function init() {
  if (!localStorage.getItem('om_user')) localStorage.setItem('om_user', DEFAULT_USER);
  if (!localStorage.getItem('om_pass')) localStorage.setItem('om_pass', DEFAULT_PASS);
  show('login-screen');
}

function login() {
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const err = document.getElementById('login-error');
  if (user === localStorage.getItem('om_user') && pass === localStorage.getItem('om_pass')) {
    err.style.display = 'none';
    show('admin-screen');
    loadData();
  } else {
    err.style.display = 'block';
  }
}

function logout() { show('login-screen'); document.getElementById('login-pass').value = ''; }

function changeCredentials() {
  const user = document.getElementById('new-user').value.trim();
  const pass = document.getElementById('new-pass').value;
  const pass2 = document.getElementById('new-pass2').value;
  const msg = document.getElementById('settings-msg');
  if (!user || !pass) { showMsg(msg, '❌ Vyplňte všechna pole.', false); return; }
  if (pass !== pass2) { showMsg(msg, '❌ Hesla se neshodují.', false); return; }
  localStorage.setItem('om_user', user);
  localStorage.setItem('om_pass', pass);
  showMsg(msg, '✅ Přihlašovací údaje uloženy.', true);
  ['new-user','new-pass','new-pass2'].forEach(id => document.getElementById(id).value = '');
}

function saveGhConfig() {
  const owner = val('gh-owner').trim();
  const repo = val('gh-repo').trim();
  if (owner) localStorage.setItem('om_gh_owner', owner);
  if (repo) localStorage.setItem('om_gh_repo', repo);
  toast('✅ Nastavení uloženo. Obnovte stránku.', 'success');
}

function showMsg(el, text, ok) {
  el.style.display = 'block';
  el.style.color = ok ? 'var(--green)' : 'var(--red)';
  el.textContent = text;
}

function show(id) {
  ['login-screen','admin-screen'].forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = s === id ? (id === 'admin-screen' ? 'block' : 'flex') : 'none';
  });
}

// ── GITHUB API (čtení přes raw, zápis POUZE přes /api/save) ──
async function ghGet(path) {
  try {
    const r = await fetch(`https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/main/${path}?t=${Date.now()}`, { cache: 'no-store' });
    if (r.ok) return await r.json();
  } catch (e) { /* fallthrough */ }
  try {
    const r = await fetch(`${path}?t=${Date.now()}`, { cache: 'no-store' });
    if (r.ok) return await r.json();
  } catch (e) { /* ignore */ }
  return null;
}

async function ghPut(path, content, sha) {
  const r = await fetch(API_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, content, sha })
  });
  if (!r.ok) { toast('❌ Chyba uložení', 'error'); return false; }
  const d = await r.json();
  if (d.content) fileSHAs[path] = d.content.sha;
  return true;
}

async function ghUploadFile(filename, base64data, folder = 'assets') {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${folder}/${Date.now()}_${safeName}`;
  const r = await fetch(API_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, content: base64data, isBase64: true })
  });
  if (!r.ok) { console.error('Upload failed', r.status); return null; }
  return `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/main/${path}`;
}

// ── DATA ──
async function loadData() {
  for (const f of FILES) {
    const parsed = await ghGet(`data/${f}.json`);
    if (parsed !== null) DATA[f] = parsed;
  }
  // SHA pro ukládání (best effort)
  for (const f of FILES) {
    try {
      const r = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/data/${f}.json`);
      if (r.ok) { const d = await r.json(); fileSHAs[`data/${f}.json`] = d.sha; }
    } catch (e) { /* ignore */ }
  }
  fillAllForms();
  renderAllLists();
}

async function saveFile(key) {
  const path = `data/${key}.json`;
  return await ghPut(path, JSON.stringify(DATA[key], null, 2), fileSHAs[path]);
}

// ── FORM FILL ──
function fillAllForms() {
  const h = DATA.hero || {};
  setVal('h-eyebrow', h.eyebrow); setVal('h-title', h.title); setVal('h-subtitle', h.subtitle); setVal('h-desc', h.description);
  setVal('h-btn1-text', h.btn1?.text); setVal('h-btn1-link', h.btn1?.link);
  setVal('h-btn2-text', h.btn2?.text); setVal('h-btn2-link', h.btn2?.link);
  document.getElementById('h-badges').innerHTML = (h.badges || []).map(badgeRow).join('');
  setImage('hero-bg', h.bgImage); setImage('hero-img', h.heroImage);

  const a = DATA.about || {};
  setVal('a-eyebrow', a.eyebrow); setVal('a-title', a.title); setVal('a-text', a.text);
  setImage('about-img', a.image);
  document.getElementById('a-stats').innerHTML = (a.stats || []).map(statRow).join('');

  const w = DATA.why || {};
  setVal('w-eyebrow', w.eyebrow); setVal('w-title', w.title); setVal('w-sub', w.subtitle);
  document.getElementById('w-items').innerHTML = (w.items || []).map(whyRow).join('');

  const p = DATA.pricing || {};
  setVal('p-eyebrow', p.eyebrow); setVal('p-title', p.title); setVal('p-note', p.note);

  const g = DATA.gallery || {};
  setVal('g-eyebrow', g.eyebrow); setVal('g-title', g.title);

  const f = DATA.faq || {};
  setVal('f-eyebrow', f.eyebrow); setVal('f-title', f.title);

  const r = DATA.reviews || {};
  setVal('r-eyebrow', r.eyebrow); setVal('r-title', r.title);

  const c = DATA.contact || {};
  setVal('c-eyebrow', c.eyebrow); setVal('c-title', c.title);
  setVal('c-businessName', c.businessName); setVal('c-shortName', c.shortName);
  setVal('c-address', c.address); setVal('c-phone', c.phone); setVal('c-email', c.email); setVal('c-note', c.note);
  setVal('c-map', c.map);
  document.getElementById('c-hours').innerHTML = (c.hours || []).map(hoursRow).join('');

  const ft = DATA.footer || {};
  setVal('ft-text', ft.text); setVal('ft-copyright', ft.copyright);
  setVal('ft-credit-text', ft.credit?.text); setVal('ft-credit-link', ft.credit?.link);
  document.getElementById('ft-socials').innerHTML = (ft.socials || []).map(socialRow).join('');

  const s = DATA.seo || {};
  setVal('s-title', s.title); setVal('s-desc', s.description);
  setImage('seo-fav', s.favicon); setImage('seo-og', s.ogImage);

  setVal('gh-owner', GH_OWNER); setVal('gh-repo', GH_REPO);
}

function renderAllLists() {
  renderServicesList();
  renderPriceCats();
  renderGalleryAdmin();
  renderFaqList();
  renderReviewsList();
}

// ── SUB-ROW BUILDERS ──
function badgeRow(b = {}) {
  return `<div class="sub-row cols-icon h-badge-row">
    <input type="text" class="sr-icon" value="${esc(b.icon)}" placeholder="🔑">
    <input type="text" class="sr-text" value="${esc(b.text)}" placeholder="Text odznaku">
    <div style="display:flex;gap:0.3rem">
      <button class="btn-move" onclick="moveSubRow(this,-1)" title="Nahoru">↑</button>
      <button class="btn-move" onclick="moveSubRow(this,1)" title="Dolů">↓</button>
      <button class="btn btn-danger" onclick="this.closest('.sub-row').remove()">🗑</button>
    </div>
  </div>`;
}
function addBadgeRow() { appendRow('h-badges', badgeRow()); }

function statRow(s = {}) {
  return `<div class="sub-row cols-2 a-stat-row">
    <input type="text" class="sr-num" value="${esc(s.num)}" placeholder="30+">
    <input type="text" class="sr-label" value="${esc(s.label)}" placeholder="let řemesla">
    <div style="display:flex;gap:0.3rem">
      <button class="btn-move" onclick="moveSubRow(this,-1)" title="Nahoru">↑</button>
      <button class="btn-move" onclick="moveSubRow(this,1)" title="Dolů">↓</button>
      <button class="btn btn-danger" onclick="this.closest('.sub-row').remove()">🗑</button>
    </div>
  </div>`;
}
function addStatRow() { appendRow('a-stats', statRow()); }

function whyRow(w = {}) {
  return `<div class="sub-row cols-3 w-item-row">
    <input type="text" class="sr-icon" value="${esc(w.icon)}" placeholder="🏠">
    <input type="text" class="sr-title" value="${esc(w.title)}" placeholder="Nadpis">
    <textarea class="sr-text" placeholder="Text">${esc(w.text)}</textarea>
    <div style="display:flex;gap:0.3rem">
      <button class="btn-move" onclick="moveSubRow(this,-1)" title="Nahoru">↑</button>
      <button class="btn-move" onclick="moveSubRow(this,1)" title="Dolů">↓</button>
      <button class="btn btn-danger" onclick="this.closest('.sub-row').remove()">🗑</button>
    </div>
  </div>`;
}
function addWhyRow() { appendRow('w-items', whyRow()); }

function hoursRow(h = {}) {
  return `<div class="sub-row cols-2 c-hours-row">
    <input type="text" class="sr-days" value="${esc(h.days)}" placeholder="Pondělí – Pátek">
    <input type="text" class="sr-time" value="${esc(h.time)}" placeholder="8:00 – 17:00">
    <div style="display:flex;gap:0.3rem">
      <button class="btn-move" onclick="moveSubRow(this,-1)" title="Nahoru">↑</button>
      <button class="btn-move" onclick="moveSubRow(this,1)" title="Dolů">↓</button>
      <button class="btn btn-danger" onclick="this.closest('.sub-row').remove()">🗑</button>
    </div>
  </div>`;
}
function addHoursRow() { appendRow('c-hours', hoursRow()); }

function socialRow(s = {}) {
  return `<div class="sub-row cols-icon-2 ft-social-row">
    <input type="text" class="sr-icon" value="${esc(s.icon)}" placeholder="📘">
    <input type="text" class="sr-label" value="${esc(s.label)}" placeholder="Facebook">
    <input type="text" class="sr-url" value="${esc(s.url)}" placeholder="https://facebook.com/...">
    <div style="display:flex;gap:0.3rem">
      <button class="btn-move" onclick="moveSubRow(this,-1)" title="Nahoru">↑</button>
      <button class="btn-move" onclick="moveSubRow(this,1)" title="Dolů">↓</button>
      <button class="btn btn-danger" onclick="this.closest('.sub-row').remove()">🗑</button>
    </div>
  </div>`;
}
function addSocialRow() { appendRow('ft-socials', socialRow()); }

function priceItemRow(it = {}) {
  return `<div class="sub-row cols-2 p-item-row">
    <input type="text" class="sr-name" value="${esc(it.name)}" placeholder="Výměna podpatků">
    <input type="text" class="sr-price" value="${esc(it.price)}" placeholder="od 150 Kč">
    <div style="display:flex;gap:0.3rem">
      <button class="btn-move" onclick="moveSubRow(this,-1)" title="Nahoru">↑</button>
      <button class="btn-move" onclick="moveSubRow(this,1)" title="Dolů">↓</button>
      <button class="btn btn-danger" onclick="this.closest('.sub-row').remove()">🗑</button>
    </div>
  </div>`;
}
function addPriceItemRow() { appendRow('m-price-items', priceItemRow()); }

function appendRow(containerId, html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  document.getElementById(containerId).appendChild(div.firstElementChild);
}

function moveSubRow(btn, dir) {
  const row = btn.closest('.sub-row');
  if (dir < 0) { const prev = row.previousElementSibling; if (prev) row.parentNode.insertBefore(row, prev); }
  else { const next = row.nextElementSibling; if (next) row.parentNode.insertBefore(next, row); }
}

function gatherRows(containerId, map) {
  return [...document.querySelectorAll(`#${containerId} .sub-row`)].map(row => {
    const out = {};
    for (const [key, cls] of Object.entries(map)) out[key] = row.querySelector(`.${cls}`)?.value?.trim() ?? '';
    return out;
  }).filter(o => Object.values(o).some(v => v));
}

// ── IMAGE UPLOAD (okamžitý upload do /assets přes /api/save) ──
async function uploadImage(input, key) {
  if (!input.files?.[0]) return;
  const file = input.files[0];
  toast('⏳ Nahrávám obrázek...', 'info');
  await new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = async e => {
      const url = await ghUploadFile(file.name, e.target.result.split(',')[1]);
      if (url) { setImage(key, url); toast('✅ Obrázek nahrán. Nezapomeňte uložit sekci.', 'success'); }
      else toast('❌ Nahrání selhalo (funguje jen na nasazeném webu)', 'error');
      resolve();
    };
    reader.readAsDataURL(file);
  });
  input.value = '';
}

function setImage(key, url) {
  const hidden = document.getElementById(`val-${key}`);
  const prev = document.getElementById(`prev-${key}`);
  const clearBtn = document.getElementById(`clear-${key}`);
  if (!hidden) return;
  hidden.value = url || '';
  if (prev) { prev.src = url || ''; prev.style.display = url ? 'block' : 'none'; }
  if (clearBtn) clearBtn.style.display = url ? 'inline-flex' : 'none';
}

function clearImage(key) { setImage(key, ''); }

// ── TABS ──
function showTab(name, btn) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');
  btn.classList.add('active');
}

// ── SECTION SAVES ──
async function saveHero() {
  DATA.hero = {
    eyebrow: val('h-eyebrow'), title: val('h-title'), subtitle: val('h-subtitle'),
    description: val('h-desc'),
    btn1: { text: val('h-btn1-text'), link: val('h-btn1-link') },
    btn2: { text: val('h-btn2-text'), link: val('h-btn2-link') },
    badges: gatherRows('h-badges', { icon: 'sr-icon', text: 'sr-text' }),
    bgImage: val('val-hero-bg'), heroImage: val('val-hero-img')
  };
  if (await saveFile('hero')) toast('✅ Hero uloženo!', 'success');
}

async function saveAbout() {
  DATA.about = {
    eyebrow: val('a-eyebrow'), title: val('a-title'), text: val('a-text'),
    image: val('val-about-img'),
    stats: gatherRows('a-stats', { num: 'sr-num', label: 'sr-label' })
  };
  if (await saveFile('about')) toast('✅ O nás uloženo!', 'success');
}

async function saveWhy() {
  DATA.why = {
    eyebrow: val('w-eyebrow'), title: val('w-title'), subtitle: val('w-sub'),
    items: gatherRows('w-items', { icon: 'sr-icon', title: 'sr-title', text: 'sr-text' })
  };
  if (await saveFile('why')) toast('✅ Proč my uloženo!', 'success');
}

async function savePricingHeader() {
  DATA.pricing = DATA.pricing || {};
  DATA.pricing.eyebrow = val('p-eyebrow');
  DATA.pricing.title = val('p-title');
  DATA.pricing.note = val('p-note');
  DATA.pricing.categories = DATA.pricing.categories || [];
  if (await saveFile('pricing')) toast('✅ Ceník uložen!', 'success');
}

async function saveGallery(headerOnly = false) {
  DATA.gallery = DATA.gallery || {};
  DATA.gallery.eyebrow = val('g-eyebrow');
  DATA.gallery.title = val('g-title');
  DATA.gallery.images = DATA.gallery.images || [];
  if (await saveFile('gallery')) toast(headerOnly ? '✅ Nadpis uložen!' : '✅ Galerie uložena!', 'success');
}

async function saveFaqHeader() {
  DATA.faq = DATA.faq || {};
  DATA.faq.eyebrow = val('f-eyebrow');
  DATA.faq.title = val('f-title');
  DATA.faq.items = DATA.faq.items || [];
  if (await saveFile('faq')) toast('✅ Nadpis uložen!', 'success');
}

async function saveReviewsHeader() {
  DATA.reviews = DATA.reviews || {};
  DATA.reviews.eyebrow = val('r-eyebrow');
  DATA.reviews.title = val('r-title');
  DATA.reviews.items = DATA.reviews.items || [];
  if (await saveFile('reviews')) toast('✅ Nadpis uložen!', 'success');
}

async function saveContact() {
  DATA.contact = {
    eyebrow: val('c-eyebrow'), title: val('c-title'),
    businessName: val('c-businessName'), shortName: val('c-shortName'),
    address: val('c-address'), phone: val('c-phone'), email: val('c-email'), note: val('c-note'),
    hours: gatherRows('c-hours', { days: 'sr-days', time: 'sr-time' }),
    map: val('c-map')
  };
  if (await saveFile('contact')) toast('✅ Kontakt uložen!', 'success');
}

async function saveFooter() {
  DATA.footer = {
    text: val('ft-text'), copyright: val('ft-copyright'),
    credit: { text: val('ft-credit-text'), link: val('ft-credit-link') },
    socials: gatherRows('ft-socials', { icon: 'sr-icon', label: 'sr-label', url: 'sr-url' })
  };
  if (await saveFile('footer')) toast('✅ Patička uložena!', 'success');
}

async function saveSeo() {
  DATA.seo = {
    title: val('s-title'), description: val('s-desc'),
    favicon: val('val-seo-fav'), ogImage: val('val-seo-og')
  };
  if (await saveFile('seo')) toast('✅ SEO uloženo!', 'success');
}

// ── LIST HELPERS (services / pricecat / faq / review / gallery) ──
function getArr(type) {
  if (type === 'services') return DATA.services;
  if (type === 'pricecat') { DATA.pricing.categories = DATA.pricing.categories || []; return DATA.pricing.categories; }
  if (type === 'faq') { DATA.faq.items = DATA.faq.items || []; return DATA.faq.items; }
  if (type === 'review') { DATA.reviews.items = DATA.reviews.items || []; return DATA.reviews.items; }
  if (type === 'gallery') { DATA.gallery.images = DATA.gallery.images || []; return DATA.gallery.images; }
  return [];
}

function saveKeyFor(type) {
  return { services: 'services', pricecat: 'pricing', faq: 'faq', review: 'reviews', gallery: 'gallery' }[type];
}

function renderByType(type) {
  if (type === 'services') renderServicesList();
  else if (type === 'pricecat') renderPriceCats();
  else if (type === 'faq') renderFaqList();
  else if (type === 'review') renderReviewsList();
  else if (type === 'gallery') renderGalleryAdmin();
}

// ── LIST RENDERING ──
function listRowHtml(type, i, arrLen, iconOrImg, title, subtitle) {
  return `
    <div class="item-row" draggable="true"
      ondragstart="itemDragStart(event,'${type}',${i})"
      ondragover="itemDragOver(event)"
      ondragleave="itemDragLeave(event)"
      ondrop="itemDrop(event,'${type}',${i})"
      ondragend="itemDragEnd(event)">
      <span class="drag-handle" title="Přetáhněte pro změnu pořadí">☰</span>
      ${iconOrImg}
      <div class="item-row-info">
        <strong>${title}</strong>
        <span>${subtitle}</span>
      </div>
      <div class="item-actions">
        <button class="btn-move" onclick="moveItem('${type}',${i},-1)" ${i === 0 ? 'disabled' : ''} title="Nahoru">↑</button>
        <button class="btn-move" onclick="moveItem('${type}',${i},1)" ${i === arrLen - 1 ? 'disabled' : ''} title="Dolů">↓</button>
        <button class="btn btn-outline" onclick="openModal('${type}',${i})">✏️ Upravit</button>
        <button class="btn btn-danger" onclick="deleteItem('${type}',${i})">🗑</button>
      </div>
    </div>`;
}

function renderServicesList() {
  const el = document.getElementById('list-services');
  const arr = DATA.services || [];
  if (!arr.length) { el.innerHTML = '<p style="color:var(--coffee);font-size:0.85rem;padding:0.5rem">Zatím žádné služby.</p>'; return; }
  el.innerHTML = arr.map((s, i) => listRowHtml('services', i, arr.length,
    s.image ? `<img src="${esc(s.image)}" alt="">` : `<div class="row-icon">${esc(s.icon) || '🛠️'}</div>`,
    esc(s.title) || '—', esc(s.short || '')
  )).join('');
}

function renderPriceCats() {
  const el = document.getElementById('list-pricecats');
  const arr = DATA.pricing?.categories || [];
  if (!arr.length) { el.innerHTML = '<p style="color:var(--coffee);font-size:0.85rem;padding:0.5rem">Zatím žádné kategorie.</p>'; return; }
  el.innerHTML = arr.map((c, i) => listRowHtml('pricecat', i, arr.length,
    `<div class="row-icon">${esc(c.icon) || '💰'}</div>`,
    esc(c.name) || '—', `${(c.items || []).length} položek`
  )).join('');
}

function renderFaqList() {
  const el = document.getElementById('list-faq');
  const arr = DATA.faq?.items || [];
  if (!arr.length) { el.innerHTML = '<p style="color:var(--coffee);font-size:0.85rem;padding:0.5rem">Zatím žádné otázky.</p>'; return; }
  el.innerHTML = arr.map((f, i) => listRowHtml('faq', i, arr.length,
    `<div class="row-icon">❓</div>`,
    esc(f.q) || '—', esc(f.a || '')
  )).join('');
}

function renderReviewsList() {
  const el = document.getElementById('list-reviews');
  const arr = DATA.reviews?.items || [];
  if (!arr.length) { el.innerHTML = '<p style="color:var(--coffee);font-size:0.85rem;padding:0.5rem">Zatím žádné recenze.</p>'; return; }
  el.innerHTML = arr.map((r, i) => listRowHtml('review', i, arr.length,
    `<div class="row-icon">💬</div>`,
    `${esc(r.name) || '—'} · ${'★'.repeat(Math.max(0, Math.min(5, parseInt(r.rating) || 5)))}`,
    esc(r.text || '')
  )).join('');
}

// ── GALLERY ADMIN ──
function renderGalleryAdmin() {
  const el = document.getElementById('gallery-admin-grid');
  const arr = DATA.gallery?.images || [];
  if (!arr.length) { el.innerHTML = '<p style="color:var(--coffee);font-size:0.85rem;padding:0.5rem;grid-column:1/-1">Galerie je prázdná.</p>'; return; }
  el.innerHTML = arr.map((g, i) => `
    <div class="gallery-admin-item" draggable="true"
      ondragstart="itemDragStart(event,'gallery',${i})"
      ondragover="itemDragOver(event)"
      ondragleave="itemDragLeave(event)"
      ondrop="itemDrop(event,'gallery',${i})"
      ondragend="itemDragEnd(event)">
      <img src="${esc(g.url)}" alt="">
      <span class="g-num">${i + 1}</span>
      <button class="g-del" onclick="deleteItem('gallery',${i})">✕</button>
      <input type="text" value="${esc(g.label)}" placeholder="Popisek" oninput="DATA.gallery.images[${i}].label=this.value">
    </div>
  `).join('');
}

async function handleGalleryUpload(input) {
  if (!input.files?.length) return;
  const files = Array.from(input.files);
  const progress = document.getElementById('gal-progress');
  const progressText = document.getElementById('gal-progress-text');
  const progressFill = document.getElementById('gal-progress-fill');
  progress.style.display = 'block';

  DATA.gallery.images = DATA.gallery.images || [];
  let uploaded = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    progressText.textContent = `Nahrávám ${i + 1} z ${files.length}: ${file.name}`;
    progressFill.style.width = `${(i / files.length) * 100}%`;

    await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = async e => {
        const url = await ghUploadFile(file.name, e.target.result.split(',')[1]);
        if (url) { DATA.gallery.images.push({ url, label: '' }); uploaded++; renderGalleryAdmin(); }
        resolve();
      };
      reader.readAsDataURL(file);
    });
  }

  progressFill.style.width = '100%';
  if (uploaded) {
    progressText.textContent = `✅ Nahráno ${uploaded} fotek, ukládám...`;
    await saveGallery();
  } else {
    progressText.textContent = '❌ Nahrání selhalo (funguje jen na nasazeném webu)';
    toast('❌ Nahrání selhalo', 'error');
  }
  setTimeout(() => { progress.style.display = 'none'; }, 2500);
  input.value = '';
}

// ── REORDER (drag & drop + šipky) ──
let dragItemType = null, dragItemIndex = null;

function itemDragStart(e, type, i) {
  dragItemType = type;
  dragItemIndex = i;
  e.dataTransfer.effectAllowed = 'move';
  e.currentTarget.classList.add('dragging');
}

function itemDragOver(e) { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }
function itemDragLeave(e) { e.currentTarget.classList.remove('drag-over'); }

async function itemDrop(e, type, i) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  if (dragItemType !== type || dragItemIndex === null || dragItemIndex === i) return;
  const arr = getArr(type);
  const moved = arr.splice(dragItemIndex, 1)[0];
  arr.splice(i, 0, moved);
  dragItemIndex = null; dragItemType = null;
  renderByType(type);
  if (await saveFile(saveKeyFor(type))) toast('✅ Pořadí uloženo', 'success');
}

function itemDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
}

async function moveItem(type, i, dir) {
  const arr = getArr(type);
  const j = i + dir;
  if (j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  renderByType(type);
  if (await saveFile(saveKeyFor(type))) toast('✅ Pořadí uloženo', 'success');
}

async function deleteItem(type, i) {
  if (!confirm('Opravdu smazat?')) return;
  getArr(type).splice(i, 1);
  if (await saveFile(saveKeyFor(type))) {
    toast('🗑 Smazáno', 'info');
    renderByType(type);
  }
}

// ── MODAL ──
function openModal(type, index = -1) {
  currentModal = type;
  editIndex = index;
  const item = index >= 0 ? getArr(type)[index] : {};

  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');

  if (type === 'service') {
    // 'service' modal edituje pole DATA.services (typ seznamu je 'services')
    currentModal = 'services';
    const it = index >= 0 ? DATA.services[index] : {};
    title.textContent = index >= 0 ? 'Upravit službu' : 'Přidat službu';
    body.innerHTML = serviceForm(it);
    setImage('svc-img', it.image);
  } else if (type === 'services') {
    const it = index >= 0 ? DATA.services[index] : {};
    title.textContent = index >= 0 ? 'Upravit službu' : 'Přidat službu';
    body.innerHTML = serviceForm(it);
    setImage('svc-img', it.image);
  } else if (type === 'pricecat') {
    title.textContent = index >= 0 ? 'Upravit kategorii' : 'Přidat kategorii';
    body.innerHTML = priceCatForm(item);
  } else if (type === 'faq') {
    title.textContent = index >= 0 ? 'Upravit otázku' : 'Přidat otázku';
    body.innerHTML = faqForm(item);
  } else if (type === 'review') {
    title.textContent = index >= 0 ? 'Upravit recenzi' : 'Přidat recenzi';
    body.innerHTML = reviewForm(item);
  }

  document.getElementById('modal').classList.add('open');
}

function closeModal() { document.getElementById('modal').classList.remove('open'); }

// ── MODAL FORMS ──
function serviceForm(s = {}) {
  return `
    <div class="field-grid">
      <div class="field"><label>Ikona (emoji)</label><input type="text" id="m-icon" value="${esc(s.icon)}" placeholder="👞"></div>
      <div class="field"><label>Název služby</label><input type="text" id="m-title" value="${esc(s.title)}"></div>
    </div>
    <div class="field"><label>Krátký popis (na kartě)</label><textarea id="m-short" rows="2">${esc(s.short)}</textarea></div>
    <div class="field"><label>Podrobný popis</label><textarea id="m-desc" rows="4">${esc(s.description)}</textarea></div>
    <div class="field"><label>Co děláme (jedna položka na řádek)</label><textarea id="m-features" rows="5">${esc((s.features || []).join('\n'))}</textarea></div>
    <div class="field"><label>Fotografie služby (nepovinné)</label>
      <div class="upload-area" onclick="document.getElementById('up-svc-img').click()">
        <span class="upload-icon">📷</span>Klikněte pro výběr fotografie
        <input type="file" id="up-svc-img" accept="image/*" onchange="uploadImage(this,'svc-img')">
      </div>
      <div class="upload-preview-wrap">
        <img id="prev-svc-img" class="upload-preview">
        <button class="btn btn-outline" id="clear-svc-img" style="display:none" onclick="clearImage('svc-img')">✕ Odebrat</button>
      </div>
      <input type="hidden" id="val-svc-img">
    </div>
  `;
}

function priceCatForm(c = {}) {
  return `
    <div class="field-grid">
      <div class="field"><label>Ikona (emoji)</label><input type="text" id="m-icon" value="${esc(c.icon)}" placeholder="👞"></div>
      <div class="field"><label>Název kategorie</label><input type="text" id="m-name" value="${esc(c.name)}"></div>
    </div>
    <div class="sub-row-head"><label>Položky ceníku</label><button class="btn btn-outline" type="button" onclick="addPriceItemRow()">+ Přidat položku</button></div>
    <div id="m-price-items">${(c.items || []).map(priceItemRow).join('')}</div>
  `;
}

function faqForm(f = {}) {
  return `
    <div class="field"><label>Otázka</label><input type="text" id="m-q" value="${esc(f.q)}"></div>
    <div class="field"><label>Odpověď</label><textarea id="m-a" rows="5">${esc(f.a)}</textarea></div>
  `;
}

function reviewForm(r = {}) {
  const rating = parseInt(r.rating) || 5;
  return `
    <div class="field-grid">
      <div class="field"><label>Jméno zákazníka</label><input type="text" id="m-name" value="${esc(r.name)}" placeholder="Jana K."></div>
      <div class="field"><label>Hodnocení</label>
        <select id="m-rating">
          ${[5, 4, 3, 2, 1].map(n => `<option value="${n}" ${rating === n ? 'selected' : ''}>${'★'.repeat(n)}${'☆'.repeat(5 - n)}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="field"><label>Text recenze</label><textarea id="m-text" rows="5">${esc(r.text)}</textarea></div>
  `;
}

// ── MODAL SAVE ──
async function saveModal() {
  const btn = document.getElementById('modal-save-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Ukládám...';

  try {
    if (currentModal === 'services') {
      const item = {
        icon: val('m-icon'), title: val('m-title'), short: val('m-short'),
        description: val('m-desc'),
        features: val('m-features').split('\n').map(f => f.trim()).filter(Boolean),
        image: val('val-svc-img')
      };
      if (editIndex >= 0) DATA.services[editIndex] = item; else DATA.services.push(item);
      if (await saveFile('services')) { toast('✅ Služba uložena!', 'success'); closeModal(); renderServicesList(); }

    } else if (currentModal === 'pricecat') {
      const cat = {
        icon: val('m-icon'), name: val('m-name'),
        items: gatherRows('m-price-items', { name: 'sr-name', price: 'sr-price' })
      };
      const arr = getArr('pricecat');
      if (editIndex >= 0) arr[editIndex] = cat; else arr.push(cat);
      if (await saveFile('pricing')) { toast('✅ Kategorie uložena!', 'success'); closeModal(); renderPriceCats(); }

    } else if (currentModal === 'faq') {
      const item = { q: val('m-q'), a: val('m-a') };
      const arr = getArr('faq');
      if (editIndex >= 0) arr[editIndex] = item; else arr.push(item);
      if (await saveFile('faq')) { toast('✅ Otázka uložena!', 'success'); closeModal(); renderFaqList(); }

    } else if (currentModal === 'review') {
      const item = { name: val('m-name'), text: val('m-text'), rating: parseInt(val('m-rating')) || 5 };
      const arr = getArr('review');
      if (editIndex >= 0) arr[editIndex] = item; else arr.push(item);
      if (await saveFile('reviews')) { toast('✅ Recenze uložena!', 'success'); closeModal(); renderReviewsList(); }
    }
  } catch (e) {
    console.error(e);
    toast('❌ Chyba: ' + e.message, 'error');
  }

  btn.disabled = false;
  btn.innerHTML = '💾 Uložit';
}

// ── HELPERS ──
function val(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function setVal(id, v) { const el = document.getElementById(id); if (el) el.value = v ?? ''; }
function esc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

function toast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.className = `toast ${type}`;
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(() => t.style.display = 'none', 3500);
}

init();
document.getElementById('login-btn').addEventListener('click', login);
document.getElementById('login-pass').addEventListener('keydown', e => { if (e.key === 'Enter') login(); });

/* ============================================================
   AzikVisual Static Site - app.js
   ============================================================ */

// ─── ADMIN CREDENTIALS ───────────────────────────────────────────────
var ADMIN_USER = 'negrkarlo@gmail.com';
var ADMIN_PASS = 'azimjonuzbek';

// ─── VERSIONS CACHE ──────────────────────────────────────────────────
var _versions = null;

async function getVersions() {
  if (_versions) return _versions;
  // Works from root (index.html) and subfolders (download/, changelog/, etc.)
  const base = location.pathname.split('/').length > 3 ? '../' : '';
  const paths = [base + 'data/versions.json', 'data/versions.json', '../data/versions.json'];
  for (const p of paths) {
    try {
      const r = await fetch(p + '?_=' + Date.now());
      if (r.ok) { _versions = await r.json(); return _versions; }
    } catch (e) {}
  }
  try { return JSON.parse(localStorage.getItem('av_versions') || '[]'); } catch(e) { return []; }
}

function saveVersionsLocally(v) {
  localStorage.setItem('av_versions', JSON.stringify(v));
  _versions = v;
}

// ─── NAVBAR ──────────────────────────────────────────────────────────
var _logoClicks = 0, _logoTimer = null;

function logoClick() {
  _logoClicks++;
  const ping = document.getElementById('logoPing');
  if (ping) { ping.classList.add('show'); setTimeout(() => ping.classList.remove('show'), 600); }
  if (_logoTimer) clearTimeout(_logoTimer);
  if (_logoClicks >= 5) {
    _logoClicks = 0;
    openAdminModal();
    return;
  }
  _logoTimer = setTimeout(() => { _logoClicks = 0; }, 2000);
}

function toggleMenu() {
  const links = document.getElementById('navLinks');
  const burger = document.getElementById('burger');
  if (!links) return;
  links.classList.toggle('open');
  if (burger) burger.classList.toggle('open');
}

window.addEventListener('scroll', function () {
  const nav = document.getElementById('navbar');
  if (nav) nav.style.paddingTop = window.scrollY > 50 ? '.375rem' : '.75rem';
});

// ─── ADMIN MODAL (navbar login) ───────────────────────────────────────
function openAdminModal() {
  const m = document.getElementById('adminModal');
  if (m) m.classList.add('show');
}
function closeModal() {
  const m = document.getElementById('adminModal');
  if (m) { m.classList.remove('show'); clearLoginForm(); }
}
function closeAdminModal(e) {
  if (e && e.target === e.currentTarget) closeModal();
}
function clearLoginForm() {
  const u = document.getElementById('loginUser');
  const p = document.getElementById('loginPass');
  const er = document.getElementById('loginError');
  if (u) u.value = '';
  if (p) p.value = '';
  if (er) { er.textContent = ''; er.classList.remove('show'); }
}
function togglePwd() {
  const p = document.getElementById('loginPass');
  if (p) p.type = p.type === 'password' ? 'text' : 'password';
}

function adminLogin(e) {
  e.preventDefault();
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  const btn  = document.getElementById('loginBtn');
  const err  = document.getElementById('loginError');

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    sessionStorage.setItem('av_admin', '1');
    closeModal();
    // Go to admin from any subfolder
    const depth = location.pathname.split('/').filter(Boolean).length;
    const prefix = location.pathname.includes('github.io') ? '../'.repeat(Math.max(0, depth - 2)) : '';
    window.location.href = prefix + 'admin/';
  } else {
    err.textContent = 'Login yoki parol noto\'g\'ri';
    err.classList.add('show');
    btn.disabled = false;
    btn.textContent = 'Kirish';
  }
}

// ─── HOME PAGE ────────────────────────────────────────────────────────
async function loadVersionsForHome() {
  const versions = await getVersions();
  const latest = versions.find(v => v.latest) || versions[0];
  if (!latest) return;
  const el = document.getElementById('heroVer');
  if (el) el.textContent = latest.version;
  const total = versions.reduce((s, v) => s + (v.downloads || 0), 0);
  const el2 = document.getElementById('statDownloads');
  if (el2) el2.textContent = total.toLocaleString() + '+';
}

// ─── DOWNLOAD PAGE ────────────────────────────────────────────────────
async function loadDownloadPage() {
  const versions = await getVersions();
  const latest = versions.find(v => v.latest) || versions[0];
  const archive = versions.filter(v => !v.latest);

  if (latest) {
    document.getElementById('latestVer').textContent = latest.version;
    document.getElementById('latestDate').textContent = formatDate(latest.date);
    document.getElementById('latestSize').textContent = latest.size;
    document.getElementById('latestDl').textContent = (latest.downloads || 0).toLocaleString();
    const dlBtn = document.getElementById('latestDlBtn');
    if (dlBtn) {
      if (latest.downloadUrl && latest.downloadUrl !== '#') {
        dlBtn.href = latest.downloadUrl;
      } else {
        dlBtn.href = '#';
        dlBtn.onclick = function (e) { e.preventDefault(); alert('Fayl hozircha mavjud emas!'); };
      }
    }
  }

  if (archive.length > 0) {
    const sec = document.getElementById('archiveSection');
    const tbody = document.getElementById('archiveBody');
    if (sec) sec.style.display = '';
    if (tbody) {
      tbody.innerHTML = archive.map(v => `
        <tr>
          <td><strong style="color:#fff">${v.version}</strong></td>
          <td>${formatDate(v.date)}</td>
          <td>${v.size}</td>
          <td>${(v.downloads || 0).toLocaleString()}</td>
          <td><a href="${v.downloadUrl && v.downloadUrl !== '#' ? v.downloadUrl : '#'}" class="btn-dl-sm"
            ${(!v.downloadUrl || v.downloadUrl === '#') ? 'onclick="event.preventDefault();alert(\'Fayl hozircha mavjud emas!\')"' : ''}>
            ⬇ Yuklab olish</a></td>
        </tr>`).join('');
    }
  }
}

// ─── CHANGELOG PAGE ──────────────────────────────────────────────────
async function loadChangelogPage() {
  const versions = await getVersions();
  const tl = document.getElementById('timeline');
  if (!tl) return;
  if (!versions.length) { tl.innerHTML = '<div class="loading-state">Versiyalar topilmadi</div>'; return; }

  tl.innerHTML = versions.map((v, i) => {
    const entries = Array.isArray(v.changelog) ? v.changelog : [];
    const grouped = { new: [], fix: [], opt: [] };
    entries.forEach(e => { if (grouped[e.type]) grouped[e.type].push(e.text); });

    const sections = [
      { key: 'new', label: 'Yangi', icon: '⚡' },
      { key: 'fix', label: 'Tuzatildi', icon: '🐛' },
      { key: 'opt', label: 'Optimallashtirish', icon: '📈' }
    ].filter(s => grouped[s.key].length > 0).map(s => `
      <div class="cl-section">
        <div class="cl-type ${s.key}">${s.icon} ${s.label}</div>
        <ul class="cl-items">
          ${grouped[s.key].map(t => `<li><span class="cl-dot ${s.key}"></span>${t}</li>`).join('')}
        </ul>
      </div>`).join('');

    return `
      <div class="tl-item" style="animation:fadeUp .5s ${i * .1}s both">
        <div class="tl-dot ${v.latest ? 'latest' : 'old'}"></div>
        <div class="tl-card">
          <div class="tl-head">
            <span class="tl-ver">${v.version}</span>
            ${v.latest ? '<span class="badge purple">★ Latest</span>' : ''}
            <div class="tl-meta">
              <span>📅 ${formatDate(v.date)}</span>
              <span>⬇ ${(v.downloads || 0).toLocaleString()}</span>
            </div>
          </div>
          ${sections}
        </div>
      </div>`;
  }).join('');
}

// ─── GALLERY PAGE ─────────────────────────────────────────────────────
function loadGalleryPage() {
  const items = [
    { emoji: '🎮', title: 'FPS Boost - Before vs After', tag: 'Performance', tagClass: 'tag-perf', g: 'linear-gradient(135deg,#3b0764,#1e1b4b)' },
    { emoji: '✨', title: 'Ultra Visual Preset', tag: 'Visual', tagClass: 'tag-vis', g: 'linear-gradient(135deg,#581c87,#4a044e)' },
    { emoji: '⚡', title: 'Low-End PC - 60 FPS stable', tag: 'Performance', tagClass: 'tag-perf', g: 'linear-gradient(135deg,#1e3a5f,#312e81)' },
    { emoji: '🎨', title: 'New Lighting System', tag: 'Visual', tagClass: 'tag-vis', g: 'linear-gradient(135deg,#4a044e,#3b0764)' },
    { emoji: '🚀', title: 'Chunk Loading Speed', tag: 'Performance', tagClass: 'tag-perf', g: 'linear-gradient(135deg,#1e1b4b,#0c4a6e)' },
    { emoji: '💎', title: 'Particle Effects', tag: 'Visual', tagClass: 'tag-vis', g: 'linear-gradient(135deg,#2e1065,#4a044e)' },
    { emoji: '🧠', title: 'RAM Usage Comparison', tag: 'Optimization', tagClass: 'tag-opt', g: 'linear-gradient(135deg,#0c2461,#1a0033)' },
    { emoji: '🌈', title: 'Shader Compatibility', tag: 'Visual', tagClass: 'tag-vis', g: 'linear-gradient(135deg,#581c87,#1e1b4b)' },
    { emoji: '🌙', title: 'Night Vision Enhancement', tag: 'Visual', tagClass: 'tag-vis', g: 'linear-gradient(135deg,#1a0033,#312e81)' },
  ];
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  grid.innerHTML = items.map((item, i) => `
    <div class="gallery-item" style="animation:fadeUp .5s ${i * .07}s both">
      <div class="gallery-thumb" style="background:${item.g}">
        <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(168,85,247,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(168,85,247,.2) 1px,transparent 1px);background-size:28px 28px;opacity:.3"></div>
        <div class="gallery-overlay"></div>
        <div class="gallery-emoji">${item.emoji}</div>
        <div class="gallery-id">Screenshot ${i + 1}</div>
      </div>
      <div class="gallery-info">
        <div class="gallery-info-row">
          <h3>${item.title}</h3>
          <span class="gallery-tag ${item.tagClass}">${item.tag}</span>
        </div>
      </div>
    </div>`).join('');
}

// ─── SUPPORT PAGE ─────────────────────────────────────────────────────
function submitSupport(e) {
  e.preventDefault();
  const name    = document.getElementById('sName').value.trim();
  const email   = document.getElementById('sEmail').value.trim();
  const message = document.getElementById('sMessage').value.trim();
  if (!name || !email || !message) { showFormError('Barcha maydonlar to\'ldirilishi shart'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showFormError('Email manzil noto\'g\'ri'); return; }

  const msgs = JSON.parse(localStorage.getItem('av_messages') || '[]');
  msgs.unshift({ id: Date.now().toString(), name, email, message, reply: null, date: new Date().toISOString() });
  localStorage.setItem('av_messages', JSON.stringify(msgs));

  document.getElementById('supportForm').style.display = 'none';
  document.getElementById('supportSuccess').style.display = 'block';
}

function showFormError(msg) {
  const el = document.getElementById('formError');
  if (el) { el.innerHTML = '⚠️ ' + msg; el.style.display = 'flex'; }
}

function resetSupportForm() {
  ['sName', 'sEmail', 'sMessage'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('formError').style.display = 'none';
  document.getElementById('supportForm').style.display = 'block';
  document.getElementById('supportSuccess').style.display = 'none';
}

// ─── HELPERS ──────────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return '-';
  try { return new Date(d).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' }); }
  catch (e) { return d; }
}

const _spinStyle = document.createElement('style');
_spinStyle.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
document.head.appendChild(_spinStyle);

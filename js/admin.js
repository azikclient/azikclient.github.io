/* ============================================================
   AzikVisual Admin Panel - admin.js
   ============================================================ */

var ADMIN_USER = 'negrkarlo@gmail.com';
var ADMIN_PASS = 'azimjonuzbek';

// ─── INIT ────────────────────────────────────────────────────────────
function initAdmin() {
  // Check if already logged in
  if (sessionStorage.getItem('av_admin') === '1') {
    showPanel();
  } else {
    document.getElementById('adminGate').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
    // Set today's date in upload form
    const d = document.getElementById('upDate');
    if (d) d.value = new Date().toISOString().split('T')[0];
  }
}

// ─── GATE LOGIN ───────────────────────────────────────────────────────
function gateLogin(e) {
  e.preventDefault();
  const user = document.getElementById('gateUser').value.trim();
  const pass = document.getElementById('gatePass').value;
  const err  = document.getElementById('gateError');
  const btn  = document.getElementById('gateBtn');

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    sessionStorage.setItem('av_admin', '1');
    showPanel();
  } else {
    err.textContent = 'Login yoki parol noto\'g\'ri';
    err.classList.add('show');
    btn.textContent = 'Kirish';
    btn.disabled = false;
  }
}

function toggleGatePwd() {
  const p = document.getElementById('gatePass');
  if (p) p.type = p.type === 'password' ? 'text' : 'password';
}

function showPanel() {
  document.getElementById('adminGate').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'block';
  const d = document.getElementById('upDate');
  if (d) d.value = new Date().toISOString().split('T')[0];
  addEntry(); // add first changelog entry
  showTab('dashboard');
  loadDashboard();
}

function adminLogout() {
  sessionStorage.removeItem('av_admin');
  window.location.href = '../';
}

// ─── TABS ─────────────────────────────────────────────────────────────
function showTab(name) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));
  const tab = document.getElementById('tab-' + name);
  if (tab) tab.classList.add('active');
  // Highlight sidebar button
  document.querySelectorAll('.sidebar-item').forEach(b => {
    if (b.getAttribute('onclick') && b.getAttribute('onclick').includes("'" + name + "'")) b.classList.add('active');
  });
  // Load data for tab
  if (name === 'dashboard') loadDashboard();
  if (name === 'versions') loadVersionsTab();
  if (name === 'support') loadSupportTab();
  if (name === 'analytics') loadAnalytics();
  if (name === 'settings') loadSettings();
  if (name === 'premium') loadPremium();
}

// ─── VERSIONS (localStorage) ──────────────────────────────────────────
function getLocalVersions() {
  try { return JSON.parse(localStorage.getItem('av_versions') || '[]'); } catch (e) { return []; }
}
function setLocalVersions(v) {
  localStorage.setItem('av_versions', JSON.stringify(v));
}

// ─── DASHBOARD ────────────────────────────────────────────────────────
function loadDashboard() {
  const versions = getLocalVersions();
  const msgs = getMessages();
  const totalDl = versions.reduce((s, v) => s + (v.downloads || 0), 0);
  const unreplied = msgs.filter(m => !m.reply).length;
  const latest = versions.find(v => v.latest) || versions[0];

  // Badge
  const badge = document.getElementById('msgBadge');
  if (badge) badge.textContent = unreplied > 0 ? unreplied : '';

  const sc = document.getElementById('dashStats');
  if (sc) sc.innerHTML = [
    { icon: '⬇️', label: 'Jami Yuklashlar', val: totalDl.toLocaleString(), cls: 'purple' },
    { icon: '📦', label: 'Versiyalar',        val: versions.length,           cls: 'blue' },
    { icon: '💬', label: 'Support Xabarlar', val: msgs.length,               cls: 'green' },
    { icon: '⚠️', label: 'Javobsiz Xabarlar',val: unreplied,                 cls: 'orange' },
  ].map(c => `
    <div class="stat-card ${c.cls}">
      <div class="stat-card-icon">${c.icon}</div>
      <div class="stat-card-val">${c.val}</div>
      <div class="stat-card-label">${c.label}</div>
    </div>`).join('');

  // Latest version info
  const cc = document.getElementById('chartCard');
  const cb = document.getElementById('chartBars');
  if (cc && versions.length > 0) {
    cc.style.display = '';
    const max = Math.max(...versions.map(v => v.downloads || 0), 1);
    cb.innerHTML = versions.map(v => `
      <div class="chart-row">
        <span class="chart-label">${v.version}</span>
        <div class="chart-bar-wrap"><div class="chart-bar" style="width:${((v.downloads||0)/max*100).toFixed(0)}%"></div></div>
        <span class="chart-count">${(v.downloads||0).toLocaleString()}</span>
      </div>`).join('');
  }
}

// ─── UPLOAD / PUBLISH ─────────────────────────────────────────────────
var _isLatest = true;

function toggleLatest() {
  _isLatest = !_isLatest;
  const t = document.getElementById('latestToggle');
  const l = document.getElementById('latestLabel');
  if (t) t.setAttribute('data-on', _isLatest ? 'true' : 'false');
  if (l) l.textContent = _isLatest ? 'Ha' : 'Yo\'q';
}

var _clEntries = [{ type: 'new', text: '' }];

function addEntry() {
  _clEntries.push({ type: 'new', text: '' });
  renderEntries();
}

function removeEntry(i) {
  if (_clEntries.length <= 1) return;
  _clEntries.splice(i, 1);
  renderEntries();
}

function renderEntries() {
  const el = document.getElementById('clEntries');
  if (!el) return;
  el.innerHTML = _clEntries.map((entry, i) => `
    <div class="cl-entry">
      <select class="cl-select" onchange="updateEntry(${i},'type',this.value)">
        <option value="new" ${entry.type==='new'?'selected':''}>⚡ Yangi</option>
        <option value="fix" ${entry.type==='fix'?'selected':''}>🐛 Tuzatildi</option>
        <option value="opt" ${entry.type==='opt'?'selected':''}>📈 Optimizatsiya</option>
      </select>
      <input class="cl-input" type="text" value="${escHtml(entry.text)}" placeholder="O'zgarishni yozing..." onchange="updateEntry(${i},'text',this.value)" oninput="updateEntry(${i},'text',this.value)"/>
      <button type="button" class="cl-remove" onclick="removeEntry(${i})" title="O'chirish">✕</button>
    </div>`).join('');
}

function updateEntry(i, field, val) {
  if (_clEntries[i]) _clEntries[i][field] = val;
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function publishVersion(e) {
  e.preventDefault();
  const ver   = document.getElementById('upVersion').value.trim();
  const size  = document.getElementById('upSize').value.trim() || '0 MB';
  const date  = document.getElementById('upDate').value || new Date().toISOString().split('T')[0];
  const url   = document.getElementById('upUrl').value.trim() || '#';
  const sucEl = document.getElementById('uploadSuccess');
  const errEl = document.getElementById('uploadError');
  sucEl.style.display = 'none';
  errEl.style.display = 'none';

  if (!ver) { errEl.textContent = '❌ Versiya nomi kiritilishi shart'; errEl.style.display = 'flex'; return; }

  const validEntries = _clEntries.filter(e => e.text.trim());
  if (!validEntries.length) { errEl.textContent = '❌ Kamida bitta changelog yozing'; errEl.style.display = 'flex'; return; }

  const versions = getLocalVersions();
  if (_isLatest) versions.forEach(v => v.latest = false);

  versions.unshift({
    id: Date.now().toString(),
    version: ver,
    date: date,
    size: size,
    downloads: 0,
    latest: _isLatest,
    downloadUrl: url,
    changelog: validEntries.map(e => ({ type: e.type, text: e.text.trim() }))
  });

  setLocalVersions(versions);

  sucEl.style.display = 'flex';
  // Reset form
  document.getElementById('upVersion').value = '';
  document.getElementById('upSize').value = '';
  document.getElementById('upUrl').value = '';
  _isLatest = true;
  _clEntries = [{ type: 'new', text: '' }];
  renderEntries();
  toggleLatest(); toggleLatest(); // reset toggle UI
}

// ─── VERSIONS TAB ─────────────────────────────────────────────────────
function loadVersionsTab() {
  const versions = getLocalVersions();
  const el = document.getElementById('versionsList');
  if (!el) return;
  if (!versions.length) { el.innerHTML = '<div style="text-align:center;padding:3rem;color:#6b7280">Hech qanday versiya topilmadi</div>'; return; }

  el.innerHTML = versions.map((v, i) => `
    <div class="ver-row ${v.latest ? 'latest' : ''}">
      <div class="ver-row-info">
        <div class="ver-row-icon">📦</div>
        <div>
          <div class="ver-row-name">${v.version} ${v.latest ? '<span class="badge purple" style="font-size:.7rem;margin-left:.375rem">★ Latest</span>' : ''}</div>
          <div class="ver-row-meta">
            <span>📅 ${formatDate(v.date)}</span>
            <span>💾 ${v.size}</span>
            <span>⬇ ${(v.downloads||0).toLocaleString()}</span>
          </div>
        </div>
      </div>
      <div class="ver-row-actions">
        ${!v.latest ? `<button class="btn-icon star" onclick="setLatest('${v.id}')">★ Latest</button>` : ''}
        <button class="btn-icon del" onclick="deleteVersion('${v.id}')">🗑 O'chirish</button>
      </div>
    </div>`).join('');
}

function setLatest(id) {
  const versions = getLocalVersions();
  versions.forEach(v => v.latest = v.id === id);
  setLocalVersions(versions);
  loadVersionsTab();
  showToast('✅ So\'nggi versiya o\'zgartirildi');
}

function deleteVersion(id) {
  if (!confirm('Bu versiyani o\'chirishni tasdiqlaysizmi?')) return;
  const versions = getLocalVersions().filter(v => v.id !== id);
  setLocalVersions(versions);
  loadVersionsTab();
  showToast('✅ Versiya o\'chirildi');
}

// ─── SUPPORT TAB ──────────────────────────────────────────────────────
function getMessages() {
  try { return JSON.parse(localStorage.getItem('av_messages') || '[]'); } catch (e) { return []; }
}
function setMessages(m) { localStorage.setItem('av_messages', JSON.stringify(m)); }

function loadSupportTab() {
  const msgs = getMessages();
  const unreplied = msgs.filter(m => !m.reply).length;
  const meta = document.getElementById('supportMeta');
  if (meta) meta.textContent = (unreplied > 0 ? unreplied + ' ta javobsiz • ' : '') + 'Jami ' + msgs.length + ' ta xabar';

  const badge = document.getElementById('msgBadge');
  if (badge) badge.textContent = unreplied > 0 ? unreplied : '';

  const el = document.getElementById('messagesList');
  if (!el) return;
  if (!msgs.length) { el.innerHTML = '<div style="text-align:center;padding:3rem;color:#6b7280">Hech qanday xabar topilmadi</div>'; return; }

  el.innerHTML = msgs.map((m, i) => `
    <div class="msg-card ${!m.reply ? 'unread' : ''}" id="msg-${m.id}">
      <div class="msg-head" onclick="toggleMsg('${m.id}')">
        <div class="msg-head-left">
          <div class="msg-icon ${!m.reply ? 'unread' : 'read'}">${!m.reply ? '💬' : '✅'}</div>
          <div>
            <div class="msg-name">${escHtml(m.name)} <span class="msg-status ${!m.reply ? 'new' : 'replied'}">${!m.reply ? 'Yangi' : 'Javob berildi'}</span></div>
            <div class="msg-meta"><span>✉️ ${escHtml(m.email)}</span><span>•</span><span>${formatDate(m.date)}</span></div>
          </div>
        </div>
        <span style="color:#6b7280">▼</span>
      </div>
      <div class="msg-body" id="msgbody-${m.id}">
        <p style="color:#9ca3af;font-size:.78rem;margin-bottom:.5rem">Xabar:</p>
        <div class="msg-text">${escHtml(m.message)}</div>
        ${m.reply ? `<p style="color:#9ca3af;font-size:.78rem;margin-bottom:.5rem">Sizning javobingiz:</p><div class="msg-reply-box">${escHtml(m.reply)}</div>` : ''}
        <p style="color:#9ca3af;font-size:.78rem;margin-bottom:.5rem">${m.reply ? 'Javobni yangilash:' : 'Javob yozish:'}</p>
        <div class="reply-form">
          <textarea id="reply-${m.id}" rows="3" placeholder="Javobingizni yozing...">${m.reply ? escHtml(m.reply) : ''}</textarea>
          <button class="btn-reply" onclick="sendReply('${m.id}')">📨 Yuborish</button>
        </div>
      </div>
    </div>`).join('');
}

function toggleMsg(id) {
  const body = document.getElementById('msgbody-' + id);
  if (body) body.classList.toggle('open');
}

function sendReply(id) {
  const textarea = document.getElementById('reply-' + id);
  if (!textarea || !textarea.value.trim()) return;
  const msgs = getMessages();
  const msg = msgs.find(m => m.id === id);
  if (!msg) return;
  msg.reply = textarea.value.trim();
  msg.repliedAt = new Date().toISOString();
  setMessages(msgs);
  loadSupportTab();
  showToast('✅ Javob saqlandi');
}

// ─── PREMIUM TAB ──────────────────────────────────────────────────────
function loadPremium() {
  const enabled = localStorage.getItem('av_premium') === 'true';
  const t = document.getElementById('premToggle');
  const s = document.getElementById('premStatus');
  if (t) t.setAttribute('data-on', enabled ? 'true' : 'false');
  if (s) s.textContent = enabled ? '✅ Premium faol - Foydalanuvchilar premium takliflarini ko\'radi' : '🔒 Premium o\'chiq - Foydalanuvchilar "Soon..." ko\'radi';
}

function togglePremium() {
  const cur = localStorage.getItem('av_premium') === 'true';
  localStorage.setItem('av_premium', (!cur).toString());
  loadPremium();
  showToast((!cur) ? '✅ Premium yoqildi' : '✅ Premium o\'chirildi');
}

// ─── ANALYTICS TAB ────────────────────────────────────────────────────
function loadAnalytics() {
  const versions = getLocalVersions();
  const msgs = getMessages();
  const totalDl = versions.reduce((s, v) => s + (v.downloads || 0), 0);

  const sc = document.getElementById('analyticsStats');
  if (sc) sc.innerHTML = [
    { icon: '⬇️', label: 'Jami Yuklashlar', val: totalDl.toLocaleString(), cls: 'purple' },
    { icon: '📦', label: 'Versiyalar', val: versions.length, cls: 'blue' },
    { icon: '💬', label: 'Support Xabarlar', val: msgs.length, cls: 'green' },
  ].map(c => `
    <div class="stat-card ${c.cls}">
      <div class="stat-card-icon">${c.icon}</div>
      <div class="stat-card-val">${c.val}</div>
      <div class="stat-card-label">${c.label}</div>
    </div>`).join('');

  const cb = document.getElementById('analyticsChartBars');
  if (cb && versions.length > 0) {
    const max = Math.max(...versions.map(v => v.downloads || 0), 1);
    cb.innerHTML = versions.map(v => `
      <div class="chart-row">
        <span class="chart-label">${v.version}</span>
        <div class="chart-bar-wrap"><div class="chart-bar" style="width:${((v.downloads||0)/max*100).toFixed(0)}%"></div></div>
        <span class="chart-count">${(v.downloads||0).toLocaleString()}</span>
      </div>`).join('');
  }
}

// ─── SETTINGS TAB ─────────────────────────────────────────────────────
function loadSettings() {
  const user = document.getElementById('ghUser');
  const repo = document.getElementById('ghRepo');
  const tok  = document.getElementById('ghToken');
  if (user) user.value = localStorage.getItem('gh_user') || '';
  if (repo) repo.value = localStorage.getItem('gh_repo') || '';
  if (tok)  tok.value  = localStorage.getItem('gh_token') || '';
}

function saveGithubSettings() {
  const user  = document.getElementById('ghUser').value.trim();
  const repo  = document.getElementById('ghRepo').value.trim();
  const token = document.getElementById('ghToken').value.trim();
  localStorage.setItem('gh_user', user);
  localStorage.setItem('gh_repo', repo);
  localStorage.setItem('gh_token', token);
  const t = document.getElementById('ghToast');
  if (t) { t.textContent = '✅ Saqlandi'; t.className = 'settings-toast show ok'; setTimeout(() => t.className = 'settings-toast', 3000); }
}

function toggleTokenVis() {
  const t = document.getElementById('ghToken');
  if (t) t.type = t.type === 'password' ? 'text' : 'password';
}

function changePassword() {
  const cur  = document.getElementById('curPwd').value;
  const nw   = document.getElementById('newPwd').value;
  const conf = document.getElementById('confPwd').value;
  const t    = document.getElementById('pwdToast');

  function toast(msg, ok) {
    if (t) { t.textContent = msg; t.className = 'settings-toast show ' + (ok ? 'ok' : 'err'); setTimeout(() => t.className = 'settings-toast', 3500); }
  }

  const currentUser = localStorage.getItem('av_cur_user') || ADMIN_USER;
  const currentPass = localStorage.getItem('av_cur_pass') || ADMIN_PASS;

  if (cur !== currentPass) { toast('❌ Joriy parol noto\'g\'ri', false); return; }
  if (nw.length < 6) { toast('❌ Yangi parol kamida 6 ta belgi bo\'lishi kerak', false); return; }
  if (nw !== conf) { toast('❌ Yangi parollar bir xil emas', false); return; }

  localStorage.setItem('av_cur_pass', nw);
  ADMIN_PASS = nw;
  ['curPwd', 'newPwd', 'confPwd'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  toast('✅ Parol muvaffaqiyatli o\'zgartirildi', true);
}

// ─── TOAST ────────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = 'position:fixed;top:1.5rem;right:1.5rem;z-index:999;padding:.75rem 1.25rem;background:rgba(74,222,128,.15);border:1px solid rgba(74,222,128,.3);color:#86efac;border-radius:.75rem;font-size:.875rem;box-shadow:0 4px 20px rgba(0,0,0,.3)';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ─── HELPERS ──────────────────────────────────────────────────────────
function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(d) {
  if (!d) return '-';
  try { return new Date(d).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' }); }
  catch (e) { return d; }
}

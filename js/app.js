/* ============================================================
   AzikVisual Static Site - app.js
   ============================================================ */

// ─── ADMIN CREDENTIALS (SHA-256 hash, asl ma'lumot ko'rinmaydi) ──────
var _AU = '7b6bbb829d25548c3956295469106c8f90fdc35c6173db6ee7e0081a91c36e90';
var _AP = '94547483b738bb3dd768e8c4756d199d9b662f52e82e093eb15df538e35c6e19';

// ─── VERSIONS CACHE ──────────────────────────────────────────────────
var _versions = null;

async function getVersions(){
  if(_versions) return _versions;
  try{
    const r = await fetch('data/versions.json?_='+Date.now());
    _versions = await r.json();
    return _versions;
  }catch(e){
    return getSavedVersions();
  }
}

function getSavedVersions(){
  try{ return JSON.parse(localStorage.getItem('av_versions')||'[]'); }
  catch(e){ return []; }
}

function saveVersionsLocally(v){
  localStorage.setItem('av_versions', JSON.stringify(v));
  _versions = v;
}

// ─── NAVBAR ──────────────────────────────────────────────────────────
var _logoClicks = 0, _logoTimer = null;

function logoClick(){
  _logoClicks++;
  const ping = document.getElementById('logoPing');
  if(ping){ ping.classList.add('show'); setTimeout(()=>ping.classList.remove('show'),600); }

  if(_logoTimer) clearTimeout(_logoTimer);
  if(_logoClicks >= 5){
    _logoClicks = 0;
    openAdminModal();
    return;
  }
  _logoTimer = setTimeout(()=>{ _logoClicks=0; }, 2000);
}

function toggleMenu(){
  const links = document.getElementById('navLinks');
  const burger = document.getElementById('burger');
  if(!links) return;
  links.classList.toggle('open');
  burger && burger.classList.toggle('open');
}

// Navbar scroll effect
window.addEventListener('scroll',function(){
  const nav = document.getElementById('navbar');
  if(nav) nav.style.paddingTop = window.scrollY > 50 ? '.375rem' : '.75rem';
});

// ─── ADMIN MODAL ─────────────────────────────────────────────────────
function openAdminModal(){
  const m = document.getElementById('adminModal');
  if(m) m.classList.add('show');
}
function closeModal(){
  const m = document.getElementById('adminModal');
  if(m){ m.classList.remove('show'); clearLoginForm(); }
}
function closeAdminModal(e){
  if(e && e.target === e.currentTarget) closeModal();
}
function clearLoginForm(){
  const u=document.getElementById('loginUser'), p=document.getElementById('loginPass'), er=document.getElementById('loginError');
  if(u)u.value=''; if(p)p.value=''; if(er){er.textContent='';er.classList.remove('show');}
}
function togglePwd(){
  const p=document.getElementById('loginPass');
  if(p) p.type = p.type==='password'?'text':'password';
}

async function adminLogin(e){
  e.preventDefault();
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  const btn  = document.getElementById('loginBtn');
  const err  = document.getElementById('loginError');

  btn.textContent = 'Kirilmoqda...';
  btn.disabled = true;

  await new Promise(r=>setTimeout(r,600)); // slight delay for UX

  // Check credentials: username must be "azikadmin", password SHA1 checked
  const passHash = await sha1(pass);
  const savedHash = localStorage.getItem('av_admin_hash') || ADMIN_HASH;
  const savedUser = localStorage.getItem('av_admin_user') || 'azikadmin';

  if(user === savedUser && passHash === savedHash){
    sessionStorage.setItem('av_admin', '1');
    closeModal();
    window.location.href = 'admin.html';
  } else {
    err.textContent = 'Username yoki parol noto\'g\'ri';
    err.classList.add('show');
  }
  btn.textContent = 'Kirish';
  btn.disabled = false;
}

// Simple SHA1 implementation for client-side password check
async function sha1(str){
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

// ─── HOME PAGE ───────────────────────────────────────────────────────
async function loadVersionsForHome(){
  const versions = await getVersions();
  const latest = versions.find(v=>v.latest) || versions[0];
  if(!latest) return;
  const el = document.getElementById('heroVer');
  if(el) el.textContent = latest.version;
  const total = versions.reduce((s,v)=>s+(v.downloads||0),0);
  const el2 = document.getElementById('statDownloads');
  if(el2) el2.textContent = total.toLocaleString()+'+';
}

// ─── DOWNLOAD PAGE ───────────────────────────────────────────────────
async function loadDownloadPage(){
  const versions = await getVersions();
  const latest = versions.find(v=>v.latest) || versions[0];
  const archive = versions.filter(v=>!v.latest);

  if(latest){
    document.getElementById('latestVer').textContent = latest.version;
    document.getElementById('latestDate').textContent = formatDate(latest.date);
    document.getElementById('latestSize').textContent = latest.size;
    document.getElementById('latestDl').textContent = latest.downloads.toLocaleString();
    document.getElementById('latestDlBtn').href = latest.downloadUrl || '#';
    document.getElementById('latestDlBtn').onclick = latest.downloadUrl && latest.downloadUrl !== '#' ? null : function(e){
      e.preventDefault();
      alert('Fayl hozircha mavjud emas. Tez orada qo\'shiladi!');
    };
  }

  if(archive.length > 0){
    const sec = document.getElementById('archiveSection');
    const tbody = document.getElementById('archiveBody');
    if(sec) sec.style.display = '';
    if(tbody){
      tbody.innerHTML = archive.map(v=>`
        <tr>
          <td><strong style="color:#fff">${v.version}</strong></td>
          <td>${formatDate(v.date)}</td>
          <td>${v.size}</td>
          <td>${v.downloads.toLocaleString()}</td>
          <td><a href="${v.downloadUrl||'#'}" class="btn-dl-sm" ${!v.downloadUrl||v.downloadUrl==='#'?'onclick="event.preventDefault();alert(\'Fayl hozircha mavjud emas!\')"':''}>⬇ Yuklab olish</a></td>
        </tr>
      `).join('');
    }
  }
}

// ─── CHANGELOG PAGE ──────────────────────────────────────────────────
async function loadChangelogPage(){
  const versions = await getVersions();
  const tl = document.getElementById('timeline');
  if(!tl) return;
  if(!versions.length){ tl.innerHTML = '<div class="loading-state">Versiyalar topilmadi</div>'; return; }

  tl.innerHTML = versions.map((v,i)=>{
    const entries = Array.isArray(v.changelog) ? v.changelog : [];
    const grouped = {new:[],fix:[],opt:[]};
    entries.forEach(e=>{ if(grouped[e.type]) grouped[e.type].push(e.text); });

    const sections = [
      {key:'new',label:'Yangi',icon:'⚡'},
      {key:'fix',label:'Tuzatildi',icon:'🐛'},
      {key:'opt',label:'Optimallashtirish',icon:'📈'}
    ].filter(s=>grouped[s.key].length>0).map(s=>`
      <div class="cl-section">
        <div class="cl-type ${s.key}">${s.icon} ${s.label}</div>
        <ul class="cl-items">
          ${grouped[s.key].map(t=>`<li><span class="cl-dot ${s.key}"></span>${t}</li>`).join('')}
        </ul>
      </div>
    `).join('');

    return `
      <div class="tl-item" style="animation:fadeUp .5s ${i*.1}s both">
        <div class="tl-dot ${v.latest?'latest':'old'}"></div>
        <div class="tl-card">
          <div class="tl-head">
            <span class="tl-ver">${v.version}</span>
            ${v.latest?'<span class="badge purple">★ Latest</span>':''}
            <div class="tl-meta">
              <span>📅 ${formatDate(v.date)}</span>
              <span>⬇ ${v.downloads.toLocaleString()}</span>
            </div>
          </div>
          ${sections}
        </div>
      </div>`;
  }).join('');
}

// ─── GALLERY PAGE ─────────────────────────────────────────────────────
function loadGalleryPage(){
  const items = [
    {emoji:'🎮',title:'FPS Boost - Before vs After',tag:'Performance',tagClass:'tag-perf',g:'linear-gradient(135deg,#3b0764,#1e1b4b)'},
    {emoji:'✨',title:'Ultra Visual Preset',tag:'Visual',tagClass:'tag-vis',g:'linear-gradient(135deg,#581c87,#4a044e)'},
    {emoji:'⚡',title:'Low-End PC - 60 FPS stable',tag:'Performance',tagClass:'tag-perf',g:'linear-gradient(135deg,#1e3a5f,#312e81)'},
    {emoji:'🎨',title:'New Lighting System',tag:'Visual',tagClass:'tag-vis',g:'linear-gradient(135deg,#4a044e,#3b0764)'},
    {emoji:'🚀',title:'Chunk Loading Speed',tag:'Performance',tagClass:'tag-perf',g:'linear-gradient(135deg,#1e1b4b,#0c4a6e)'},
    {emoji:'💎',title:'Particle Effects',tag:'Visual',tagClass:'tag-vis',g:'linear-gradient(135deg,#2e1065,#4a044e)'},
    {emoji:'🧠',title:'RAM Usage Comparison',tag:'Optimization',tagClass:'tag-opt',g:'linear-gradient(135deg,#0c2461,#1a0033)'},
    {emoji:'🌈',title:'Shader Compatibility',tag:'Visual',tagClass:'tag-vis',g:'linear-gradient(135deg,#581c87,#1e1b4b)'},
    {emoji:'🌙',title:'Night Vision Enhancement',tag:'Visual',tagClass:'tag-vis',g:'linear-gradient(135deg,#1a0033,#312e81)'},
  ];
  const grid = document.getElementById('galleryGrid');
  if(!grid) return;
  grid.innerHTML = items.map((item,i)=>`
    <div class="gallery-item" style="animation:fadeUp .5s ${i*.07}s both">
      <div class="gallery-thumb" style="background:${item.g}">
        <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(168,85,247,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(168,85,247,.2) 1px,transparent 1px);background-size:28px 28px;opacity:.3"></div>
        <div class="gallery-overlay"></div>
        <div class="gallery-emoji">${item.emoji}</div>
        <div class="gallery-id">Screenshot ${i+1}</div>
      </div>
      <div class="gallery-info">
        <div class="gallery-info-row">
          <h3>${item.title}</h3>
          <span class="gallery-tag ${item.tagClass}">${item.tag}</span>
        </div>
      </div>
    </div>
  `).join('');
}

// ─── SUPPORT PAGE ─────────────────────────────────────────────────────
async function submitSupport(e){
  e.preventDefault();
  const name    = document.getElementById('sName').value.trim();
  const email   = document.getElementById('sEmail').value.trim();
  const message = document.getElementById('sMessage').value.trim();
  const btn     = document.getElementById('submitBtn');
  const errEl   = document.getElementById('formError');

  if(!name||!email||!message){ showFormError('Barcha maydonlar to\'ldirilishi shart'); return; }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ showFormError('Email manzil noto\'g\'ri'); return; }

  btn.innerHTML = '<span style="display:inline-block;width:18px;height:18px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;margin-right:.5rem"></span> Yuborilmoqda...';
  btn.disabled = true;

  await new Promise(r=>setTimeout(r,800));

  // Save to localStorage
  const msgs = JSON.parse(localStorage.getItem('av_messages')||'[]');
  msgs.unshift({ id: Date.now().toString(), name, email, message, reply: null, date: new Date().toISOString() });
  localStorage.setItem('av_messages', JSON.stringify(msgs));

  document.getElementById('supportForm').style.display = 'none';
  document.getElementById('supportSuccess').style.display = 'block';
}

function showFormError(msg){
  const el = document.getElementById('formError');
  if(el){ el.textContent = msg; el.style.display='flex'; el.style.alignItems='center'; el.style.gap='.5rem'; el.innerHTML='⚠️ '+msg; }
}

function resetSupportForm(){
  document.getElementById('sName').value='';
  document.getElementById('sEmail').value='';
  document.getElementById('sMessage').value='';
  document.getElementById('formError').style.display='none';
  document.getElementById('supportForm').style.display='block';
  document.getElementById('supportSuccess').style.display='none';
  const btn = document.getElementById('submitBtn');
  btn.innerHTML='<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Xabar yuborish';
  btn.disabled=false;
}

// ─── HELPERS ──────────────────────────────────────────────────────────
function formatDate(d){
  if(!d) return '-';
  return new Date(d).toLocaleDateString('uz-UZ',{year:'numeric',month:'long',day:'numeric'});
}

// CSS spin animation
const style = document.createElement('style');
style.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
document.head.appendChild(style);

// ─── ADMIN AUTH (SHA-256 hash - asl login/parol ko'rinmaydi) ─────────
// Quyidagi qatorlarda faqat hash saqlangan, asl ma'lumot yo'q.
async function _h(s){
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');
}

async function gateLogin(e){
  e.preventDefault();
  const user = document.getElementById('gateUser').value.trim();
  const pass = document.getElementById('gatePass').value;
  const err  = document.getElementById('gateError');
  const btn  = document.getElementById('gateBtn');

  btn.textContent = 'Kirilmoqda...';
  btn.disabled = true;

  const uh = await _h(user);
  const ph = await _h(pass);

  // Faqat hashlar taqqoslanadi - asl qiymatlar hech qaerda yo'q
  if(uh === _AU && ph === _AP){
    sessionStorage.setItem('av_admin','1');
    document.getElementById('adminGate').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    initAdminPanel();
  } else {
    err.textContent = 'Email yoki parol noto\'g\'ri';
    err.classList.add('show');
    btn.textContent = 'Kirish';
    btn.disabled = false;
  }
}

function toggleGatePwd(){
  const p = document.getElementById('gatePass');
  if(p) p.type = p.type === 'password' ? 'text' : 'password';
}

function adminLogout(){
  sessionStorage.removeItem('av_admin');
  window.location.href = 'index.html';
}

function initAdmin(){
  // agar oldin login qilingan bo'lsa
  if(sessionStorage.getItem('av_admin') === '1'){
    document.getElementById('adminGate').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    initAdminPanel();
  }
}

// ─── ADMIN PANEL INIT ─────────────────────────────────────────────────
function initAdminPanel(){
  loadDashboard();
  initUploadForm();
  loadVersionsTab();
  loadSupportTab();
  loadPremiumTab();
  loadAnalytics();
}

function showTab(name){
  document.querySelectorAll('.admin-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach(b=>b.classList.remove('active'));
  const tab = document.getElementById('tab-'+name);
  if(tab) tab.classList.add('active');
  // active sidebar item
  const items = document.querySelectorAll('.sidebar-item');
  items.forEach(function(btn){
    if(btn.getAttribute('onclick') && btn.getAttribute('onclick').includes("'"+name+"'")){
      btn.classList.add('active');
    }
  });
}

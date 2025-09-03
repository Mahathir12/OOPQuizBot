
/* app.js — auth + roles + header/menu + fallbacks + announcements/leaderboard */
(function(){
  const NAMESPACE = 'oop';
  const KEYS = { users:`${NAMESPACE}.users`, session:`${NAMESPACE}.session`, announcements:`${NAMESPACE}.announcements` };
  const ROLES = ['Student','Teacher','Admin'];
  function nowISO(){ return new Date().toISOString(); }
  async function sha256Hex(text){
    if (crypto && crypto.subtle){
      const enc = new TextEncoder().encode(text);
      const hash = await crypto.subtle.digest('SHA-256', enc);
      return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');
    } else {
      let h=0; for(let i=0;i<text.length;i++){ h=(h<<5)-h+text.charCodeAt(i); h|=0; } return "x"+(h>>>0).toString(16);
    }
  }
  function load(k,f){ try{ const r=localStorage.getItem(k); return r?JSON.parse(r):(f??null);}catch(e){return (f??null);} }
  function save(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
  function normalizeEmail(e){ return (e||'').trim().toLowerCase(); }
  function getUsers(){ return load(KEYS.users, []); }
  function setUsers(l){ save(KEYS.users, l); }
  function findUser(email){ const em=normalizeEmail(email); return getUsers().find(u=>normalizeEmail(u.email)===em)||null; }
  async function ensureSeedUsers(){
    if (getUsers().length) return;
    const def = [
      {name:'Admin', email:'admin@oopquizbot.local', role:'Admin', password:'Admin123!'},
      {name:'Teacher', email:'teacher@oopquizbot.local', role:'Teacher', password:'Teacher123!'},
      {name:'Student', email:'student@oopquizbot.local', role:'Student', password:'Student123!'}
    ];
    const seeded=[]; for(const d of def){ const hash = await sha256Hex(d.password); seeded.push({name:d.name,email:d.email,role:d.role,passHash:hash,avatar:null,scores:[]}); }
    setUsers(seeded);
  }
  async function register({name,email,password,role}){
    if (!name||!email||!password) throw new Error('All fields required');
    if (!ROLES.includes(role)) role='Student';
    if (findUser(email)) throw new Error('Account already exists');
    const passHash = await sha256Hex(password);
    const users = getUsers(); users.push({ name, email:normalizeEmail(email), role, passHash, avatar:null, scores:[] }); setUsers(users);
    setSession({ email: normalizeEmail(email) }); return true;
  }
  function getSession(){ return load(KEYS.session, null); }
  function setSession(s){ save(KEYS.session, s); }
  function clearSession(){ localStorage.removeItem(KEYS.session); }
  function getCurrentUser(){ const s=getSession(); return s?findUser(s.email):null; }
  async function login({email,password}){
    const u=findUser(email); if(!u) throw new Error('No account found');
    const hash=await sha256Hex(password); if(hash!==u.passHash) throw new Error('Incorrect password');
    setSession({email:normalizeEmail(email)}); return true;
  }
  async function changePassword(oldPwd,newPwd){
    const u=getCurrentUser(); if(!u) throw new Error('Not logged in');
    const oldHash=await sha256Hex(oldPwd); if(oldHash!==u.passHash) throw new Error('Old password incorrect');
    u.passHash=await sha256Hex(newPwd); setUsers(getUsers().map(x=>normalizeEmail(x.email)===normalizeEmail(u.email)?u:x)); return true;
  }
  function updateProfile({name,role,avatarDataUrl}){
    const me=getCurrentUser(); if(!me) throw new Error('Not logged in');
    if(name) me.name=name; if(role && me.role==='Admin') me.role=role; if(typeof avatarDataUrl==='string') me.avatar=avatarDataUrl;
    setUsers(getUsers().map(x=>normalizeEmail(x.email)===normalizeEmail(me.email)?me:x)); return true;
  }
  function getAnnouncements(){ return load(KEYS.announcements, []); }
  function postAnnouncement(text){
    const me=getCurrentUser(); if(!me) throw new Error('Login required');
    if(!(me.role==='Teacher'||me.role==='Admin')) throw new Error('Only Teacher/Admin can announce');
    const list=getAnnouncements(); const item={ id:`a_${Date.now()}`, text, by:me.name||me.email, role:me.role, at:nowISO() }; list.unshift(item); save(KEYS.announcements,list); return item;
  }
  function addScore(points, meta){
    const me=getCurrentUser(); if(!me) return false;
    me.scores=me.scores||[]; me.scores.push({points:Number(points)||0,at:nowISO(),...(meta||{})});
    setUsers(getUsers().map(u=>normalizeEmail(u.email)===normalizeEmail(me.email)?me:u)); return true;
  }
  function getLeaderboard(){
    return getUsers().map(u=>({name:u.name||u.email,email:u.email,total:(u.scores||[]).reduce((a,b)=>a+(b.points||0),0)})).sort((a,b)=>b.total-a.total);
  }
  function initHeader(){
    const moreBtn=document.getElementById('moreBtn'); const menu=document.getElementById('moreMenu');
    if(moreBtn && !moreBtn.dataset.wired){ moreBtn.dataset.wired='1';
      const st=document.createElement('style'); st.textContent=`
        #moreBtn{position:relative}
        #moreBtn::after{content:"";position:absolute;inset:-10px;}
        .more-menu{position:absolute;top:calc(100% + 10px);right:0;display:none;min-width:220px;background:#fff;color:#111;border-radius:14px;box-shadow:0 12px 30px rgba(0,0,0,.18);padding:8px;z-index:9999;}
        .more-menu.show{display:block}
        .more-menu a,.more-menu button.linklike{display:block;width:100%;text-align:left;padding:10px 12px;border-radius:10px;text-decoration:none;color:#111;border:0;background:none;cursor:pointer}
        .more-menu a:hover,.more-menu button.linklike:hover{background:#f3f4f6}
      `; document.head.appendChild(st);
      moreBtn.addEventListener('click', (e)=>{ e.stopPropagation(); const show=!menu.classList.contains('show'); menu.classList.toggle('show',show); moreBtn.setAttribute('aria-expanded',String(show)); });
      document.addEventListener('click', (e)=>{ if(!menu.contains(e.target) && e.target!==moreBtn){ menu.classList.remove('show'); moreBtn.setAttribute('aria-expanded','false'); }});
    }
    const loginBtn=document.getElementById('loginBtn'); const logoutBtn=document.getElementById('logoutBtn'); const me=getCurrentUser();
    if(me){ if(loginBtn) loginBtn.style.display='none'; if(logoutBtn) logoutBtn.style.display='block'; } else { if(loginBtn) loginBtn.style.display='inline-flex'; if(logoutBtn) logoutBtn.style.display='none'; }
    if(logoutBtn && !logoutBtn.dataset.wired){ logoutBtn.dataset.wired='1'; logoutBtn.addEventListener('click', ()=>{ localStorage.removeItem(KEYS.session); alert('Logged out.'); window.location.href='login.html'; }); }
    const themeBtn=document.getElementById('themeToggle');
    if(themeBtn){
      const sun=document.getElementById('iconSun'); const moon=document.getElementById('iconMoon');
      const apply=(mode)=>{ document.documentElement.dataset.theme=mode; if(sun&&moon){ sun.style.display=mode==='light'?'none':'inline'; moon.style.display=mode==='light'?'inline':'none'; }};
      let mode=localStorage.getItem(`${NAMESPACE}.theme`)||'light'; apply(mode);
      themeBtn.addEventListener('click', ()=>{ mode=(mode==='light'?'dark':'light'); localStorage.setItem(`${NAMESPACE}.theme`,mode); apply(mode); });
    }
    // Ensure login button navigates reliably
    const __lb=document.getElementById('loginBtn');
    if(__lb && !__lb.dataset.wiredNav){
      __lb.dataset.wiredNav='1';
      __lb.addEventListener('click', function(ev){
        // if an overlay accidentally catches the click, force navigation
        try{ if(this.tagName==='A' && this.getAttribute('href')) return; }catch(e){}
        window.location.href='login.html';
      });
    }
  }
  function initImageFallbacks(){
    function supportsAvif(){ return new Promise(res=>{ const im=new Image(); im.onload=()=>res(true); im.onerror=()=>res(false); im.src="data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAG1pZjFhdmlmAA=="; }); }
    supportsAvif().then(ok=>{ if(ok) return; document.querySelectorAll('img').forEach(img=>{ const s=img.getAttribute('src')||''; if(s.endsWith('.avif')){ const jpg=s.replace('.avif','.jpg'); const png=s.replace('.avif','.png'); img.onerror=()=>{ img.src=png; }; img.src=jpg; } }); });
  }
  window.OOP = { ROLES, ensureSeedUsers, register, login, getCurrentUser, changePassword, updateProfile, addScore, getLeaderboard, getAnnouncements, postAnnouncement, initHeader, initImageFallbacks };
  document.addEventListener('DOMContentLoaded', async ()=>{ await ensureSeedUsers(); initHeader(); initImageFallbacks(); });
})();

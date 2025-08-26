/* ===== Theme ===== */
(function(){
  const root=document.documentElement;
  const saved=localStorage.getItem('theme')|| (matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  root.setAttribute('data-theme',saved);
  document.getElementById('themeToggle')?.addEventListener('click',()=>{
    const cur=root.getAttribute('data-theme')==='dark'?'light':'dark';
    root.setAttribute('data-theme',cur); localStorage.setItem('theme',cur);
  });
})();

/* ===== Menu ===== */
const menuBtn=document.getElementById('menuBtn'); const menuList=document.getElementById('menuList');
if(menuBtn&&menuList){
  menuBtn.addEventListener('click',()=>menuList.style.display=menuList.style.display==='block'?'none':'block');
  document.addEventListener('click',(e)=>{ if(!menuList.contains(e.target)&&!menuBtn.contains(e.target)) menuList.style.display='none';});
}

/* ===== Helpers ===== */
const API_BASE = location.hostname.endsWith('github.io') ? 'https://oopquizbot.onrender.com' : '';
async function api(path, init={}){
  const r = await fetch(API_BASE+path,{credentials:'include',headers:{'Content-Type':'application/json'}, ...init});
  const j = await r.json().catch(()=>({ok:false,error:'Bad JSON'}));
  return j;
}
const $ = s => document.querySelector(s);
function toast(m){ alert(m); }

/* ===== Auth ===== */
async function doLogin(){
  const u=$('#user').value.trim(), p=$('#pass').value.trim();
  const r=await api('/api/login',{method:'POST',body:JSON.stringify({username:u,password:p})});
  r.ok?location.href='main.html':toast(r.error||'Login failed');
}
async function doSignup(){
  const u=$('#newuser').value.trim(), p=$('#newpass').value.trim(), role=$('#role').value;
  const r=await api('/api/signup',{method:'POST',body:JSON.stringify({username:u,password:p,role})});
  r.ok?(toast('Account created'),location.href='login.html'):toast(r.error||'Error');
}
async function doLogout(){ await api('/api/logout',{method:'POST'}); location.href='index.html'; }
async function changePassword(){
  const p=prompt('New password'); if(!p) return;
  const r=await api('/api/account/password',{method:'POST',body:JSON.stringify({password:p})});
  toast(r.ok?'Password updated':(r.error||'Error'));
}
window.doLogin=doLogin; window.doSignup=doSignup; window.doLogout=doLogout; window.changePassword=changePassword;

/* ===== Announcements & Uploads ===== */
async function loadAnnouncements(){
  const list=$('#annList'); if(!list) return;
  const r=await api('/api/announcements'); list.innerHTML='';
  (r.items||[]).slice().reverse().forEach(a=>{
    const d=document.createElement('div'); d.className='card';
    d.innerHTML=`<div style="font-weight:600">${a.title}</div>
                 <div class="muted">${a.by} • ${new Date((a.ts||0)/1000).toLocaleString()}</div>
                 <div>${a.text}</div>`;
    list.appendChild(d);
  });
}
async function postAnnouncement(){
  const title=$('#annTitle').value.trim(), text=$('#annBody').value.trim();
  const r=await api('/api/announcements',{method:'POST',body:JSON.stringify({title,text})});
  if(r.ok){ $('#annTitle').value=''; $('#annBody').value=''; loadAnnouncements(); } else toast(r.error||'Error');
}
async function uploadFiles(){
  const f=$('#annFile')?.files?.[0]; if(!f) return toast('Choose a file');
  const fd=new FormData(); fd.append('file',f);
  const r=await fetch(API_BASE+'/api/upload',{method:'POST',body:fd,credentials:'include'});
  const j=await r.json(); toast(j.ok?'Uploaded':(j.error||'Upload failed'));
}
window.loadAnnouncements=loadAnnouncements; window.postAnnouncement=postAnnouncement; window.uploadFiles=uploadFiles;

/* ===== Leaderboard ===== */
async function loadLeaderboard(){
  const t=$('#lb'); if(!t) return;
  const r=await api('/api/quiz/leaderboard');
  const rows=(r.rows||[]).slice().sort((a,b)=>(b.score-a.score)||(a.timeMs-b.timeMs));
  t.innerHTML=`<tr><th>#</th><th>User</th><th>Topic</th><th>Score</th><th>Time</th><th>When</th></tr>`+
    rows.map((x,i)=>`<tr><td>${i+1}</td><td>${x.user||''}</td><td>${x.topic||''}</td>
      <td>${x.score||0}</td><td>${x.timeMs||0} ms</td>
      <td>${new Date((x.ts||0)/1000).toLocaleString()}</td></tr>`).join('');
}
window.loadLeaderboard=loadLeaderboard;

/* ===== AI ===== */
async function askAI(){
  const m=$('#chatInput').value.trim(); if(!m) return;
  $('#chatInput').value='';
  const out=$('#chatOut'); out.value+=`\nYou: ${m}\n---\n`;
  const r=await api('/api/ai/chat',{method:'POST',body:JSON.stringify({message:m})});
  out.value+=(r.ok?`AI: ${r.text}\n`:`Error: ${r.error||'AI failed'}\n`);
}
async function paraphrase(){
  const t=$('#paraText').value.trim(); if(!t) return;
  const r=await api('/api/ai/paraphrase',{method:'POST',body:JSON.stringify({text:t})});
  $('#paraOut').value=r.ok?r.text:(r.error||'Error');
}
window.askAI=askAI; window.paraphrase=paraphrase;

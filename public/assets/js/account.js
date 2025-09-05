(async function(){
  function username(){ try{ return localStorage.getItem('oop_user') || 'guest'; }catch{return 'guest';} }
  async function loadJSON(p){ const r = await fetch(p, {cache:'no-store'}); return r.ok ? r.json() : []; }
  const me = username();
  const profiles = await loadJSON('data/profiles.json');
  const rec = profiles.find(p=>p.username?.toLowerCase()===me.toLowerCase());
  if (rec){
    const dn = document.querySelector('#displayName'); if (dn) dn.value = rec.displayName || '';
    const em = document.querySelector('#email');       if (em) em.value = rec.email || '';
    const rl = document.querySelector('#role');        if (rl) rl.value = rec.role || 'Student';
    const av = document.querySelector('#avatar');      if (av && rec.avatar) av.src = rec.avatar;
  }
})();

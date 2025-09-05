(async function(){
  const r = await fetch('data/announcements.json', { cache:'no-store' });
  const list = r.ok ? await r.json() : [];
  let host = document.getElementById('annList');
  if (!host) { host = document.createElement('section'); host.id='annList'; document.body.appendChild(host); }
  host.innerHTML = list.map(a => `
    <article class="ann">
      <h3>${a.title}</h3>
      <small>@${a.author} · ${new Date(a.date).toLocaleString()}</small>
      <p>${(a.body||'').replace(/\n/g,'<br>')}</p>
    </article>
  `).join('');
})();

(async function(){
  const r = await fetch('data/leaderboard.json', { cache:'no-store' });
  const arr = r.ok ? await r.json() : [];
  arr.sort((a,b)=>b.points - a.points);
  let table = document.getElementById('lb');
  if (!table) {
    table = document.createElement('table');
    table.id = 'lb';
    table.innerHTML = '<thead><tr><th>#</th><th>User</th><th>Points</th></tr></thead><tbody></tbody>';
    document.body.appendChild(table);
  }
  const tb = table.tBodies[0] || table.createTBody();
  tb.innerHTML = arr.map((x,i)=>`<tr><td>${i+1}</td><td>${x.user}</td><td>${x.points}</td></tr>`).join('');
})();

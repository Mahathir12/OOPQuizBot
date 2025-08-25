const api = (p, opt={}) =>
  fetch(p, {headers:{'Content-Type':'application/json'}, credentials:'include', ...opt})
    .then(r => r.json());

document.querySelector('#loginForm')?.addEventListener('submit', async e=>{
  e.preventDefault();
  const username = document.querySelector('#username').value.trim();
  const password = document.querySelector('#password').value.trim();
  const r = await api('/api/login',{method:'POST', body:JSON.stringify({username,password})});
  if(r.ok) location.href='main.html'; else alert(r.error||'Login failed');
});

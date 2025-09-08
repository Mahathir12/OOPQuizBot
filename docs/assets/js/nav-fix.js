// Injects a More (⋯) button + menu if not present, and uses Pointer Events.
(function () {
  function qs(s, r = document) { return r.querySelector(s); }
  let btn  = document.getElementById('moreBtn');
  let menu = document.getElementById('moreMenu');

  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'moreBtn';
    btn.className = 'kebab';
    btn.setAttribute('aria-haspopup', 'menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.title = 'More';
    btn.textContent = '⋯';
    (qs('header') || document.body).appendChild(btn);
  }
  if (!menu) {
    menu = document.createElement('nav');
    menu.id = 'moreMenu';
    menu.className = 'kebab-menu';
    menu.setAttribute('role', 'menu');
    menu.hidden = true;
    menu.innerHTML = `
      <a role="menuitem" href="leaderboard.html">Leaderboard</a>
      <a role="menuitem" href="account.html">Account</a>
    `;
    btn.insertAdjacentElement('afterend', menu);
  }

  const open  = () => { menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); };
  const close = () => { menu.hidden = true;  btn.setAttribute('aria-expanded', 'false'); };
  const toggle = () => { menu.hidden ? open() : close(); };

  btn.addEventListener('pointerup', (e) => { e.preventDefault(); e.stopPropagation(); toggle(); });
  document.addEventListener('pointerdown', (e) => {
    if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) close();
  }, { capture: true });
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    if (e.key === 'Escape') close();
  });
})();

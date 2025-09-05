// Works even if #moreBtn/#moreMenu don't exist — it injects them.
// Uses Pointer Events so mouse/touch/pen behave the same.
(function () {
  function qs(s, r = document) { return r.querySelector(s); }
  let btn  = document.getElementById('moreBtn');
  let menu = document.getElementById('moreMenu');

  // Inject a minimal button and menu if your HTML doesn't already have them
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

  // First tap works because we listen to pointerup, enlarge hit area, and stop propagation
  btn.addEventListener('pointerup', (e) => { e.preventDefault(); e.stopPropagation(); toggle(); });

  // Tap/click outside closes the menu reliably
  document.addEventListener('pointerdown', (e) => {
    if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) close();
  }, { capture: true });

  // Keyboard support
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    if (e.key === 'Escape') close();
  });
})();

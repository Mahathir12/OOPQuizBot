/* ========= Theme toggle ========= */
(function themeInit(){
  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  const saved = localStorage.getItem('theme') || 'dark';
  root.setAttribute('data-theme', saved);

  if (toggle) {
    toggle.addEventListener('click', () => {
      const cur = root.getAttribute('data-theme');
      const next = cur === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }
})();

/* ========= Landing “subscribe” demo ========= */
(function landing(){
  const btn = document.getElementById('subscribeBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    alert('Thanks! (Demo only)');
  });
})();

/* ========= Logout ========= */
(function logout(){
  const btn = document.getElementById('logoutBtn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    try {
      // backend route (see main.cpp patch below)
      await fetch('/api/logout', { method: 'POST' });
    } catch (_) {}
    alert('Logged out');
    window.location.href = 'login.html';
  });
})();

/* ========= Notebook ========= */
(function notebook(){
  const canvas = document.getElementById('noteCanvas');
  const overlay = document.getElementById('overlayCanvas');
  if (!canvas || !overlay) return;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const octx = overlay.getContext('2d');

  const penColor = document.getElementById('penColor');
  const penSize  = document.getElementById('penSize');
  const imageInput = document.getElementById('imageInput');
  const insertImageBtn = document.getElementById('insertImageBtn');
  const saveBtn = document.getElementById('saveBtn');
  const loadBtn = document.getElementById('loadBtn');
  const printBtn= document.getElementById('printBtn');
  const paperStyle = document.getElementById('paperStyle');
  const paperColor = document.getElementById('paperColor');
  const toggleGraphics = document.getElementById('toggleGraphics');
  const page = document.getElementById('page');

  // Tools state
  const tools = document.querySelectorAll('.tool');
  let tool = 'pen';            // 'pen' | 'highlighter' | 'eraser' | 'ruler' | 'pan'
  let drawing = false;
  let last = { x:0, y:0 };
  let start = { x:0, y:0 };    // for ruler
  let panning = false;
  let scrollLockY = 0;

  function setTool(name){
    tool = name;
    tools.forEach(b => b.classList.toggle('primary', b.dataset.tool === name));
    // Stop preview
    octx.clearRect(0,0,overlay.width, overlay.height);
  }
  tools.forEach(b => b.addEventListener('click', () => setTool(b.dataset.tool)));
  setTool('pen');

  // Drawing config (fix: color switching should not break strokes)
  function beginStroke(){
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Number(penSize.value || 4);

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.globalAlpha = 1;
    } else if (tool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = penColor.value;
      ctx.globalAlpha = 0.35;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = penColor.value;
      ctx.globalAlpha = 1;
    }
    ctx.beginPath();
  }

  // Pointer helpers
  function pos(e){
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top)  * (canvas.height / rect.height),
    };
  }

  // Ruler preview
  function drawPreviewLine(x1,y1,x2,y2){
    octx.clearRect(0,0,overlay.width, overlay.height);
    octx.strokeStyle = '#00d6ff';
    octx.lineWidth = 2;
    octx.setLineDash([8,6]);
    octx.beginPath();
    octx.moveTo(x1,y1);
    octx.lineTo(x2,y2);
    octx.stroke();
    octx.setLineDash([]);
  }

  canvas.addEventListener('pointerdown', (e)=>{
    canvas.setPointerCapture(e.pointerId);
    const p = pos(e);

    if (tool === 'pan') {
      panning = true;
      scrollLockY = e.clientY;
      return;
    }

    if (tool === 'ruler') {
      start = p;
      drawPreviewLine(start.x, start.y, p.x, p.y);
      return;
    }

    drawing = true;
    beginStroke();
    ctx.moveTo(p.x, p.y);
    last = p;
  });

  canvas.addEventListener('pointermove', (e)=>{
    const p = pos(e);

    if (panning) {
      // mouse mode to scroll
      const dy = e.clientY - scrollLockY;
      window.scrollBy(0, -dy);
      scrollLockY = e.clientY;
      return;
    }

    if (tool === 'ruler' && start.x) {
      drawPreviewLine(start.x, start.y, p.x, p.y);
      return;
    }

    if (!drawing) return;
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last = p;
  });

  function finishStroke(){ drawing = false; ctx.closePath(); }
  canvas.addEventListener('pointerup', (e)=>{
    canvas.releasePointerCapture(e.pointerId);

    if (panning) { panning = false; return; }

    if (tool === 'ruler' && start.x) {
      const p = pos(e);
      // Draw final straight line
      beginStroke();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      octx.clearRect(0,0,overlay.width, overlay.height);
      start = {x:0,y:0};
      return;
    }

    if (drawing) finishStroke();
  });
  canvas.addEventListener('pointercancel', ()=>{ drawing=false; panning=false; start={x:0,y:0}; });

  // Changing color or size should NOT break drawing next time: we simply use beginStroke() on pointerdown
  if (penColor) penColor.addEventListener('change', ()=>{/* no-op; next beginStroke picks it up */});
  if (penSize) penSize.addEventListener('change', ()=>{/* no-op */});

  // Paper style & color
  function setPaper(){
    page.classList.remove('paper-ruled','paper-grid','paper-plain');
    page.classList.remove('paper-white','paper-ivory','paper-night');

    // style
    const s = paperStyle?.value || 'ruled';
    if (s === 'ruled') page.classList.add('paper-ruled');
    else if (s === 'grid') page.classList.add('paper-grid');
    else page.classList.add('paper-plain');

    // color
    const c = paperColor?.value || 'paper-white';
    page.classList.add(c);
  }
  paperStyle?.addEventListener('change', setPaper);
  paperColor?.addEventListener('change', setPaper);
  setPaper();

  // Optional graphics overlay toggle
  toggleGraphics?.addEventListener('click', ()=>{
    page.classList.toggle('show-graphics');
  });

  // Image insert
  insertImageBtn?.addEventListener('click', ()=> imageInput.click());
  imageInput?.addEventListener('change', ()=>{
    if (!imageInput.files || !imageInput.files[0]) return;
    const file = imageInput.files[0];
    const img = new Image();
    img.onload = () => {
      const w = Math.min(canvas.width * 0.7, img.width);
      const h = img.height * (w / img.width);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.drawImage(img, (canvas.width - w)/2, (canvas.height - h)/2, w, h);
    };
    img.src = URL.createObjectURL(file);
  });

  // Save / Load (uses existing backend routes)
  saveBtn?.addEventListener('click', async ()=>{
    const dataUrl = canvas.toDataURL('image/png'); // save as image (preserves colors/graphics)
    const body = { file: 'page1', content: dataUrl };
    const r = await fetch('/api/notes/save', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const j = await r.json();
    if (j.ok) alert('Saved'); else alert(j.error || 'Save failed');
  });
  loadBtn?.addEventListener('click', async ()=>{
    const r = await fetch('/api/notes/load', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ file:'page1' }) });
    const j = await r.json();
    if (!j.ok || !j.content) { alert('Nothing saved yet'); return; }
    // content is dataURL
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0,0,canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = j.content;
  });

  // Print (A4). Browser will split the page into A4 pages automatically due to @media print.
  printBtn?.addEventListener('click', ()=>{
    window.print();
  });
})();

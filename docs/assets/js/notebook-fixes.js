(function(){
  // 1) Pen: pointer events with pressure
  const canvas = document.getElementById('nbCanvas');
  const ctx = canvas ? canvas.getContext('2d', { willReadFrequently: true }) : null;
  let drawing=false, last=null, color='#000';
  function base(){ const el=document.getElementById('penSize'); return el? parseFloat(el.value||'2'):2; }
  function penWidth(p){ return base() * (p ? (0.5 + p) : 1); }
  function dot(pt){ if(!ctx) return; ctx.beginPath(); ctx.arc(pt.x,pt.y,penWidth(pt.p)/2,0,Math.PI*2); ctx.fillStyle=color; ctx.fill(); }
  function stroke(a,b){ if(!ctx) return; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle=color; ctx.lineWidth=penWidth((a.p+b.p)/2); ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }
  if (canvas && ctx){
    canvas.style.touchAction='none';
    canvas.addEventListener('pointerdown', e=>{ canvas.setPointerCapture(e.pointerId); drawing=true; last={x:e.offsetX,y:e.offsetY,p:e.pressure||0.5}; dot(last); });
    canvas.addEventListener('pointermove', e=>{ if(!drawing) return; const cur={x:e.offsetX,y:e.offsetY,p:e.pressure||0.5}; stroke(last,cur); last=cur; });
    canvas.addEventListener('pointerup',   e=>{ if(!drawing) return; drawing=false; try{ canvas.releasePointerCapture(e.pointerId);}catch{} });
  }

  // 2) Print: snapshot canvas → <img> so print/PDF is not blank
  window.addEventListener('beforeprint', ()=>{
    document.querySelectorAll('.page canvas').forEach(c=>{
      if (c.dataset.snap) return;
      const img = new Image();
      img.src = c.toDataURL('image/png');
      img.className = 'canvas-snapshot';
      img.style.width = c.style.width; img.style.height = c.style.height;
      c.insertAdjacentElement('afterend', img);
      c.dataset.snap = '1';
    });
  });

  // 3) Insert-at-caret helpers
  function insertAtCaret(node){
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) { document.body.appendChild(node); return; }
    const r = sel.getRangeAt(0);
    r.collapse(false); r.insertNode(node); r.setStartAfter(node); r.collapse(true);
    sel.removeAllRanges(); sel.addRange(r);
  }

  // 4) Collapsible Insert panel
  if (!document.querySelector('details.insert-panel')){
    const d=document.createElement('details');
    d.className='insert-panel';
    d.innerHTML = `
      <summary>Insert ▾</summary>
      <button id="insertImageBtn" type="button">Image</button>
      <input id="insertImageInput" type="file" accept="image/*" hidden>
      <button id="insertTableBtn" type="button">Table 2×2</button>
      <button id="toggleBulletsBtn" type="button">Bullets</button>
      <select id="symbolPicker">
        <option value="">Insert symbol…</option>
        <option>∞</option><option>≈</option><option>±</option>
        <option>→</option><option>←</option><option>↔</option>
        <option>∑</option><option>∫</option><option>√</option>
        <option>α</option><option>β</option><option>γ</option>
      </select>
      <button id="handToolBtn" type="button">Select/Move</button>
    `;
    (document.getElementById('nbToolbar')||document.body).insertAdjacentElement('afterbegin', d);

    const imgBtn=d.querySelector('#insertImageBtn'), imgInp=d.querySelector('#insertImageInput');
    imgBtn.addEventListener('click', ()=> imgInp.click());
    imgInp.addEventListener('change', e=>{
      const f=e.target.files?.[0]; if(!f) return;
      const img=document.createElement('img');
      img.src=URL.createObjectURL(f); img.onload=()=>URL.revokeObjectURL(img.src);
      img.className='nb-image selectable resizable';
      insertAtCaret(img);
    });
    d.querySelector('#insertTableBtn').addEventListener('click', ()=>{
      const t=document.createElement('table'); t.className='nb-table';
      for (let r=0;r<2;r++){ const tr=document.createElement('tr'); for (let c=0;c<2;c++){ const td=document.createElement('td'); td.innerHTML='<br>'; tr.appendChild(td);} t.appendChild(tr); }
      insertAtCaret(t);
    });
    d.querySelector('#toggleBulletsBtn').addEventListener('click', ()=> document.execCommand('insertUnorderedList'));
    d.querySelector('#symbolPicker').addEventListener('change', e=>{ const v=e.target.value; if(!v) return; insertAtCaret(document.createTextNode(v)); e.target.selectedIndex=0; });
  }

  // 5) Select/move/resize (“hand tool”)
  let mode='draw', active=null;
  const handBtn = document.getElementById('handToolBtn');
  if (handBtn) handBtn.addEventListener('click', ()=> mode='select');
  document.addEventListener('pointerdown', e=>{
    if (mode!=='select') return;
    const t=e.target.closest('.selectable');
    document.querySelectorAll('.selectable.selected').forEach(n=>n.classList.remove('selected'));
    active=t||null; if(!active) return;
    active.classList.add('selected');
    const r=active.getBoundingClientRect(); const sx=e.clientX, sy=e.clientY;
    const isResize = (e.clientX > r.right-16 && e.clientY > r.bottom-16);
    function mv(ev){ const dx=ev.clientX-sx, dy=ev.clientY-sy;
      if (isResize){ active.style.width=(r.width+dx)+'px'; active.style.height=(r.height+dy)+'px'; }
      else { active.style.left=(r.left+dx)+'px'; active.style.top=(r.top+dy)+'px'; active.style.position='absolute'; } }
    function up(){ window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); }
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  });
})();

/* Notebook runtime */
const paper = document.getElementById('paper');
const btnTheme = document.getElementById('btnTheme');
const btnPrint = document.getElementById('btnPrint');
const color = document.getElementById('color');
const size = document.getElementById('size');
const pageBg = document.getElementById('pageBg');
const marginBox = document.getElementById('margin');
const pageColor = document.getElementById('pageColor');
const pageId = document.getElementById('pageId');

function qs(sel){ return document.querySelector(sel); }
function $el(tag, cls){ const e=document.createElement(tag); if(cls) e.className=cls; return e; }

function setMode(m){
  state.mode = m;
  document.querySelectorAll('.tool').forEach(b=>b.classList.toggle('active', b.dataset.mode===m));
}
const state = {
  mode:'pen',
  drawing:false,
  start:[0,0],
  last:[0,0],
  panOffset:[0,0],
  obj:null
};

function setBg(){
  paper.classList.remove('plain','lined','grid','dots');
  paper.classList.add(pageBg.value);
  if(marginBox.checked) paper.classList.add('margin'); else paper.classList.remove('margin');
  paper.style.setProperty('--page-color', pageColor.value);
}
setBg();
pageBg.onchange=setBg; marginBox.onchange=setBg; pageColor.oninput=setBg;

document.querySelectorAll('.tool').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
btnTheme.onclick=()=>document.body.classList.toggle('theme-dark');
btnPrint.onclick=()=>window.print();

/* canvas for freehand + shapes */
const canvas = $el('canvas','canvas'); paper.appendChild(canvas);
const ctx = canvas.getContext('2d',{ willReadFrequently:true });

function resizeCanvas(){
  canvas.width = paper.clientWidth;
  canvas.height = Math.max(paper.clientHeight, 1400);
}
resizeCanvas(); new ResizeObserver(resizeCanvas).observe(paper);

function pointerPos(e){ const r=canvas.getBoundingClientRect(); return [e.clientX-r.left, e.clientY-r.top]; }

function strokeStyle(){
  let w = +size.value; let rgba = hexToRgba(color.value, 1.0);
  if(state.mode==='pencil') rgba=hexToRgba(color.value, .7), w=Math.max(1,w-1);
  if(state.mode==='highlighter') rgba=hexToRgba(color.value, .35), w=Math.max(6, w+6);
  ctx.strokeStyle = rgba; ctx.fillStyle = rgba; ctx.lineWidth = w; ctx.lineCap="round"; ctx.lineJoin="round";
}
function hexToRgba(hex, a=1){ const x=hex.replace('#',''); const r=parseInt(x.substr(0,2),16), g=parseInt(x.substr(2,2),16), b=parseInt(x.substr(4,2),16); return `rgba(${r},${g},${b},${a})`; }

let panStart=[0,0], scrollStart=[0,0];

canvas.addEventListener('pointerdown', (e)=>{
  canvas.setPointerCapture(e.pointerId);
  const [x,y]=pointerPos(e);
  state.drawing=true; state.start=[x,y]; state.last=[x,y];
  if(state.mode.startsWith('shape-')){ state.obj={x1:x,y1:y,x2:x,y2:y}; }
  if(state.mode==='pan'){ panStart=[x,y]; scrollStart=[paper.scrollLeft||0, paper.scrollTop||0]; }
  if(state.mode==='eraser'){ ctx.globalCompositeOperation='destination-out'; }
  else ctx.globalCompositeOperation='source-over';
  if(state.mode==='pen' || state.mode==='pencil' || state.mode==='highlighter'){
    strokeStyle(); ctx.beginPath(); ctx.moveTo(x,y);
  }
  e.preventDefault();
});
canvas.addEventListener('pointermove',(e)=>{
  if(!state.drawing) return;
  const [x,y]=pointerPos(e);
  if(state.mode==='pan'){
    paper.scrollLeft = scrollStart[0] - (x - panStart[0]);
    paper.scrollTop  = scrollStart[1] - (y - panStart[1]);
    return;
  }
  if(state.mode==='pen' || state.mode==='pencil' || state.mode==='highlighter'){
    strokeStyle(); ctx.lineTo(x,y); ctx.stroke();
  } else if(state.mode.startsWith('shape-')){
    // redraw last shape preview
    const tmp = ctx.getImageData(0,0,canvas.width,canvas.height);
    ctx.putImageData(tmp,0,0); // (simple preview – acceptable for MVP)
    state.obj.x2=x; state.obj.y2=y;
    drawShape(state.obj, true);
  } else if(state.mode==='eraser'){
    ctx.lineWidth=+size.value+10; ctx.beginPath(); ctx.moveTo(state.last[0],state.last[1]); ctx.lineTo(x,y); ctx.stroke();
  }
  state.last=[x,y];
  e.preventDefault();
});
canvas.addEventListener('pointerup', (e)=>{
  if(state.mode.startsWith('shape-') && state.obj){ drawShape(state.obj,false); state.obj=null; }
  state.drawing=false; e.preventDefault();
});
function drawShape(o,preview){
  strokeStyle();
  if(state.mode==='shape-rect'){ ctx.strokeRect(Math.min(o.x1,o.x2), Math.min(o.y1,o.y2), Math.abs(o.x2-o.x1), Math.abs(o.y2-o.y1)); }
  if(state.mode==='shape-ellipse'){ ctx.beginPath(); ctx.ellipse((o.x1+o.x2)/2,(o.y1+o.y2)/2,Math.abs(o.x2-o.x1)/2,Math.abs(o.y2-o.y1)/2,0,0,Math.PI*2); ctx.stroke(); }
  if(state.mode==='shape-line'){ ctx.beginPath(); ctx.moveTo(o.x1,o.y1); ctx.lineTo(o.x2,o.y2); ctx.stroke(); }
}

/* text block */
document.querySelector('[data-mode="text"]').addEventListener('dblclick', ()=>{
  setMode('text');
});
paper.addEventListener('dblclick',(e)=>{
  if(state.mode!=='text') return;
  const r=paper.getBoundingClientRect();
  const box=$el('div','note-text'); box.contentEditable=true;
  box.style.left=(e.clientX-r.left-40)+'px'; box.style.top=(e.clientY-r.top-12)+'px';
  box.innerHTML='Type here…';
  paper.appendChild(box); box.focus();
});
paper.addEventListener('input',e=>{
  if(!e.target.classList.contains('note-text')) return;
  // URLs -> links
  e.target.innerHTML = e.target.innerHTML
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" class="autolink">$1</a>');
  // ```cpp code blocks -> highlight
  document.querySelectorAll('.note-text pre code').forEach(el=>hljs.highlightElement(el));
});

/* Tables & Charts (quick insert) */
document.getElementById('btnTable').onclick=()=>{
  const t=$el('div','note-text'); t.contentEditable=true;
  t.style.left='80px'; t.style.top='80px';
  t.innerHTML=`<table border="1" style="border-collapse:collapse;width:420px">
    <tr><th>Item</th><th>Value</th></tr>
    <tr><td>A</td><td>10</td></tr>
    <tr><td>B</td><td>20</td></tr>
  </table>`;
  paper.appendChild(t);
};
document.getElementById('btnChart').onclick=()=>{
  const box=$el('div','note-text'); box.style.left='120px'; box.style.top='120px';
  const c=$el('canvas'); c.width=360; c.height=200; box.appendChild(c); paper.appendChild(box);
  new Chart(c,{type:'bar',data:{labels:['A','B','C'],datasets:[{label:'Demo',data:[3,5,2]}]},options:{responsive:false, plugins:{legend:{display:false}}}});
};

/* Save/Load via backend (HTML content + canvas PNG) */
async function savePage(){
  const page = pageId.value.trim()||'default';
  // serialize: canvas image + text blocks
  const blocks = Array.from(document.querySelectorAll('.note-text')).map(n=>({x:n.style.left,y:n.style.top,html:n.innerHTML}));
  const payload = `<div class="page" data-bg="${pageBg.value}" data-margin="${marginBox.checked}" data-color="${pageColor.value}">
  <img class="ink" src="${canvas.toDataURL('image/png')}"/>
  ${blocks.map(b=>`<div class="note-text" style="left:${b.x};top:${b.y}">${b.html}</div>`).join('\n')}
</div>`;
  const r = await fetch('/api/notes/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({file:page,content:payload})});
  const j = await r.json(); alert(j.ok?'Saved':'Save error');
}
async function loadPage(){
  const page = pageId.value.trim()||'default';
  const r = await fetch('/api/notes/load',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({file:page})});
  const j = await r.json(); if(!j.ok) return alert('Load error');
  // reset
  ctx.clearRect(0,0,canvas.width,canvas.height);
  document.querySelectorAll('.note-text').forEach(n=>n.remove());
  if(!j.content) return;
  const host = $el('div'); host.innerHTML=j.content;
  const pg = host.querySelector('.page');
  if(pg){
    pageBg.value = pg.dataset.bg || 'lined';
    marginBox.checked = (pg.dataset.margin==='true');
    pageColor.value = pg.dataset.color || '#fffef9';
    setBg();
    const img = pg.querySelector('img.ink');
    if(img){
      const im = new Image(); im.onload=()=>{ctx.drawImage(im,0,0);}; im.src=img.src;
    }
    host.querySelectorAll('.note-text').forEach(n=>{
      const d=$el('div','note-text'); d.style.left=n.style.left; d.style.top=n.style.top; d.innerHTML=n.innerHTML; paper.appendChild(d);
    });
  }
}
document.getElementById('btnSave').onclick=savePage;
document.getElementById('btnLoad').onclick=loadPage;

/* prevent scroll while drawing */
['touchstart','wheel'].forEach(type => canvas.addEventListener(type, e=> {
  if(state.mode!=='pan') e.preventDefault();
},{passive:false}));

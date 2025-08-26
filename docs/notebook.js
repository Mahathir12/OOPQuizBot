/* notebook.js - full */
const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));

const api = {
  save: (file, content) => fetch('/api/notes/save', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ file, content })
  }).then(r=>r.json()),
  load: (file) => fetch('/api/notes/load', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ file })
  }).then(r=>r.json())
};

// --- Theme toggle
(function themeInit(){
  const saved = localStorage.getItem('theme');
  if(saved) document.documentElement.setAttribute('data-theme', saved);
  const btn = $('#themeToggle');
  if(btn){
    btn.onclick = () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? '' : 'dark';
      if(next) document.documentElement.setAttribute('data-theme', next);
      else document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', next);
      resizeCanvas();
      drawAll();
    };
  }
})();

// --- Editor state
const state = {
  file: 'default',
  mode: 'pen', // pen|pencil|highlighter|eraser|text|line|rect|circle|table
  color: '#0B0F14',
  width: 2,
  drawing: false,
  points: [],
  shapes: [], // {type, ...}
  grid: false,
};

const sheet = $('.sheet');
const canvas = $('#inkCanvas');
const ctx = canvas.getContext('2d', { alpha: true });
const blocks = $('#blocks');
const rulerX = $('#rulerX');
const rulerY = $('#rulerY');
const gridOverlay = $('#gridOverlay');

// --- Toolbar bindings
$('#mode').onchange = e=> state.mode = e.target.value;
$('#color').onchange = e=> state.color = e.target.value;
$('#width').onchange = e=> state.width = +e.target.value;
$('#gridToggle').onchange = e=> {
  state.grid = e.target.checked;
  gridOverlay.style.display = state.grid ? 'block' : 'none';
};
$('#rulerToggle').onchange = e=>{
  const on = e.target.checked;
  rulerX.style.display = on ? 'block':'none';
  rulerY.style.display = on ? 'block':'none';
};

$('#insertText').onclick = ()=> insertText();
$('#insertTable').onclick = ()=> insertTable();
$('#clearCanvas').onclick = ()=> { state.shapes=[]; drawAll(); };
$('#saveBtn').onclick = savePage;
$('#loadBtn').onclick = loadPage;
$('#printBtn').onclick = ()=> window.print();

// Auto link styling via MutationObserver
const linkify = txt =>
  txt.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');

// Simple C/C++ code tint
function codeTint(text){
  const kw = /\b(class|struct|virtual|override|public|private|protected|return|if|else|for|while|switch|case|template|typename|using|namespace|new|delete|try|catch|throw|const|constexpr|inline|static|friend)\b/g;
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(kw, '<b>$1</b>');
}

// --- Canvas sizing
function resizeCanvas(){
  const r = sheet.getBoundingClientRect();
  canvas.width = Math.floor(r.width * devicePixelRatio);
  canvas.height = Math.floor(r.height * devicePixelRatio);
  canvas.style.width = r.width + 'px';
  canvas.style.height= r.height + 'px';
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
}
window.addEventListener('resize', ()=>{ resizeCanvas(); drawAll(); });
resizeCanvas();

// --- Prevent page scroll while drawing (critical for stability)
let preventScroll = false;
['touchstart','touchmove','wheel'].forEach(ev =>
  document.addEventListener(ev, e => { if(preventScroll) e.preventDefault(); }, { passive:false })
);

// --- Pointer handling
canvas.addEventListener('pointerdown', e=>{
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left, y = e.clientY - rect.top;
  if(state.mode==='text'){ insertText(x,y); return; }
  state.drawing = true; preventScroll = true;
  state.points = [{x,y}];
  if($('#rulerToggle').checked){
    rulerX.style.top = y+'px'; rulerY.style.left = x+'px';
  }
});
document.addEventListener('pointerup', ()=>{
  if(!state.drawing) return;
  state.drawing = false; preventScroll = false;
  commitStroke();
});
canvas.addEventListener('pointermove', e=>{
  if($('#rulerToggle').checked){
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    rulerX.style.top = y+'px'; rulerY.style.left = x+'px';
  }
  if(!state.drawing) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left, y = e.clientY - rect.top;
  state.points.push({x,y});
  drawAll();
});

// --- Shapes storage/draw
function commitStroke(){
  const p = state.points.slice();
  if(p.length<2) return;
  switch(state.mode){
    case 'pen':
    case 'pencil':
    case 'highlighter':
    case 'eraser':
      state.shapes.push({
        type: state.mode,
        color: state.mode==='eraser' ? '#FFFFFF00' : state.color,
        width: state.width,
        points: p
      }); break;
    case 'line':
      state.shapes.push({ type:'line', color:state.color, width:state.width, p1:p[0], p2:p[p.length-1]}); break;
    case 'rect':
      const p0=p[0], p1=p[p.length-1];
      state.shapes.push({ type:'rect', color:state.color, width:state.width, x:Math.min(p0.x,p1.x), y:Math.min(p0.y,p1.y), w:Math.abs(p1.x-p0.x), h:Math.abs(p1.y-p0.y) });
      break;
    case 'circle':
      const a=p[0], b=p[p.length-1];
      const r = Math.hypot(b.x-a.x,b.y-a.y);
      state.shapes.push({ type:'circle', color:state.color, width:state.width, x:a.x, y:a.y, r });
      break;
  }
  drawAll();
}

function drawAll(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(const s of state.shapes){
    ctx.lineJoin='round'; ctx.lineCap='round';
    let opacity=1, w=s.width;
    if(s.type==='pencil') w=Math.max(1,s.width-1);
    if(s.type==='highlighter'){ opacity=.35; w = s.width+8; }
    ctx.globalAlpha=opacity;
    ctx.strokeStyle=s.color; ctx.lineWidth=w;

    if(s.type==='pen'||s.type==='pencil'||s.type==='highlighter'){
      ctx.beginPath();
      const pts=s.points; ctx.moveTo(pts[0].x, pts[0].y);
      for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    }else if(s.type==='eraser'){
      ctx.globalCompositeOperation='destination-out';
      ctx.beginPath();
      const pts=s.points; ctx.moveTo(pts[0].x, pts[0].y);
      for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.lineWidth = s.width+10; ctx.stroke();
      ctx.globalCompositeOperation='source-over';
    }else if(s.type==='line'){
      ctx.beginPath(); ctx.moveTo(s.p1.x,s.p1.y); ctx.lineTo(s.p2.x,s.p2.y); ctx.stroke();
    }else if(s.type==='rect'){
      ctx.strokeRect(s.x,s.y,s.w,s.h);
    }else if(s.type==='circle'){
      ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.stroke();
    }
    ctx.globalAlpha=1;
  }
}

// --- Insert text
function insertText(x=120,y=120){
  const div = document.createElement('div');
  div.className='note-text';
  div.contentEditable='true';
  div.style.position='absolute';
  div.style.left = (x||120)+'px';
  div.style.top  = (y||120)+'px';
  div.innerHTML = 'Type here…';
  div.oninput = () => { div.innerHTML = linkify(div.innerHTML); };
  div.onkeydown = e=>{
    if(e.ctrlKey && e.key.toLowerCase()==='b'){ document.execCommand('bold'); e.preventDefault(); }
  };
  blocks.appendChild(div);
  div.focus();
}

// --- Insert table (3x3)
function insertTable(){
  const t = document.createElement('table'); t.className='note-table';
  for(let r=0;r<3;r++){
    const tr=document.createElement('tr');
    for(let c=0;c<3;c++){
      const td=document.createElement('td'); td.contentEditable='true'; td.textContent=' ';
      tr.appendChild(td);
    }
    t.appendChild(tr);
  }
  blocks.appendChild(t);
}

// --- Save/Load (HTML blocks + shapes as JSON)
function serialize(){
  return JSON.stringify({
    html: blocks.innerHTML,
    shapes: state.shapes,
    theme: document.documentElement.getAttribute('data-theme')||'',
  });
}
function deserialize(s){
  try{
    const o = JSON.parse(s);
    blocks.innerHTML = o.html||'';
    state.shapes = o.shapes||[];
    if(o.theme) document.documentElement.setAttribute('data-theme', o.theme);
    gridOverlay.style.display = state.grid ? 'block' : 'none';
    drawAll();
  }catch(_){}
}

async function savePage(){
  const body = `<data type="note/json">${serialize()}</data>`;
  const r = await api.save(state.file, body);
  alert(r.ok ? 'Saved!' : ('Save failed: ' + (r.error||'unknown')));
}
async function loadPage(){
  const r = await api.load(state.file);
  if(r.ok && r.content){
    const m = r.content.match(/<data type="note\/json">([\s\S]*)<\/data>/);
    if(m) deserialize(m[1]);
  }else{
    alert('Nothing saved yet for this page.');
  }
}

// Init once
drawAll();

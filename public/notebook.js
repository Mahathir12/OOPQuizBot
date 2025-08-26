const nb = (()=>{

  const API_BASE = location.hostname.endsWith('github.io') ? 'https://oopquizbot.onrender.com' : '';
  const S = sel => document.querySelector(sel);

  let modeSel, toolSel, colorInput, sizeInput, pageColorSel, patternSel;
  let docEl, wrap, canvas, ctx, drawing=false, last={x:0,y:0}, start={x:0,y:0};
  let pageColor = '#fff', pattern = 'none';

  function resizeCanvas(){
    const r = wrap.getBoundingClientRect();
    canvas.width = Math.floor(r.width);
    canvas.height = Math.floor(r.height);
    drawPattern();
  }

  function drawPattern(){
    const bg = pageColor;
    canvas.style.background = bg;
    const p = pattern;
    if(p==='ruled'){
      canvas.style.backgroundImage =
        `linear-gradient(${bg} 39px, #e8eef5 40px)`;
      canvas.style.backgroundSize = `auto 40px`;
    }else if(p==='grid'){
      canvas.style.backgroundImage =
       `linear-gradient(${bg} 39px,#e8eef5 40px),linear-gradient(90deg,${bg} 39px,#e8eef5 40px)`;
      canvas.style.backgroundSize = `40px 40px, 40px 40px`;
    }else if(p==='dots'){
      canvas.style.background =
        `radial-gradient(#c3cce0 1px, ${bg} 1px)`;
      canvas.style.backgroundSize = `20px 20px`;
    }else{
      canvas.style.background = bg;
      canvas.style.backgroundImage='none';
    }
  }

  function getPos(e){
    const rect = canvas.getBoundingClientRect();
    return {x:(e.clientX-rect.left), y:(e.clientY-rect.top)};
  }

  function strokeSettings(){
    ctx.save();
    ctx.lineCap = ctx.lineJoin = 'round';
    const t = toolSel.value;
    if(t==='eraser'){
      ctx.globalCompositeOperation='destination-out';
      ctx.strokeStyle = '#000';
    }else{
      ctx.globalCompositeOperation='source-over';
      ctx.strokeStyle = colorInput.value;
    }
    let w=parseInt(sizeInput.value||'4',10);
    if(t==='pencil') w=Math.max(1,w-1);
    if(t==='marker'){ ctx.globalAlpha=.5; w+=2; }
    ctx.lineWidth = w;
  }

  function drawShape(a,b,tool){
    ctx.save();
    ctx.strokeStyle = colorInput.value;
    ctx.lineWidth = parseInt(sizeInput.value||'4',10);
    ctx.beginPath();
    if(tool==='line' || tool==='ruler'){
      ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
    }else if(tool==='rect'){
      ctx.strokeRect(Math.min(a.x,b.x),Math.min(a.y,b.y), Math.abs(b.x-a.x),Math.abs(b.y-a.y));
    }else if(tool==='circle'){
      const rx=b.x-a.x, ry=b.y-a.y; const r=Math.hypot(rx,ry);
      ctx.arc(a.x,a.y,r,0,Math.PI*2);
    }else if(tool==='arrow'){
      // main line
      ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
      // head
      const angle=Math.atan2(b.y-a.y,b.x-a.x), head=10;
      ctx.moveTo(b.x,b.y);
      ctx.lineTo(b.x-head*Math.cos(angle-Math.PI/6), b.y-head*Math.sin(angle-Math.PI/6));
      ctx.moveTo(b.x,b.y);
      ctx.lineTo(b.x-head*Math.cos(angle+Math.PI/6), b.y-head*Math.sin(angle+Math.PI/6));
    }
    ctx.stroke(); ctx.restore();
  }

  function spawnTextBox(x,y){
    const tb=document.createElement('div');
    tb.className='textbox'; tb.contentEditable='true';
    tb.style.left = `${x}px`; tb.style.top = `${y}px`;
    wrap.appendChild(tb); tb.focus();
  }

  // events
  function mouseDown(e){
    if(!canvas.contains(e.target)) return;
    e.preventDefault(); drawing=true; start=last=getPos(e);
    if(toolSel.value==='text'){ spawnTextBox(start.x,start.y); drawing=false; }
  }
  function mouseMove(e){
    if(!drawing) return; e.preventDefault();
    const p=getPos(e);
    const t=toolSel.value;
    if(['pen','pencil','marker','eraser'].includes(t)){
      strokeSettings(); ctx.beginPath(); ctx.moveTo(last.x,last.y); ctx.lineTo(p.x,p.y); ctx.stroke(); ctx.restore();
    }
    last=p;
  }
  function mouseUp(){
    if(!drawing) return; drawing=false;
    const t=toolSel.value;
    if(['line','rect','circle','arrow','ruler'].includes(t)) drawShape(start,last,t);
  }

  // document mode helpers
  function insertCode(){
    const pre=document.createElement('pre'); const code=document.createElement('code');
    code.className='cpp'; code.textContent='// paste C++ code here';
    pre.appendChild(code); docEl.appendChild(pre); hljs.highlightElement(code);
  }
  function insertTable(){
    const table=document.createElement('table'); table.border='1'; table.style.borderCollapse='collapse';
    for(let r=0;r<3;r++){const tr=document.createElement('tr');
      for(let c=0;c<3;c++){const td=document.createElement('td'); td.textContent=' '; td.style.padding='6px'; tr.appendChild(td);}
      table.appendChild(tr);
    } docEl.appendChild(table);
  }
  function insertChart(){
    const c=document.createElement('canvas'); c.width=400;c.height=220; docEl.appendChild(c);
    const g=c.getContext('2d');
    new Chart(g,{type:'bar',data:{labels:['A','B','C','D'],datasets:[{label:'Data',data:[3,5,2,7]}]},options:{plugins:{legend:{display:false}}}});
  }
  function toggleLinks(){
    // auto-color links in contenteditable doc
    const linkRegex=/(https?:\/\/[^\s]+)/g;
    docEl.innerHTML = docEl.innerHTML.replace(linkRegex, url => `<a href="${url}" target="_blank">${url}</a>`);
  }

  // save/load
  async function save(){
    const name=S('#pageName').value||'default';
    const isDoc = S('#modeSel').value==='doc';
    const content = isDoc ? docEl.innerHTML : canvas.toDataURL('image/png');
    const r = await fetch(API_BASE+'/api/note',{method:'POST',credentials:'include',
      headers:{'Content-Type':'application/json'},body:JSON.stringify({name,content})});
    (await r.json()).ok?alert('Saved'):alert('Save failed');
  }
  async function load(){
    const name=S('#pageName').value||'default';
    const r=await fetch(API_BASE+`/api/note?name=${encodeURIComponent(name)}`,{credentials:'include'});
    const j=await r.json();
    if(j.ok){
      if(S('#modeSel').value==='doc'){ docEl.innerHTML=j.content||''; }
      else { drawPattern(); const img=new Image(); img.onload=()=>ctx.drawImage(img,0,0); img.src=j.content||''; }
    }
  }

  function printNote(){
    const w=window.open('','_blank'); const html = (S('#modeSel').value==='doc')? docEl.outerHTML : `<img src="${canvas.toDataURL('image/png')}">`;
    w.document.write(`<html><head><title>Print</title></head><body>${html}</body></html>`); w.document.close(); w.print();
  }

  function setMode(m){
    if(m==='doc'){ S('#doc').style.display='block'; S('#docTools').style.display='flex'; S('#canvasTools').style.display='none'; S('#canvasWrap').style.display='none'; }
    else { S('#doc').style.display='none'; S('#docTools').style.display='none'; S('#canvasTools').style.display='flex'; S('#canvasWrap').style.display='block'; resizeCanvas(); }
  }

  function applyTemplate(t){
    if(t==='study') docEl.innerHTML='<h2>Study Notes</h2><p>Topic…</p><ul><li>Point</li></ul>';
    else if(t==='meeting') docEl.innerHTML='<h2>Meeting Notes</h2><p>Date…</p><h3>Attendees</h3><ul></ul><h3>Decisions</h3><ul></ul>';
    else if(t==='project') docEl.innerHTML='<h2>Project Brief</h2><p>Goal…</p><h3>Milestones</h3><ul></ul>';
    else if(t==='journal') docEl.innerHTML='<h2>Journal</h2><p>Today…</p>';
  }

  return {
    init(){
      modeSel=S('#modeSel'); toolSel=S('#tool'); colorInput=S('#color'); sizeInput=S('#size');
      pageColorSel=S('#pageColor'); patternSel=S('#pagePattern');
      docEl=S('#doc'); wrap=S('#canvasWrap'); canvas=S('#noteCanvas'); ctx=canvas.getContext('2d');

      window.addEventListener('resize', ()=>{ if(S('#modeSel').value==='canvas') resizeCanvas(); });
      canvas.addEventListener('mousedown', mouseDown);
      window.addEventListener('mousemove', mouseMove);
      window.addEventListener('mouseup', mouseUp);

      modeSel.addEventListener('change', e=> setMode(e.target.value));
      pageColorSel.addEventListener('change', e=>{ pageColor=e.target.value; drawPattern(); });
      patternSel.addEventListener('change', e=>{ pattern=e.target.value; drawPattern(); });

      setMode('doc'); // default
    },
    setPageColor(v){ pageColor=v; pageColorSel.value=v; drawPattern(); },
    setPattern(v){ pattern=v; patternSel.value=v; drawPattern(); },
    insertCode, insertTable, insertChart, toggleLinks,
    save, load, print: printNote,
    clear(){ ctx.clearRect(0,0,canvas.width,canvas.height); drawPattern(); },
    applyTemplate, spawnTextBox
  };
})();

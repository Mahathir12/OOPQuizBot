// minimal design system + theme switch
const root = document.documentElement;
const LIGHT = {'--text':'#0B0F14','--surface':'#FBFCFE','--surface-1':'#F3F6FB','--hairline':'#E6EAF2','--accent':'#4C7DF0'};
const DARK  = {'--text':'#E8EEF5','--surface':'#0B0F14','--surface-1':'#11161E','--hairline':'#272C35','--accent':'#4C7DF0'};

function apply(vars){ Object.entries(vars).forEach(([k,v])=>root.style.setProperty(k,v)); }
function setTheme(mode){
  if(mode==='dark'){ document.body.classList.add('theme-dark'); apply(DARK); }
  else if(mode==='light'){ document.body.classList.remove('theme-dark'); apply(LIGHT); }
  else { const m=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'; setTheme(m); return; }
  localStorage.setItem('theme', mode);
}
window.addEventListener('load',()=> setTheme(localStorage.getItem('theme')||'auto'));

document.getElementById('btnTheme')?.addEventListener('click', ()=>{
  const cur = document.body.classList.contains('theme-dark')?'dark':'light';
  setTheme(cur==='dark'?'light':'dark');
});

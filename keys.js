'use strict';
/* ========== কিবোর্ড দিয়ে কাজ (এক্সেলের মতো): Enter / তীর / Tab / শর্টকাট ========== */
const isTxt=e=>e&&e.tagName==='INPUT'&&!/^(checkbox|radio|file|button|submit|hidden|range|color)$/.test(e.type);
const vis=e=>e&&e.offsetParent!==null&&!e.disabled&&!e.readOnly;
const focusSel=e=>{if(!e)return;e.focus();try{if(e.select&&isTxt(e))e.select()}catch(x){}};
function cartRows(){const c=$('#cart');return c?[...c.querySelectorAll('.cr')].map(r=>[...r.querySelectorAll('input')].filter(vis)).filter(a=>a.length):[]}
function cartMove(el,dir){ // dir: next/prev (Enter), up/down/left/right (তীর)
  const rows=cartRows();let r=-1,c=-1;rows.forEach((row,i)=>{const j=row.indexOf(el);if(j>=0){r=i;c=j}});if(r<0)return false;
  const flat=rows.flat(),k=flat.indexOf(el);
  if(dir==='next'){if(k<flat.length-1)focusSel(flat[k+1]);else focusSearch();return true}
  if(dir==='prev'){if(k>0)focusSel(flat[k-1]);return true}
  const sameCol=(row,el,c)=>row.find(x=>x.dataset.f===el.dataset.f)||(el.dataset.f==='sub'?row.find(x=>x.dataset.f==='qty'):null)||row[Math.min(c,row.length-1)];
  if(dir==='down'){if(r<rows.length-1)focusSel(sameCol(rows[r+1],el,c));else focusSearch();return true}
  if(dir==='up'){if(r>0)focusSel(sameCol(rows[r-1],el,c));return true}
  if(dir==='right'){if(c<rows[r].length-1)focusSel(rows[r][c+1]);else if(r<rows.length-1)focusSel(rows[r+1][0]);return true}
  if(dir==='left'){if(c>0)focusSel(rows[r][c-1]);else if(r>0)focusSel(rows[r-1][rows[r-1].length-1]);return true}
  return false;
}
function focusSearch(){const q=$('#pq')||$('#main input[type=search]')||$('#main input[placeholder*="খুঁজ"]');if(q){q.focus();try{q.select()}catch(e){}}}
const primaryBtn=root=>root&&[...root.querySelectorAll('button.btn')].find(b=>!b.classList.contains('o')&&!b.classList.contains('d')&&!b.classList.contains('s')&&vis(b));
function newDoc(type){
  if(POS&&POS.items&&POS.items.length&&!confirm('চলমান তালিকা মুছে নতুন '+(TYPES[type]?TYPES[type].l:'এন্ট্রি')+' শুরু করবেন?'))return;
  POS=null;go('pos:'+type,{});setTimeout(focusSearch,50);
}
function showKeys(){
  const rows=[['Enter','পরের ঘরে যান (শেষ ঘরে বিলের সার্চে ফিরুন / ফর্মে সেভ)'],['↑ ↓','বিলের তালিকায় ওপরের / নিচের লাইনে যান'],['← →','বিলের তালিকায় আগের / পরের ঘরে যান'],['Tab / Shift+Tab','পরের / আগের ঘর'],['F2','সার্চ বক্সে যান'],['F4','নতুন বিক্রয়'],['F8','নতুন ক্রয়'],['Ctrl+S  বা  Ctrl+Enter','সেভ করুন'],['Ctrl+P','সেভ ও প্রিন্ট (ইনভয়েস দেখার সময়: প্রিন্ট)'],['↓ (সার্চ বক্সে)','বিলের শেষ লাইনের পরিমাণে যান'],['Esc','ফর্ম বন্ধ / সার্চ খালি / বিল থেকে সার্চে ফিরুন'],['F1  বা  Ctrl+/','এই তালিকা']];
  modal('⌨ কিবোর্ড শর্টকাট',`<table style="width:100%;border-collapse:collapse">${rows.map(r=>`<tr><td style="padding:7px 8px;border-bottom:1px solid var(--b);white-space:nowrap"><b style="background:var(--pll);border:1px solid var(--b);border-radius:6px;padding:2px 8px">${r[0]}</b></td><td style="padding:7px 8px;border-bottom:1px solid var(--b)">${r[1]}</td></tr>`).join('')}</table><p style="color:var(--m);font-size:13px">বারকোড স্ক্যানার ব্যবহারের সময় কার্সর সার্চ বক্সে (বা কোনো ঘরেই না) রাখুন।</p>`);
}
SCR.shortcuts=()=>{view(`<div class="card"><h3 style="margin:0 0 8px">⌨ কিবোর্ড শর্টকাট</h3><div id="ksc"></div></div>`);const t=$('#ksc');t.innerHTML='<button class="btn" id="kopen">শর্টকাট তালিকা দেখুন</button>';$('#kopen').onclick=showKeys;showKeys()};

/* ---- বিলের তালিকার (cart) ঘরে ঘরে চলা ---- */
document.addEventListener('focusin',e=>{const t=e.target;if(t&&t.matches&&t.matches('#cart input')&&t.type!=='date')setTimeout(()=>{if(document.activeElement===t){try{t.select()}catch(x){}}},0)});
document.addEventListener('keydown',e=>{
  const t=e.target;if(!t||!t.tagName)return;
  /* সার্চ বক্স: একাধিক মিল থাকলে Enter চাপলে প্রথমটি যোগ; ↓ চাপলে কার্টে; Esc চাপলে খালি */
  if(t.id==='pq'&&POS){
    if(e.key==='Enter'){const c=t.value.trim();if(c&&!findByBarcode(c)){const m=live('products').filter(p=>posMatch(p,c.toLowerCase()));
      if(m.length>1){e.preventDefault();e.stopPropagation();addItem(m[0]);POS.q='';t.value='';paintGrid();return}}return}
    if(e.key==='ArrowDown'){const rows=cartRows();if(rows.length){e.preventDefault();focusSel(rows[rows.length-1][0])}return}
    if(e.key==='Escape'){t.value='';POS.q='';paintGrid();return}
    return;
  }
  /* cart-এর ঘর */
  if(t.matches&&t.matches('#cart input')){
    const isDate=t.type==='date';
    if(e.key==='Enter'){e.preventDefault();cartMove(t,e.shiftKey?'prev':'next');return}
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();cartMove(t,e.key==='ArrowDown'?'down':'up');return}
    if((e.key==='ArrowRight'||e.key==='ArrowLeft')&&!isDate){e.preventDefault();cartMove(t,e.key==='ArrowRight'?'right':'left');return}
    if(e.key==='Escape'){e.preventDefault();focusSearch();return}
    return;
  }
  /* ফর্ম / কার্ডের ঘরে Enter = পরের ঘর, শেষ ঘরে Enter = সেভ */
  if(e.key==='Enter'&&!e.shiftKey&&!e.ctrlKey&&!e.altKey&&(isTxt(t)||t.tagName==='SELECT')){
    if(t.onkeydown||t.type==='search'||(t.placeholder||'').includes('খুঁজ')||t.id==='pq')return;
    const scope=modalOpen()?$('#mbody'):t.closest('.card');if(!scope||(!modalOpen()&&scope.closest('#cart')))return;
    const f=[...scope.querySelectorAll('input,select,textarea')].filter(x=>vis(x)&&!/^(hidden|file|checkbox|radio|button|submit)$/.test(x.type));
    const k=f.indexOf(t);if(k<0)return;
    if(k<f.length-1){e.preventDefault();focusSel(f[k+1])}
    else{const b=primaryBtn(scope);if(b){e.preventDefault();b.click()}}
    return;
  }
});

/* ---- শর্টকাট ---- */
document.addEventListener('keydown',e=>{
  if(typeof ME==='undefined'||!ME)return;
  const k=e.key,ctrl=e.ctrlKey||e.metaKey;
  if(k==='F1'||(ctrl&&k==='/')){e.preventDefault();showKeys();return}
  if(modalOpen()){
    if(ctrl&&(k==='s'||k==='S'||k==='Enter')){const b=primaryBtn($('#mbody'));if(b){e.preventDefault();b.click()}}
    else if(ctrl&&(k==='p'||k==='P')&&$('#vp')){e.preventDefault();$('#vp').click()}
    return;
  }
  if(k==='F2'){e.preventDefault();focusSearch();return}
  if(k==='F4'){e.preventDefault();newDoc('sale');return}
  if(k==='F8'){e.preventDefault();newDoc('purchase');return}
  if(CUR.r==='pos'&&POS){
    if(ctrl&&(k==='s'||k==='S'||k==='Enter')){e.preventDefault();const b=$('#psave');if(b)b.click();return}
    if(ctrl&&(k==='p'||k==='P')){e.preventDefault();const b=$('#pprint');if(b)b.click();return}
  }else if(ctrl&&(k==='s'||k==='S'))e.preventDefault();
});

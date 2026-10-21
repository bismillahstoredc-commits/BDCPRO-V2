'use strict';
/* ========== অ্যাপ আপডেট: নতুন ভার্সন এলে জানানো + সেটিংসে হাতে চেক করা + ভার্সন নম্বর ========== */
const APP_LABEL=document.title.replace(/\s*[—-].*$/,'').trim()||'অ্যাপ';
let UPD_READY=false,UPD_CTRL=!!(navigator.serviceWorker&&navigator.serviceWorker.controller);
const sleepMs=ms=>new Promise(r=>setTimeout(r,ms));
async function appBuild(){try{const k=(await caches.keys()).map(x=>(x.match(/-v(\d+)$/)||[])[1]).filter(Boolean).map(Number);return k.length?Math.max(...k):''}catch(e){return ''}}
function showUpdBar(){
  if(document.getElementById('updbar'))return;
  const b=document.createElement('div');b.id='updbar';
  b.style.cssText='position:fixed;left:10px;right:10px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:9000;background:#4b1c9c;color:#fff;border-radius:14px;padding:10px 12px;display:flex;align-items:center;gap:10px;box-shadow:0 6px 24px rgba(0,0,0,.35);font-size:14px';
  b.innerHTML='<span style="flex:1">🔄 নতুন ভার্সন প্রস্তুত। আপডেট করলে অ্যাপ একবার নতুন করে খুলবে (অসম্পূর্ণ বিল সেভ থাকবে)।</span><button id="updgo" class="btn s" style="background:#fff;color:#4b1c9c;white-space:nowrap">এখনই আপডেট</button><button id="updlater" style="background:none;border:0;color:#fff;font-size:20px;cursor:pointer;padding:4px 8px" aria-label="পরে">✕</button>';
  document.body.appendChild(b);
  $('#updgo').onclick=()=>location.reload();$('#updlater').onclick=()=>b.remove();
}
if('serviceWorker' in navigator){
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(!UPD_CTRL){UPD_CTRL=true;return}   // প্রথমবার ইনস্টল — আপডেট নয়
    UPD_READY=true;showUpdBar();const m=$('#updmsg');if(m){m.style.color='var(--g)';m.textContent='✓ নতুন ভার্সন নামানো হয়েছে। "এখনই আপডেট" চাপুন।'}
  });
}
async function checkUpdate(){
  const m=$('#updmsg'),say=(t,c)=>{if(m){m.style.color=c||'var(--m)';m.textContent=t}};
  if(!('serviceWorker' in navigator))return say('এই ব্রাউজারে আপডেট চেক করা যায় না','var(--r)');
  if(!navigator.onLine)return say('ইন্টারনেট নেই। ইন্টারনেট চালু করে আবার চেষ্টা করুন','var(--r)');
  const reg=await navigator.serviceWorker.getRegistration();
  if(!reg)return say('অফলাইন মোড এখনো চালু হয়নি — অ্যাপ একবার রিফ্রেশ করে আবার চেষ্টা করুন','var(--r)');
  say('নতুন ভার্সন খোঁজা হচ্ছে…');let found=false;const f=()=>{found=true};reg.addEventListener('updatefound',f);
  try{await reg.update()}catch(e){reg.removeEventListener('updatefound',f);return say('সংযোগে সমস্যা, একটু পরে আবার চেষ্টা করুন','var(--r)')}
  for(let i=0;i<60&&!UPD_READY;i++){if(!found&&!reg.installing&&!reg.waiting&&i>=3)break;say('নতুন ভার্সন নামছে…');await sleepMs(500)}
  reg.removeEventListener('updatefound',f);
  if(UPD_READY)return;
  if(found||reg.installing||reg.waiting)return say('নতুন ভার্সন নামছে, কিছুক্ষণ পর আবার চেক করুন','var(--o)');
  say('✓ আপনি সর্বশেষ ভার্সনেই আছেন','var(--g)');
}
async function addUpdCard(){
  const main=$('#main');if(!main||$('#updcard'))return;
  const bd=await appBuild();if($('#updcard')||CUR.r!=='settings')return;
  const c=document.createElement('div');c.className='card';c.id='updcard';
  c.innerHTML=`<h3 style="margin:0 0 6px">🔄 অ্যাপ আপডেট</h3><div style="font-size:14px">ভার্সন: <b>${esc(APP_LABEL)}</b>${bd?` · বিল্ড <b>${bd}</b>`:''}</div>
  <p style="color:var(--m);font-size:13px;margin:6px 0 10px">GitHub এ নতুন ফাইল দেওয়ার পর এখানে চাপলে নতুন ভার্সন খুঁজে নামাবে। আনইনস্টল করার দরকার নেই, আপনার হিসাব ঠিক থাকবে।</p>
  <div class="row" style="align-items:center;gap:10px"><button class="btn" id="updchk" type="button">আপডেট চেক করুন</button><span id="updmsg" style="font-size:13px"></span></div>`;
  main.appendChild(c);$('#updchk').onclick=checkUpdate;
}
{const _go=go;go=function(){const r=_go.apply(this,arguments);try{if(CUR.r==='settings')addUpdCard()}catch(e){}return r}}

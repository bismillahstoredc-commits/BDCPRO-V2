'use strict';
/* ========== দোকানের নামের ফন্ট ডিজাইন (প্রোফাইল → ফন্ট বাছুন, রঙ, বোল্ড) ========== */
const NF=[
 {k:'def',n:'ডিফল্ট',f:"'Hind Siliguri',sans-serif",g:''},
 {k:'galada',n:'গালাদা (স্টাইলিশ বাংলা)',f:"'Galada',cursive",g:'Galada'},
 {k:'baloo',n:'বালু (গোল ও মোটা)',f:"'Baloo Da 2',sans-serif",g:'Baloo+Da+2:wght@700'},
 {k:'atma',n:'আত্মা (খেলাচ্ছলে)',f:"'Atma',cursive",g:'Atma:wght@600'},
 {k:'mina',n:'মীনা (মার্জিত)',f:"'Mina',sans-serif",g:'Mina:wght@700'},
 {k:'tiro',n:'তিরো বাংলা (ক্লাসিক)',f:"'Tiro Bangla',serif",g:'Tiro+Bangla'},
 {k:'nserif',n:'নোটো সেরিফ (আনুষ্ঠানিক)',f:"'Noto Serif Bengali',serif",g:'Noto+Serif+Bengali:wght@700'},
 {k:'nsans',n:'নোটো সান্স (পরিচ্ছন্ন)',f:"'Noto Sans Bengali',sans-serif",g:'Noto+Sans+Bengali:wght@700'},
 {k:'anek',n:'আনেক বাংলা (আধুনিক)',f:"'Anek Bangla',sans-serif",g:'Anek+Bangla:wght@700'},
 {k:'gv',n:'Great Vibes (সিগনেচার, ইংরেজি)',f:"'Great Vibes',cursive",g:'Great+Vibes'},
 {k:'paci',n:'Pacifico (হাতের লেখা, ইংরেজি)',f:"'Pacifico',cursive",g:'Pacifico'},
 {k:'lob',n:'Lobster (ব্র্যান্ড স্টাইল, ইংরেজি)',f:"'Lobster',cursive",g:'Lobster'},
 {k:'play',n:'Playfair (রাজকীয়, ইংরেজি)',f:"'Playfair Display',serif",g:'Playfair+Display:wght@700'},
 {k:'cinzel',n:'Cinzel (ক্ল্যাসিক ক্যাপিটাল, ইংরেজি)',f:"'Cinzel',serif",g:'Cinzel:wght@700'},
 {k:'osw',n:'Oswald (শক্ত ও সরু, ইংরেজি)',f:"'Oswald',sans-serif",g:'Oswald:wght@600'}
];
const nfOf=b=>NF.find(x=>x.k===(b&&b.nameFont))||NF[0];
function nfLoad(k){const f=NF.find(x=>x.k===k);if(!f||!f.g)return;const id='nf_'+k;if(document.getElementById(id))return;const l=document.createElement('link');l.id=id;l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family='+f.g+'&display=swap';document.head.appendChild(l)}
const nfCss=(b,withColor)=>{const f=nfOf(b);return `font-family:${f.f},'Hind Siliguri',sans-serif;${b&&b.nameBold?'font-weight:700;':''}${withColor&&b&&b.nameColor?'color:'+b.nameColor+';':''}`};
const nfLink=b=>{const f=nfOf(b);return f.g?`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${f.g}&display=swap" media="print" onload="this.media='all'">`:''};
const shopName=b=>`<span style="${nfCss(b,true)}">${esc(b.name||'')}</span>`;          // ইনভয়েসের জন্য
const shopNameUI=b=>{nfLoad(b.nameFont);return shopName(b)};                              // স্ক্রিনের জন্য (ফন্ট লোড করে)
function applyTopName(){const b=biz(),t=$('#tbz');if(!t)return;nfLoad(b.nameFont);t.style.cssText=nfCss(b,false)}

let NFST={k:'def',color:'',bold:0};
const nfRead=()=>({nameFont:NFST.k,nameColor:NFST.color,nameBold:NFST.bold?1:0});
function nfCard(){
  return `<div class="f" style="border:1px solid var(--b);border-radius:12px;padding:12px;margin:8px 0"><label style="font-weight:700">🔤 দোকানের নামের ফন্ট ডিজাইন</label>
  <div id="nfprev" style="text-align:center;padding:14px 8px;border:1px dashed var(--b);border-radius:10px;font-size:34px;line-height:1.25;background:#fff;overflow-wrap:anywhere;min-height:48px"></div>
  <div id="nfchips" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px"></div>
  <div class="row" style="gap:14px;margin-top:10px;align-items:center;flex-wrap:wrap">
   <label style="display:flex;gap:6px;align-items:center;margin:0"><input type="color" id="nfc" value="#1f1b2e" style="width:44px;height:34px;padding:0"> নামের রঙ</label>
   <label style="display:flex;gap:6px;align-items:center;margin:0"><input type="checkbox" id="nfb" style="width:auto"> বোল্ড (মোটা)</label>
   <button class="btn o s" id="nfr" type="button">ডিফল্টে ফেরান</button></div>
  <small style="color:var(--m);display:block;margin-top:6px">নতুন ফন্ট প্রথমবার ইন্টারনেট থেকে নামে। এরপর অফলাইনেও কাজ করে। ইন্টারনেট না থাকলে সাময়িকভাবে সাধারণ ফন্টে দেখাবে। নাম বদলে "সেভ করুন" চাপলে ইনভয়েস, লগইন ও উপরের বারে প্রয়োগ হবে।</small></div>`;
}
function nfBind(b){
  NFST={k:nfOf(b).k,color:b.nameColor||'',bold:b.nameBold?1:0};
  const prev=$('#nfprev'),chips=$('#nfchips');if(!prev)return;
  const paint=()=>{
    const cur={nameFont:NFST.k,nameBold:NFST.bold,nameColor:NFST.color};
    prev.style.cssText=nfCss(cur,true)+'text-align:center;padding:14px 8px;border:1px dashed var(--b);border-radius:10px;font-size:34px;line-height:1.25;background:#fff;overflow-wrap:anywhere;min-height:48px';
    prev.textContent=($('#bn')&&$('#bn').value.trim())||'আপনার দোকানের নাম';
    chips.innerHTML=NF.map(f=>`<button type="button" class="btn s ${f.k===NFST.k?'':'o'}" data-nk="${f.k}">${f.n}</button>`).join('');
    chips.querySelectorAll('[data-nk]').forEach(x=>x.onclick=()=>{NFST.k=x.dataset.nk;nfLoad(NFST.k);paint()});
  };
  $('#nfc').value=NFST.color||'#1f1b2e';$('#nfb').checked=!!NFST.bold;
  $('#nfc').oninput=e=>{NFST.color=e.target.value;paint()};
  $('#nfb').onchange=e=>{NFST.bold=e.target.checked?1:0;paint()};
  $('#nfr').onclick=()=>{NFST={k:'def',color:'',bold:0};$('#nfc').value='#1f1b2e';$('#nfb').checked=false;paint()};
  if($('#bn'))$('#bn').addEventListener('input',paint);
  nfLoad(NFST.k);paint();
}

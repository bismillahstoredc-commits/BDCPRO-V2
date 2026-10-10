'use strict';
/* ========== ইনভয়েস ডিজাইন ও ভিউয়ার ========== */
const DESIGNS=[['t80','থার্মাল ৮০মিমি'],['t58','থার্মাল ৫৮মিমি'],['t80m','থার্মাল ৮০ — আধুনিক'],['a4m','A4 — আধুনিক (পার্পল)'],['a4','A4 — ফরমাল'],['a4c','A4 — ক্লাসিক বর্ডার'],['a4s','A4 — সিম্পল'],['a5m','A5 — আধুনিক'],['a5','A5 — ফরমাল']];
const DW={t80:76,t58:54,t80m:76,a4:190,a4m:190,a4c:190,a4s:190,a5:134,a5m:134};
const fmt=n=>r2(n).toLocaleString('en-US');
function invData(d){
  const b=biz(),p=d.partyId?S.parties.get(d.partyId):null,t=TYPES[d.type],X=idx();
  const isTx=d.type==='sale'||d.type==='purchase';
  const pcv=d.payCash!==undefined?num(d.payCash):(d.method==='bank'?0:num(d.paid)),pbv=d.payBank!==undefined?num(d.payBank):(d.method==='bank'?num(d.paid):0);
  const dueNow=t.money?docDue(d):0,pd=p?dueOf(p):0;
  const rows=(d.items||[]).map((i,n)=>{const pr=S.products.get(i.pid);return{n:n+1,name:i.name,qty:r2(i.qty),unit:pr&&pr.unit?pr.unit:'',price:(t.price||d.type==='free')?num(i.price):null,amt:num(i.qty)*num(i.price)}});
  return{b,p,t,d,isTx,pcv,pbv,dueNow,pd,prev:(p&&isTx)?r2(pd-dueNow):0,laterList:isTx?(X.exl[d.id]||[]):[],rows,free:d.type==='free',fi:(d.freeItems||[]).filter(x=>num(x.qty)>0),logo:b.logo||LOGO_URI,
    title:t.l+(t.order?'':' ইনভয়েস'),partyLabel:p?(p.type==='supplier'?'সাপ্লায়ার':'কাস্টমার'):'',words:d.type==='free'?'':takaWords(d.total)};
}
function invSumRows(v){
  const d=v.d,t=v.t,R=[];if(v.free)return R;
  R.push(['সাবটোটাল',fmt(d.sub),'']);
  if(num(d.disc))R.push(['ছাড়'+(d.discMode==='pct'?' ('+r2(d.discVal)+'%)':''),'- '+fmt(d.disc),'']);
  R.push([t.order?'আনুমানিক মোট':'সর্বমোট',fmt(d.total),'big']);
  if(t.money){
    if(v.pcv>0)R.push(['পরিশোধ (ক্যাশ)',fmt(v.pcv),'']);
    if(v.pbv>0)R.push(['পরিশোধ (ব্যাংক)',fmt(v.pbv),'']);
    if(v.pcv<=0&&v.pbv<=0)R.push(['পরিশোধ','0','']);
    v.laterList.forEach(l=>R.push([(d.type==='sale'?'পরে আদায়':'পরে পরিশোধ')+' ('+l.date+')',fmt(l.amount),'g']));
    R.push(['এই ইনভয়েসে বকেয়া',fmt(v.dueNow),v.dueNow>0.001?'r':'g']);
    if(v.p){if(v.prev>0.001)R.push(['আগের বকেয়া',fmt(v.prev),'']);R.push(['মোট বর্তমান বকেয়া',fmt(v.pd),'b'])}
  }
  return R;
}
const sumTbl=(R,cls)=>R.length?`<table class="sm ${cls||''}">${R.map(r=>`<tr class="${r[2]}"><td>${r[0]}</td><td class="n">${r[1]}</td></tr>`).join('')}</table>`:'';
const itemRows=(v,cols)=>v.rows.map(r=>`<tr><td>${r.n}</td><td>${esc(r.name)}</td><td class="n">${r.qty}${r.unit?' '+esc(r.unit):''}</td><td class="n">${r.price==null?'-':fmt(r.price)}</td><td class="n">${fmt(r.amt)}</td></tr>`).join('');
const itemHead=()=>`<thead><tr><th>#</th><th>বিবরণ</th><th class="n">পরিমাণ</th><th class="n">দর</th><th class="n">টাকা</th></tr></thead>`;
const partyBlock=v=>v.p?`<b>${esc(v.p.name)}</b>${v.p.phone?'<br>মোবাইল: '+esc(v.p.phone):''}${v.p.address?'<br>'+esc(v.p.address):''}`:'ওয়াক-ইন কাস্টমার';
const shopBlock=v=>`<b>${esc(v.b.name||'')}</b>${v.b.address?'<br>'+esc(v.b.address):''}${v.b.phone?'<br>মোবাইল: '+esc(v.b.phone):''}`;
const statusBadge=v=>!v.t.money||v.free?'':(v.dueNow>0.001?'<span class="stamp red">বকেয়া</span>':'<span class="stamp grn">পরিশোধিত</span>');
const noteBlock=v=>v.d.note?`<div class="note">নোট: ${esc(v.d.note)}</div>`:'';
const footBlock=v=>`<div class="ft">${esc(v.b.footer||'ধন্যবাদ')}</div>`;
const SIGF="'Great Vibes','Dancing Script','Segoe Script','Lucida Handwriting','Brush Script MT','Snell Roundhand','Apple Chancery',cursive";
const sellerSign=b=>b.sigOff?'':(b.sigImg?`<img class="sgi" src="${b.sigImg}">`:`<span class="sgf" style="font-size:${(b.sigText||'Bismillah Distribution Center').length>18?21:28}px">${esc(b.sigText||'Bismillah Distribution Center')}</span>`);
const sigBlock=v=>`<div class="sg"><span>গ্রহীতার স্বাক্ষর</span><span class="sv">${sellerSign(v.b)}<i>বিক্রেতার স্বাক্ষর</i></span></div>`;
const sigThermal=v=>v.b.sigOff?'':`<div class="c" style="margin-top:8px">${sellerSign(v.b)}<div style="font-size:9px;border-top:1px solid #000;display:inline-block;padding-top:1px;min-width:60%">বিক্রেতার স্বাক্ষর</div></div>`;
const freeNote=v=>(v.fi&&v.fi.length?`<div class="fr">🎁 ফ্রি আইটেম (মূল্য নেওয়া হয়নি): ${v.fi.map(x=>esc(x.name)+' × '+r2(x.qty)+(x.unit?' '+esc(x.unit):'')).join(', ')}</div>`:'')+(v.free?`<div class="fr">ফ্রি আইটেম — মূল্য নেওয়া হয়নি</div>`:'');
const wordsLine=v=>v.words?`<div class="wd">কথায়: ${v.words}</div>`:'';

const BASE=`*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}body{font-family:'Hind Siliguri','Noto Sans Bengali',Arial,sans-serif;margin:0 auto;color:#111}table{width:100%;border-collapse:collapse}.n{text-align:right}.c{text-align:center}.ft{text-align:center;margin-top:10px}.note{margin-top:6px}.sm td{padding:3px 4px}.sm tr.big td{font-weight:700}.sm tr.b td{font-weight:700}.sm tr.r td:last-child{color:#b91c1c;font-weight:700}.sm tr.g td:last-child{color:#166534}.wd{margin-top:8px;font-style:italic}.fr{text-align:center;font-weight:700;margin:8px 0}.stamp{display:inline-block;border:2px solid;border-radius:6px;padding:1px 10px;font-weight:700;transform:rotate(-6deg)}.stamp.red{color:#b91c1c}.stamp.grn{color:#166534}.sgf{font-family:${SIGF};font-size:28px;color:#1e3a8a;display:inline-block;transform:rotate(-3deg);line-height:1.1}.sg .sgf,.sg .sgi{border-top:0!important;padding-top:0!important;min-width:0!important}.sgi{max-height:46px;max-width:170px;object-fit:contain}.sg span.sv{display:inline-flex;flex-direction:column;align-items:center;justify-content:flex-end;border-top:0!important;padding-top:0!important}.sg span.sv i{font-style:normal;border-top:1px solid #000;padding-top:3px;min-width:150px;text-align:center;display:block}`;
function wrapDoc(v,design,css,body){
  const th=design[0]==='t',pg=design[0]==='a'&&design[1]==='4'?'A4':design[0]==='a'?'A5':DW[design]+'mm auto';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(v.d.no)}</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" media="print" onload="this.media='all'"><style>${BASE}@page{size:${pg};margin:${th?'2mm':'10mm'}}body{width:${DW[design]}mm}${css}</style></head><body>${body}</body></html>`;
}
/* ---- থার্মাল (সাদামাটা) ---- */
function tplThermal(v,design){
  const fs=design==='t58'?10:11;
  const css=`body{font-size:${fs}px}h2{margin:2px 0;font-size:${fs+5}px}img.lg{height:38px}th,td{padding:3px 2px;border-bottom:1px dashed #555;text-align:left}th.n,td.n{text-align:right}.tt{font-weight:700;text-align:center;margin:6px 0}.sm td{border:0}.sm tr.big td{border-top:1px solid #000;border-bottom:1px solid #000}`;
  const body=`<div class="c"><img class="lg" src="${v.logo}"><h2>${esc(v.b.name||'')}</h2>${esc(v.b.address||'')}${v.b.phone?'<br>মোবাইল: '+esc(v.b.phone):''}</div>
  <div class="tt">${v.title}</div><div>নং: <b>${esc(v.d.no)}</b> &nbsp; তারিখ: ${v.d.date}</div>${v.p?`<div>${v.partyLabel}: <b>${esc(v.p.name)}</b>${v.p.phone?' ('+esc(v.p.phone)+')':''}</div>`:''}
  <table style="margin-top:6px">${itemHead()}<tbody>${itemRows(v)}</tbody></table>${freeNote(v)}${sumTbl(invSumRows(v))}${noteBlock(v)}${sigThermal(v)}${footBlock(v)}`;
  return wrapDoc(v,design,css,body);
}
/* ---- থার্মাল আধুনিক: বড় মোট, প্রতি পণ্য দুই লাইনে ---- */
function tplThermalM(v,design){
  const css=`body{font-size:11px}img.lg{height:44px}h2{margin:3px 0;font-size:17px}.it{border-bottom:1px dashed #777;padding:4px 0}.it b{display:block}.it div{display:flex;justify-content:space-between}.tot{background:#000;color:#fff;border-radius:6px;padding:6px 8px;margin:8px 0;display:flex;justify-content:space-between;font-size:16px;font-weight:700}.mt{display:flex;justify-content:space-between;font-size:10px;margin:4px 0}.sm td{border:0}.sm tr.big{display:none}hr{border:0;border-top:2px solid #000;margin:6px 0}`;
  const body=`<div class="c"><img class="lg" src="${v.logo}"><h2>${esc(v.b.name||'')}</h2>${esc(v.b.address||'')}${v.b.phone?'<br>মোবাইল: '+esc(v.b.phone):''}<hr><b>${v.title}</b> ${statusBadge(v)}</div>
  <div class="mt"><span>নং: ${esc(v.d.no)}</span><span>${v.d.date}</span></div>${v.p?`<div class="mt"><span>${v.partyLabel}: <b>${esc(v.p.name)}</b></span><span>${esc(v.p.phone||'')}</span></div>`:''}<hr>
  ${v.rows.map(r=>`<div class="it"><b>${r.n}. ${esc(r.name)}</b><div><span>${r.qty}${r.unit?' '+esc(r.unit):''} × ${r.price==null?'-':fmt(r.price)}</span><span>${fmt(r.amt)}</span></div></div>`).join('')}
  ${freeNote(v)}${v.free?'':`<div class="tot"><span>সর্বমোট</span><span>৳ ${fmt(v.d.total)}</span></div>`}${sumTbl(invSumRows(v))}${noteBlock(v)}${sigThermal(v)}${footBlock(v)}`;
  return wrapDoc(v,design,css,body);
}
/* ---- ফরমাল (A4/A5) ---- */
function tplFormal(v,design){
  const fs=design==='a5'?12:13;
  const css=`body{font-size:${fs}px}h2{margin:2px 0;font-size:${fs+5}px}.hd{display:flex;align-items:center;gap:14px;border-bottom:3px solid #6c2bd9;padding-bottom:8px;margin-bottom:8px}img.lg{height:64px}th,td{padding:4px 5px;border:1px solid #999;text-align:left}th{background:#eee}th.n,td.n{text-align:right}.tt{font-weight:700;text-align:center;margin:6px 0;font-size:${fs+3}px;letter-spacing:1px}.sg{display:flex;justify-content:space-between;margin-top:50px}.sg span{border-top:1px solid #000;padding-top:3px;min-width:150px;text-align:center}.sm{width:55%;margin-left:auto;margin-top:6px}.sm td{border:1px solid #999}`;
  const body=`<div class="hd"><img class="lg" src="${v.logo}"><div>${shopBlock(v).replace('<b>','<h2>').replace('</b>','</h2>')}</div></div><div class="tt">${v.title}</div>
  <div>নং: <b>${esc(v.d.no)}</b> &nbsp; তারিখ: ${v.d.date}</div>${v.p?`<div>${v.partyLabel}: ${partyBlock(v)}</div>`:''}
  <table style="margin-top:6px">${itemHead()}<tbody>${itemRows(v)}</tbody></table>${freeNote(v)}${sumTbl(invSumRows(v))}${wordsLine(v)}${noteBlock(v)}${sigBlock(v)}${footBlock(v)}`;
  return wrapDoc(v,design,css,body);
}
/* ---- আধুনিক পার্পল (হিসাবপাতি ধাঁচ) ---- */
function tplModern(v,design){
  const s=design==='a5m',fs=s?11.5:13;
  const css=`body{font-size:${fs}px}.ban{background:linear-gradient(135deg,#6c2bd9,#4b1c9c);color:#fff;padding:${s?10:14}px 16px;border-radius:12px;display:flex;justify-content:space-between;align-items:center;gap:10px}.ban img{height:${s?42:58}px;width:${s?42:58}px;background:#fff;border-radius:50%;padding:2px;object-fit:contain}.ban .l{display:flex;align-items:center;gap:10px}.ban h1{margin:0;font-size:${s?16:21}px}.ban small{opacity:.92;display:block}.ban .r{text-align:right}.ban .r b{font-size:${s?15:19}px;letter-spacing:1px}.cards{display:flex;gap:10px;margin:12px 0}.cd{flex:1;border:1px solid #e4dcf5;background:#faf7ff;border-radius:10px;padding:8px 10px}.cd h4{margin:0 0 4px;color:#6c2bd9;font-size:${fs-1}px;text-transform:uppercase}table.it th{background:#6c2bd9;color:#fff;padding:7px 6px;text-align:left}table.it th.n{text-align:right}table.it td{padding:6px;border-bottom:1px solid #eee}table.it tr:nth-child(even) td{background:#faf7ff}.bot{display:flex;gap:14px;margin-top:12px;align-items:flex-start;justify-content:space-between}.bot .l{flex:1;padding-top:6px}.sm{width:${s?'55%':'270px'};border:1px solid #e4dcf5;border-radius:10px;overflow:hidden}.sm td{padding:5px 10px;border-bottom:1px solid #f0eaff}.sm tr.big td{background:#6c2bd9;color:#fff;font-size:${fs+2}px}.sm tr.b td{background:#f3ecff}.stamp{font-size:${fs+3}px}.sg{display:flex;justify-content:space-between;margin-top:${s?30:46}px}.sg span{border-top:1px solid #6c2bd9;padding-top:3px;min-width:140px;text-align:center;color:#4b1c9c}.ft{background:#f3ecff;color:#4b1c9c;border-radius:8px;padding:6px;font-weight:600}`;
  const body=`<div class="ban"><div class="l"><img src="${v.logo}"><div><h1>${esc(v.b.name||'')}</h1><small>${esc(v.b.address||'')}${v.b.phone?' • '+esc(v.b.phone):''}</small></div></div><div class="r"><b>${v.title}</b><small># ${esc(v.d.no)}</small><small>${v.d.date}</small></div></div>
  <div class="cards"><div class="cd"><h4>${v.p?v.partyLabel:'কাস্টমার'}</h4>${partyBlock(v)}</div><div class="cd" style="flex:.6;text-align:center;display:flex;align-items:center;justify-content:center">${statusBadge(v)||'<b>'+v.t.l+'</b>'}</div></div>
  <table class="it">${itemHead()}<tbody>${itemRows(v)}</tbody></table>${freeNote(v)}
  <div class="bot"><div class="l">${wordsLine(v)}${noteBlock(v)}</div>${sumTbl(invSumRows(v))}</div>${sigBlock(v)}<div style="margin-top:10px">${footBlock(v)}</div>`;
  return wrapDoc(v,design,css,body);
}
/* ---- ক্লাসিক বর্ডার ---- */
function tplClassic(v,design){
  const css=`body{font-size:13px}.box{border:3px double #222;padding:12px 14px}.hd{text-align:center;border-bottom:2px solid #222;padding-bottom:8px}.hd img{height:60px}.hd h2{margin:2px 0;font-size:24px}.tt{display:table;margin:10px auto;border:2px solid #222;padding:2px 22px;font-weight:700;font-size:16px;letter-spacing:1px}.meta{display:flex;border:1px solid #222}.meta>div{flex:1;padding:6px 8px}.meta>div+div{border-left:1px solid #222}th,td{padding:5px 6px;border:1px solid #222;text-align:left}th{background:#ddd}th.n,td.n{text-align:right}.sm{width:55%;margin-left:auto;margin-top:-1px}.sm td{border:1px solid #222}.sg{display:flex;justify-content:space-between;margin-top:56px}.sg span{border-top:1px dotted #000;padding-top:3px;min-width:150px;text-align:center}`;
  const body=`<div class="box"><div class="hd"><img src="${v.logo}"><h2>${esc(v.b.name||'')}</h2>${esc(v.b.address||'')}${v.b.phone?' | মোবাইল: '+esc(v.b.phone):''}</div><div class="tt">${v.title}</div>
  <div class="meta"><div>${v.p?v.partyLabel+':<br>'+partyBlock(v):'ওয়াক-ইন কাস্টমার'}</div><div>নং: <b>${esc(v.d.no)}</b><br>তারিখ: ${v.d.date}</div></div>
  <table style="margin-top:8px">${itemHead()}<tbody>${itemRows(v)}</tbody></table>${freeNote(v)}${sumTbl(invSumRows(v))}${wordsLine(v)}${noteBlock(v)}${sigBlock(v)}${footBlock(v)}</div>`;
  return wrapDoc(v,design,css,body);
}
/* ---- সিম্পল/মিনিমাল ---- */
function tplSimple(v,design){
  const css=`body{font-size:13px}.top{display:flex;justify-content:space-between;align-items:flex-start}.top img{height:54px}.top h1{margin:0 0 4px;font-size:30px;font-weight:300;letter-spacing:2px;color:#444}.top .r{text-align:right;color:#555}.two{display:flex;justify-content:space-between;margin:18px 0 10px;color:#333}.two small{color:#888;display:block;text-transform:uppercase;font-size:10px}th{font-size:11px;color:#777;text-transform:uppercase;border-bottom:2px solid #333;padding:6px 4px;text-align:left}th.n{text-align:right}td{padding:7px 4px;border-bottom:1px solid #ddd}.sm{width:50%;margin-left:auto;margin-top:8px}.sm td{border:0;padding:3px 4px}.sm tr.big td{border-top:2px solid #333;font-size:16px}.sg{display:flex;justify-content:space-between;margin-top:50px}.sg span{border-top:1px solid #999;padding-top:3px;min-width:150px;text-align:center;color:#666}.ft{color:#888;border-top:1px solid #ddd;padding-top:8px}`;
  const body=`<div class="top"><div><h1>${v.title}</h1><div># ${esc(v.d.no)}<br>${v.d.date} ${statusBadge(v)}</div></div><div class="r"><img src="${v.logo}"><br>${shopBlock(v)}</div></div>
  <div class="two"><div><small>${v.p?v.partyLabel:'কাস্টমার'}</small>${partyBlock(v)}</div></div>
  <table>${itemHead()}<tbody>${itemRows(v)}</tbody></table>${freeNote(v)}${sumTbl(invSumRows(v))}${wordsLine(v)}${noteBlock(v)}${sigBlock(v)}${footBlock(v)}`;
  return wrapDoc(v,design,css,body);
}
function invoiceHTML(d,design){
  if(!DW[design])design='t80';const v=invData(d);
  return({t80:tplThermal,t58:tplThermal,t80m:tplThermalM,a4:tplFormal,a5:tplFormal,a4m:tplModern,a5m:tplModern,a4c:tplClassic,a4s:tplSimple}[design])(v,design);
}
const curDesign=()=>{const s=localStorage.getItem('bdcpro_vdesign');return DW[s]?s:(DW[biz().design]?biz().design:'t80')};
const printDoc=(d,design)=>printHTML(invoiceHTML(d,design||biz().design||'t80'));

/* ========== ইনভয়েস ভিউয়ার (← ফিরে যান / ✕ বন্ধ সহ) ========== */
function viewDoc(id){
  const d=S.docs.get(id);if(!d||d.del)return;const t=TYPES[d.type];
  const p=d.partyId?S.parties.get(d.partyId):null;
  const canPay=!!(t.money&&p&&(d.type==='sale'||d.type==='purchase')&&docDue(d)>0.001);
  modal(d.no,`<div id="vwrap" style="overflow:hidden;background:#eee;border-radius:8px;border:1px solid var(--b)"><iframe id="vf" style="border:0;background:#fff;display:block;transform-origin:top left"></iframe></div>
  <div class="vbar"><div class="row"><select id="vd" style="width:auto;flex:1;min-width:150px">${DESIGNS.map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}</select><button class="btn" id="vp">🖨 প্রিন্ট</button></div>
  <div class="row" style="margin-top:6px"><button class="btn o" id="ve">✏️ এডিট</button>${canPay?`<button class="btn gr" id="vpay">💰 ${d.type==='sale'?'বকেয়া আদায়':'বকেয়া পরিশোধ'}</button>`:''}${t.order&&d.status!=='done'?'<button class="btn gr" id="vc">ইনভয়েসে রূপান্তর</button>':''}${isOwner()?'<button class="btn d" id="vx">ডিলিট</button>':''}<button class="btn o" id="vb" style="margin-left:auto">← ফিরে যান</button></div></div>`,()=>{
    const sel=$('#vd'),f=$('#vf'),w=$('#vwrap');sel.value=curDesign();
    const fit=()=>{const pw=Math.round(DW[sel.value]*3.7795+30),sc=Math.min(1,(w.clientWidth||pw)/pw);f.style.width=pw+'px';f.style.transform=`scale(${sc})`;
      try{const h=f.contentDocument.documentElement.scrollHeight;f.style.height=h+'px';w.style.height=Math.ceil(h*sc)+'px'}catch(e){}};
    const draw=()=>{f.onload=()=>{fit();try{new ResizeObserver(fit).observe(f.contentDocument.documentElement)}catch(e){}};
      try{f.srcdoc=invoiceHTML(S.docs.get(id),sel.value).replace('</head>','<style>body{padding:8px 12px}</style></head>')}catch(e){console.error(e);w.style.height='auto';w.innerHTML='<div class="empty" style="padding:20px">⚠ ইনভয়েস দেখাতে সমস্যা: '+esc(e.message)+'</div>';return}
      fit();[150,500,1200,2500].forEach(t=>setTimeout(fit,t))};
    sel.onchange=()=>{localStorage.setItem('bdcpro_vdesign',sel.value);draw()};draw();
    $('#vp').onclick=()=>printDoc(S.docs.get(id),sel.value);
    $('#vb').onclick=()=>closeModal();
    $('#ve').onclick=()=>{closeModal();go('pos',{type:d.type,pre:d})};
    if($('#vpay'))$('#vpay').onclick=()=>payForm(p,S.docs.get(id));
    if($('#vc'))$('#vc').onclick=()=>{closeModal();const ty=d.type==='sale_order'?'sale':'purchase';POS=null;go('pos',{type:ty,pre:{fromOrder:d.id,partyId:d.partyId,items:d.items,note:d.note}})};
    if($('#vx'))$('#vx').onclick=async()=>{if(!confirm('ইনভয়েসটি ডিলিট করবেন? স্টক ও হিসাব স্বয়ংক্রিয়ভাবে ঠিক হয়ে যাবে।'))return;await remove('docs',d);MDIRTY=true;closeModal();toast('ডিলিট হয়েছে')};
  },true);
}

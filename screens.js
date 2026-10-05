'use strict';
/* ========== menu & router ========== */
const MENU=[
 ['প্রধান'],['dash','🏠','ড্যাশবোর্ড'],
 ['বিক্রয়'],['pos:sale','🛒','নতুন বিক্রয়'],['pos:sale_order','📝','বিক্রয় অর্ডার'],['pos:sale_return','↩️','বিক্রয় ফেরত'],['pos:free','🎁','ফ্রি আইটেম'],
 ['ক্রয়'],['pos:purchase','📥','নতুন ক্রয়'],['pos:purchase_order','📝','ক্রয় অর্ডার'],['pos:purchase_return','↩️','ক্রয় ফেরত'],
 ['হিসাব'],['invoices','🧾','ইনভয়েস তালিকা'],['due','💳','দেনা-পাওনা'],['expense','💸','খরচ'],['cash','🏦','ক্যাশ ও ব্যাংক'],
 ['পণ্য'],['products','📦','পণ্যসমূহ'],['categories','🗂️','ক্যাটাগরি'],['units','📏','একক'],['তালিকা'],['parties','👥','পার্টি (কাস্টমার/সাপ্লায়ার)'],
 ['রিপোর্ট'],['reports','📊','রিপোর্ট'],
 ['ইউটিলিটি'],['reset','🔧','অ্যাকাউন্ট রিসেট','owner'],
['সেটিংস'],['settings','⚙️','সেটিংস','owner']
];
let CUR={r:'dash',a:null};
function buildMenu(){
  $('#drawer').innerHTML=`<div class="dh"><img src="${LOGO_URI}" alt=""><div><b>${esc(ME.name)}</b><small>${ME.role==='owner'?'মালিক':'স্টাফ'}</small></div></div>`+`<div class="mi" data-r="profiles" style="background:var(--pll)"><span>🏢</span><div style="line-height:1.25"><b>${esc(biz().name||'প্রোফাইল')}</b><br><small style="color:var(--m)">প্রোফাইল পরিবর্তন / নতুন যোগ</small></div></div>`+
   MENU.map(m=>m.length===1?`<div class="ms">${m[0]}</div>`:(m[3]==='owner'&&!isOwner()?'':`<div class="mi" data-r="${m[0]}"><span>${m[1]}</span>${m[2]}</div>`)).join('')+
   `<div class="mi" id="inst" data-r="install" style="display:none"><span>📲</span>অ্যাপ ইনস্টল করুন</div><div class="mi" data-r="logout"><span>🚪</span>লগআউট</div>`+`<div class="brandft"><span class="sgf">Bismillah Distribution Center</span><small>BDC-PRO-V-2.0</small></div>`;
  if(window.refreshInstall)refreshInstall();
}
function go(r,a){
  if(r==='install'){installApp();return}
  if(r==='profiles'){closeDrawer();profilesModal();return}
  if(r==='logout'){localStorage.removeItem(UIDK);ME=null;POS=null;location.reload();return}
  if(r.startsWith('pos:')){a=Object.assign({type:r.slice(4)},a||{});r='pos'}
  CUR={r,a};closeDrawer();
  $$('.mi').forEach(e=>e.classList.toggle('on',e.dataset.r===r||e.dataset.r==='pos:'+(a&&a.type)&&r==='pos'));
  $('#main').scrollTop=0;
  try{(SCR[r]||SCR.dash)(a)}catch(e){console.error(e);$('#main').innerHTML='<div class="empty">ত্রুটি: '+esc(e.message)+'</div>'}
}
function closeDrawer(){$('#drawer').classList.remove('open');$('#ov').classList.remove('show')}
const view=h=>{$('#main').innerHTML=h};
const tblc=(cols,rows,foot)=>{const al=cols.map(c=>c[0]==='>');
 return `<div class="tw"><table><thead><tr>${cols.map((c,i)=>`<th class="${al[i]?'n':''}">${esc(al[i]?c.slice(1):c)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr>${r.map((c,i)=>`<td class="${al[i]?'n':''}">${c}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${cols.length}" class="empty">কোনো তথ্য নেই</td></tr>`}${foot&&rows.length?`<tr class="tot">${foot.map((c,i)=>`<td class="${al[i]?'n':''}">${c}</td>`).join('')}</tr>`:''}</tbody></table></div>`};
const partyName=id=>{const p=id&&S.parties.get(id);return p?esc(p.name):'ওয়াক-ইন'};
const byDateDesc=(a,b)=>(a.date<b.date?1:a.date>b.date?-1:num(b.createdAt||b.updatedAt)-num(a.createdAt||a.updatedAt));

/* ========== dashboard ========== */
const SCR={};
const DASH={hide:localStorage.getItem('bdcDashHide')==='1'};
SCR.dash=()=>{
  const X=idx(),t=today();let sale=0,pur=0,exp=0,n=0,gp=0;const days={};
  for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);days[d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())]=0}
  S.docs.forEach(d=>{if(d.del)return;const ic=d.items?d.items.reduce((a,i)=>a+num(i.qty)*num(i.cost),0):0;if(d.type==='sale'){if(d.date===t){sale+=num(d.total);n++;gp+=num(d.total)-ic}if(d.date in days)days[d.date]+=num(d.total)}if(d.type==='sale_return'&&d.date===t)gp-=num(d.total)-ic;if(d.type==='free'&&d.date===t)gp-=ic;if(d.type==='purchase'&&d.date===t)pur+=num(d.total)});
  S.money.forEach(m=>{if(!m.del&&m.kind==='expense'&&m.date===t)exp+=num(m.amount)});
  let recv=0,pay=0;S.parties.forEach(p=>{if(p.del)return;const d=dueOf(p);if(p.type==='supplier')pay+=d;else recv+=d});
  let sv=0,low=0,xp=0,xs=0;S.products.forEach(p=>{if(p.del)return;const s=stockOf(p.id);const xd=expDays(p);if(s>0&&xd!==null){if(xd<0)xp++;else if(xd<=30)xs++}sv+=Math.max(s,0)*num(p.buyPrice);if(num(p.low)>0&&s<=num(p.low))low++});
  const recent=live('docs').sort(byDateDesc).slice(0,6);const mx=Math.max(1,...Object.values(days));
  const H=v=>DASH.hide?'••••':v,net=r2(gp-exp);
  const OWN=isOwner();
  view(`${OWN?`<div class="hero"><div class="hd"><span>মোট ব্যালেন্স</span><span class="eye" id="dh_eye">${DASH.hide?'🙈':'👁'}</span></div>
  <div class="amt">${H(money(X.cash+X.bank))}</div>
  <div class="sub"><span>ক্যাশ ${H(money(X.cash))}</span><span>ব্যাংক ${H(money(X.bank))}</span></div>
  <div class="inner"><div><small>আজকের বিক্রি</small><div>${H(money(sale))}</div></div><div class="r"><small>নিট মুনাফা (খরচ বাদে)</small><div>${H(money(net))}</div></div></div>
  <div class="detail">মোট মুনাফা ${H(money(gp))} − খরচ ${H(money(exp))}</div></div>
  `:''}<div class="grid g4"><div class="stat g"><small>আজকের বিক্রয় (${n}টি)</small><div>${money(sale)}</div></div><div class="stat o"><small>আজকের ক্রয়</small><div>${money(pur)}</div></div><div class="stat r"><small>আজকের খরচ</small><div>${money(exp)}</div></div><div class="stat"><small>স্টক মূল্য</small><div>${money(sv)}</div></div></div>
  <div class="grid g4" style="margin-top:10px">${OWN?`<div class="stat g"><small>ক্যাশ ব্যালেন্স</small><div>${money(X.cash)}</div></div><div class="stat"><small>ব্যাংক ব্যালেন্স</small><div>${money(X.bank)}</div></div><div class="stat o"><small>উত্তোলনযোগ্য লাভ</small><div>${money(Math.max(profitAll().avail,0))}</div></div>`:''}<div class="stat g"><small>কাস্টমারের কাছে পাওনা</small><div>${money(recv)}</div></div><div class="stat r"><small>সাপ্লায়ারকে দেনা</small><div>${money(pay)}</div></div></div>
  <div class="card" style="margin-top:12px"><h3>গত ৭ দিনের বিক্রয়</h3><div class="bars">${Object.entries(days).map(([d,v])=>`<div><i style="height:${Math.round(v/mx*80)}px"></i>${d.slice(8)}</div>`).join('')}</div></div>
  <div class="card"><h3>দ্রুত কাজ</h3><div class="row"><button class="btn" data-go="pos:sale">🛒 নতুন বিক্রয়</button><button class="btn o" data-go="pos:purchase">📥 নতুন ক্রয়</button><button class="btn o" data-go="expense">💸 খরচ</button><button class="btn o" data-go="due">💳 দেনা-পাওনা</button>${low?`<button class="btn d" data-go="products">⚠ লো-স্টক (${low})</button>`:''}${(xp||xs)?`<button class="btn d" id="exb" data-go="products">⏰ মেয়াদ: ${xp?xp+'টি শেষ':''}${xp&&xs?', ':''}${xs?xs+'টি ৩০ দিনে শেষ হবে':''}</button>`:''}</div></div>
  <div class="card"><h3>সাম্প্রতিক লেনদেন</h3>${tblc(['ইনভয়েস','তারিখ','পার্টি','>মোট'],recent.map(d=>[`<a href="#" data-view="${d.id}">${esc(d.no)}</a> <span class="bd bp">${TYPES[d.type].l}</span>`,d.date,partyName(d.partyId),money(d.total)]))}</div>`);
  if($('#exb'))$('#exb').addEventListener('click',()=>{PF=xp?'exp':'soon'},true);
  if($('#dh_eye'))$('#dh_eye').onclick=()=>{DASH.hide=!DASH.hide;localStorage.setItem('bdcDashHide',DASH.hide?'1':'0');SCR.dash()};
};

/* ========== একক ও ক্যাটাগরি তালিকা (meta-তে kind:'unit'|'cat' হিসেবে সেভ হয়) ========== */
const LK={unit:{field:'unit',l:'একক',def:['pcs']},cat:{field:'category',l:'ক্যাটাগরি',def:[]}};
function listNames(kind){
  const k=LK[kind],set=new Set();
  live('meta').filter(m=>m.kind===kind).forEach(m=>set.add(m.name));
  live('products').forEach(p=>{const n=(p[k.field]||'').trim();if(n)set.add(n)});
  if(!set.size)k.def.forEach(n=>set.add(n));
  return [...set].sort((a,b)=>a.localeCompare(b));
}
async function addListName(kind,name){
  name=(name||'').trim();if(!name)return null;
  const ex=listNames(kind).find(n=>n.toLowerCase()===name.toLowerCase());
  const has=live('meta').some(m=>m.kind===kind&&m.name===ex);
  if(ex&&has)return ex;
  if(ex&&!has){await save('meta',{id:kind+'_'+uid(),kind,name:ex});return ex}
  await save('meta',{id:kind+'_'+uid(),kind,name});return name;
}
const findByBarcode=c=>{c=String(c||'').trim();return c?live('products').find(p=>(p.barcode||'').trim()===c):null};

/* ========== product form (shared) ========== */
const expDays=p=>{if(!p||!p.expiry)return null;const a=new Date(p.expiry+'T00:00:00'),b=new Date(today()+'T00:00:00');return Math.round((a-b)/864e5)};
const expTag=p=>{const d=expDays(p);if(d===null)return '';const col=d<0?'var(--r)':d<=30?'#d97706':'var(--m)';return `<br><small style="color:${col}">মেয়াদ: ${p.expiry}${d<0?' (মেয়াদ শেষ)':d<=30?' ('+d+' দিন বাকি)':''}</small>`};
function repriceAuto(p){const b=num(p.buyPrice);if(p.rAuto&&p.rPct!==''&&p.rPct!=null)p.sellPrice=r2(b*(1+num(p.rPct)/100));if(p.wAuto&&p.wPct!==''&&p.wPct!=null)p.wsPrice=r2(b*(1+num(p.wPct)/100));return p}
function productForm(p,cb,pre){
  const opt=(kind,cur)=>{const l=listNames(kind);if(cur&&!l.includes(cur))l.push(cur);
    return (kind==='cat'?'<option value="">— নেই —</option>':'')+l.map(n=>`<option value="${esc(n)}" ${n===cur?'selected':''}>${esc(n)}</option>`).join('')};
  const ul=listNames('unit'),defU=p?.unit||(ul.includes('pcs')?'pcs':ul[0]||'pcs');
  modal(p?'পণ্য এডিট':'নতুন পণ্য',`<div class="f"><label>নাম *</label><input id="fn" value="${esc(p?.name||'')}"></div>
  <div class="f"><label>বারকোড (স্ক্যানার দিয়ে স্ক্যান করুন, ক্যামেরা ব্যবহার করুন বা টাইপ করুন)</label><div class="row" style="flex-wrap:nowrap"><input id="fbc" value="${esc(p?.barcode??pre?.barcode??'')}" placeholder="বারকোড নম্বর"><button class="btn o s" id="fscan" type="button">📷</button><button class="btn o s" id="fgen" type="button">অটো</button></div></div>
  <div class="grid g2"><div class="f"><label>ক্যাটাগরি</label><div class="row" style="flex-wrap:nowrap"><select id="fc">${opt('cat',p?.category||'')}</select><button class="btn o s" id="fcn" type="button">+</button></div></div>
  <div class="f"><label>একক</label><div class="row" style="flex-wrap:nowrap"><select id="fu">${opt('unit',defU)}</select><button class="btn o s" id="fun" type="button">+</button></div></div></div>
  <div class="grid g2"><div class="f"><label>ক্রয় মূল্য</label><input id="fb" type="number" step="any" value="${p?.buyPrice??0}"></div><div class="f"><label>মেয়াদ উত্তীর্ণের তারিখ (ঐচ্ছিক)</label><input id="fx" type="date" value="${esc(p?.expiry||'')}"></div></div>
  <div class="grid g2"><div class="f"><label>খুচরা বিক্রয় মূল্য</label><input id="fs" type="number" step="any" value="${p?.sellPrice??0}"></div><div class="f"><label>খুচরা লাভ %</label><input id="frp" type="number" step="any"></div></div>
  <label style="display:flex;gap:8px;align-items:center;font-size:13px;margin:-4px 0 10px"><input type="checkbox" id="fra" style="width:auto" ${p?.rAuto?'checked':''}> লাভ % অনুযায়ী খুচরা দাম অটো ঠিক হবে (ক্রয়মূল্য বদলালে বিক্রয়মূল্যও বদলাবে)</label>
  <div class="grid g2"><div class="f"><label>পাইকারী বিক্রয় মূল্য</label><input id="fw" type="number" step="any" value="${p?.wsPrice??0}"></div><div class="f"><label>পাইকারী লাভ %</label><input id="fwp" type="number" step="any"></div></div>
  <label style="display:flex;gap:8px;align-items:center;font-size:13px;margin:-4px 0 10px"><input type="checkbox" id="fwa" style="width:auto" ${p?.wAuto?'checked':''}> লাভ % অনুযায়ী পাইকারী দাম অটো ঠিক হবে</label>
  <div class="f"><label>পাইকারী সর্বনিম্ন পরিমাণ (Min Qty)</label><input id="fwm" type="number" step="any" value="${p?.wsMin??0}"></div>
  <small style="color:var(--m);display:block;margin:-4px 0 8px">লাভ % = (বিক্রয়মূল্য − ক্রয়মূল্য) ÷ ক্রয়মূল্য × ১০০। দাম বা % যেকোনো একটি লিখলে অন্যটি নিজে হিসাব হয়।</small>
  <small style="color:var(--m);display:block;margin:-4px 0 8px">বিক্রয়ে পরিমাণ এই সংখ্যা বা তার বেশি হলে দাম নিজে থেকে পাইকারী হয়ে যাবে। দুটোই ০ থাকলে পাইকারী দর বন্ধ।</small>
  <div class="grid g2"><div class="f"><label>${p?'বর্তমান স্টক (সংশোধন করা যাবে)':'শুরুর স্টক'}</label><input id="fq" type="number" value="${p?r2(stockOf(p.id)):0}"></div><div class="f"><label>লো-স্টক এলার্ট</label><input id="fl" type="number" value="${p?.low??0}"></div></div>
  <div class="row"><button class="btn" id="fsv">সেভ করুন</button>${p&&isOwner()?'<button class="btn d" id="fdel">ডিলিট</button>':''}</div>`,()=>{
    const fb=$('#fb'),fs=$('#fs'),frp=$('#frp'),fra=$('#fra'),fw=$('#fw'),fwp=$('#fwp'),fwa=$('#fwa');
    const pctOf=v=>{const b=num(fb.value);return b>0?r2((num(v)-b)/b*100):''},priceOf=pc=>r2(num(fb.value)*(1+num(pc)/100));
    frp.value=(p&&p.rPct!==''&&p.rPct!=null)?p.rPct:pctOf(fs.value);fwp.value=(p&&p.wPct!==''&&p.wPct!=null)?p.wPct:(num(fw.value)>0?pctOf(fw.value):'');
    fs.oninput=()=>{frp.value=pctOf(fs.value)};frp.oninput=()=>{fs.value=priceOf(frp.value)};
    fw.oninput=()=>{fwp.value=num(fw.value)>0?pctOf(fw.value):''};fwp.oninput=()=>{fw.value=fwp.value===''?0:priceOf(fwp.value)};
    fb.oninput=()=>{if(fra.checked&&frp.value!=='')fs.value=priceOf(frp.value);else frp.value=pctOf(fs.value);if(fwa.checked&&fwp.value!=='')fw.value=priceOf(fwp.value);else fwp.value=num(fw.value)>0?pctOf(fw.value):''};
    $('#fscan').onclick=()=>openScanner(c=>{$('#fbc').value=c;beep(true)},false);
    $('#fgen').onclick=()=>{$('#fbc').value=genBarcode()};
    const plus=(kind,btn,sel)=>{$(btn).onclick=async()=>{const nm=prompt('নতুন '+LK[kind].l+' — নাম লিখুন:');if(!nm)return;const n=await addListName(kind,nm);if(n)$(sel).innerHTML=opt(kind,n)}};
    plus('cat','#fcn','#fc');plus('unit','#fun','#fu');
    $('#fsv').onclick=async()=>{
      const name=$('#fn').value.trim();if(!name)return toast('নাম দিন','e');
      const bc=$('#fbc').value.trim();
      if(bc){const dup=live('products').find(x=>x.id!==(p&&p.id)&&(x.barcode||'').trim()===bc);if(dup)return toast('এই বারকোড আগে থেকেই আছে: '+dup.name,'e')}
      const ws=num($('#fw').value),wm=num($('#fwm').value);
      if((ws>0)!==(wm>0))return toast('পাইকারী মূল্য ও সর্বনিম্ন পরিমাণ দুটোই দিন (অথবা দুটোই ০ রাখুন)','e');
      const rec=p||{id:uid(),openQty:0,createdAt:Date.now()};
      const want=num($('#fq').value);
      if(p)rec.openQty=num(rec.openQty)+(want-stockOf(p.id));else rec.openQty=want;
      if($('#fra').checked&&$('#frp').value==='')return toast('খুচরা লাভ % দিন (অথবা অটো বন্ধ করুন)','e');
      if($('#fwa').checked&&$('#fwp').value==='')return toast('পাইকারী লাভ % দিন (অথবা অটো বন্ধ করুন)','e');
      Object.assign(rec,{name,barcode:bc,category:$('#fc').value.trim(),unit:$('#fu').value.trim()||'pcs',buyPrice:num($('#fb').value),sellPrice:num($('#fs').value),wsPrice:ws,wsMin:wm,low:num($('#fl').value),
        expiry:$('#fx').value||'',rPct:$('#frp').value===''?'':num($('#frp').value),rAuto:$('#fra').checked?1:0,wPct:$('#fwp').value===''?'':num($('#fwp').value),wAuto:$('#fwa').checked?1:0});
      repriceAuto(rec);
      await save('products',rec);closeModal();toast('সেভ হয়েছে','k');cb&&cb(rec);
    };
    if(p&&isOwner())$('#fdel').onclick=async()=>{if(!confirm('ডিলিট করবেন?'))return;await remove('products',p);closeModal();cb&&cb(null)};
  });
}
function partyForm(p,defType,cb){
  modal(p?'পার্টি এডিট':'নতুন পার্টি',`<div class="f"><label>নাম *</label><input id="pn" value="${esc(p?.name||'')}"></div>
  <div class="grid g2"><div class="f"><label>ধরন</label><select id="pt"><option value="customer">কাস্টমার</option><option value="supplier">সাপ্লায়ার</option></select></div><div class="f"><label>ফোন</label><input id="pp" type="tel" value="${esc(p?.phone||'')}"></div></div>
  <div class="f"><label>ঠিকানা</label><input id="pa" value="${esc(p?.address||'')}"></div>
  <div class="f"><label>শুরুর বকেয়া (কাস্টমার: আমাদের পাওনা / সাপ্লায়ার: আমাদের দেনা)</label><input id="po" type="number" value="${p?.opening??0}"></div>
  <div class="row"><button class="btn" id="psv">সেভ করুন</button>${p&&isOwner()?'<button class="btn d" id="pdel">ডিলিট</button>':''}</div>`,()=>{
    $('#pt').value=p?.type||defType||'customer';
    $('#psv').onclick=async()=>{const name=$('#pn').value.trim();if(!name)return toast('নাম দিন','e');
      const rec=p||{id:uid(),createdAt:Date.now()};
      Object.assign(rec,{name,type:$('#pt').value,phone:$('#pp').value.trim(),address:$('#pa').value.trim(),opening:num($('#po').value)});
      await save('parties',rec);closeModal();toast('সেভ হয়েছে','k');cb&&cb(rec)};
    if(p&&isOwner())$('#pdel').onclick=async()=>{if(!confirm('ডিলিট করবেন?'))return;await remove('parties',p);closeModal();cb&&cb(null)};
  });
}

/* ========== POS: sale / purchase / order / return / free ========== */
let POS=null;
const wsOn=t=>t==='sale'||t==='sale_order';
const posMatch=(p,q)=>!q||p.name.toLowerCase().includes(q)||(p.category||'').toLowerCase().includes(q)||(p.barcode||'').toLowerCase().includes(q);
function posStart(type,pre){
  POS={type,editId:pre?.id||null,fromOrder:pre?.fromOrder||null,date:pre?.date||today(),partyId:pre?.partyId||'',
   items:pre?.items?pre.items.map(i=>({pid:i.pid,name:i.name,qty:i.qty,price:i.price,cost:i.cost,manual:true})):[],
   dm:pre?.discMode||'amt',dv:pre?(pre.discMode==='pct'?num(pre.discVal):num(pre.disc)):0,
   pay:'cash',pa:'',pc:0,pb:0,note:pre?.note||'',q:''};
  if(pre&&pre.id){ // এডিটের সময় আগের পেমেন্ট ফিরিয়ে আনা
    const paid=num(pre.paid),total=num(pre.total),bank=pre.method==='bank';
    const pc=pre.payCash!==undefined?num(pre.payCash):(bank?0:paid),pb=pre.payBank!==undefined?num(pre.payBank):(bank?paid:0);
    POS.pc=pc;POS.pb=pb;
    POS.pay=(paid<=0.001&&total>0)?'due':(pb<=0.001&&Math.abs(pc-total)<0.01)?'cash':(pc<=0.001&&Math.abs(pb-total)<0.01)?'bank':'split';
    if(POS.pay==='split'&&pb<=0.001&&pc>0){POS.pay='cash';POS.pa=String(pc)}
    else if(POS.pay==='split'&&pc<=0.001&&pb>0){POS.pay='bank';POS.pa=String(pb)}
  }
}
SCR.pos=a=>{const type=a.type;if(!POS||POS.type!==type||a.pre){posStart(type,a.pre)}paintPOS()};
function paintPOS(){
  const T=TYPES[POS.type];
  const plist=live('parties').filter(p=>p.type===T.party).sort((a,b)=>a.name.localeCompare(b.name));
  view(`<div class="pos"><div class="pos-l card"><div class="row"><input id="pq" placeholder="নাম / বারকোড দিয়ে খুঁজুন..." value="${esc(POS.q)}" style="flex:1;min-width:140px"><button class="btn s" id="pscan">📷 স্ক্যান</button><button class="btn o s" id="pnew">+ নতুন পণ্য</button></div><div class="pg" id="pg"></div></div>
  <div class="pos-r card"><h3>${T.l}${POS.editId?' (এডিট)':''}</h3>
   <div class="grid g2"><div class="f"><label>তারিখ</label><input type="date" id="pd" value="${POS.date}"></div>
   <div class="f"><label>${T.party==='supplier'?'সাপ্লায়ার':'কাস্টমার'}${T.need?' *':''}</label><div class="row" style="flex-wrap:nowrap"><select id="pparty"><option value="">${T.need?'-- নির্বাচন --':'ওয়াক-ইন / কেউ না'}</option>${plist.map(p=>`<option value="${p.id}" ${p.id===POS.partyId?'selected':''}>${esc(p.name)}</option>`).join('')}</select><button class="btn o s" id="pnp">+</button></div></div></div>
   <div id="cart"></div><div class="sm" id="sm"></div>
   <div class="f"><label>নোট</label><input id="pnote" value="${esc(POS.note)}"></div>
   <div class="row"><button class="btn gr" id="psave" style="flex:1">${POS.editId?'আপডেট করুন':'সেভ করুন'}</button><button class="btn o" id="pprint">সেভ ও প্রিন্ট</button><button class="btn o" id="pclr">রিসেট</button></div></div></div>`);
  paintGrid();paintCart();
  $('#pq').oninput=e=>{POS.q=e.target.value;paintGrid()};
  $('#pq').onkeydown=e=>{if(e.key!=='Enter')return;e.preventDefault();const c=e.target.value.trim();if(!c)return;
    if(findByBarcode(c)){scanCode(c);return}
    const m=live('products').filter(p=>posMatch(p,c.toLowerCase()));
    if(m.length===1){addItem(m[0]);POS.q='';e.target.value='';paintGrid()}
    else if(!m.length){if(/^\d{6,}$/.test(c))scanCode(c);else toast('পণ্য পাওয়া যায়নি','e')}};
  $('#pscan').onclick=()=>openScanner(c=>scanCode(c,true),true);
  $('#pnew').onclick=()=>productForm(null,p=>{if(p){addItem(p);paintGrid()}});
  $('#pd').onchange=e=>POS.date=e.target.value;$('#pparty').onchange=e=>POS.partyId=e.target.value;$('#pnote').oninput=e=>POS.note=e.target.value;
  $('#pnp').onclick=()=>partyForm(null,T.party,p=>{if(p){POS.partyId=p.id;paintPOS()}});
  $('#psave').onclick=()=>posSave(false);$('#pprint').onclick=()=>posSave(true);
  $('#pclr').onclick=()=>{if(POS.items.length&&!confirm('সব মুছে ফেলবেন?'))return;const ty=POS.type;POS=null;go('pos:'+ty,{})};
  if(!matchMedia('(pointer:coarse)').matches)$('#pq').focus();
}
/* বারকোড স্ক্যান (ক্যামেরা / স্ক্যানার / টাইপ) → পণ্য কার্টে */
function scanCode(code,cam){
  if(!POS)return '';
  const p=findByBarcode(code);
  if(p){addItem(p);beep(true);POS.q='';const q=$('#pq');if(q&&q.value){q.value='';paintGrid()}
    const it=POS.items.find(i=>i.pid===p.id);return `✓ ${p.name} — পরিমাণ ${r2(it?it.qty:1)}`}
  beep(false);
  if(cam)return '✗ এই বারকোডের পণ্য নেই: '+code;
  if(confirm(`বারকোড ${code} দিয়ে কোনো পণ্য নেই। নতুন পণ্য যোগ করবেন?`))productForm(null,np=>{if(np){addItem(np);paintGrid()}},{barcode:code});
  else toast('পণ্য পাওয়া যায়নি: '+code,'e');
  return '';
}
/* হার্ডওয়্যার বারকোড স্ক্যানার (কীবোর্ডের মতো দ্রুত টাইপ + Enter) */
let SCB='',SCT=0;
document.addEventListener('keydown',e=>{
  if(!POS||CUR.r!=='pos'||modalOpen()||$('#scanov'))return;
  const t=e.target;if(t&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))return;
  const now=Date.now();
  if(e.key==='Enter'){if(SCB.length>=3){e.preventDefault();scanCode(SCB)}SCB='';return}
  if(e.key.length===1){if(now-SCT>80)SCB='';SCB+=e.key;SCT=now}
});
function updateBadges(){
  const g=$('#pg');if(!g||!POS)return;
  const q={};POS.items.forEach(i=>{q[i.pid]=(q[i.pid]||0)+num(i.qty)});
  g.querySelectorAll('[data-pid]').forEach(t=>{
    const n=q[t.dataset.pid]||0;let b=t.querySelector('.qb');
    t.classList.toggle('sel',n>0);
    if(n>0){if(!b){b=document.createElement('i');b.className='qb';t.appendChild(b)}b.textContent=r2(n)}else if(b)b.remove()});
}
function paintGrid(){
  const T=TYPES[POS.type],q=POS.q.toLowerCase();
  const rows=live('products').filter(p=>posMatch(p,q)).sort((a,b)=>a.name.localeCompare(b.name)).slice(0,80);
  $('#pg').innerHTML=rows.length?rows.map(p=>{const s=stockOf(p.id);const w=wsOn(POS.type)&&num(p.wsPrice)>0&&num(p.wsMin)>0;
    return `<div class="pt" data-pid="${p.id}"><b>${esc(p.name)}</b><span>${T.price?money(p[T.price]):'ফ্রি'}</span>${w?`<small style="color:var(--o)">পাইকারী ${money(p.wsPrice)} (${r2(p.wsMin)}+)</small>`:''}<small class="${s<=0?'low':''}">স্টক: ${r2(s)} ${esc(p.unit||'')}</small></div>`}).join(''):'<div class="empty">কোনো পণ্য নেই — "+ নতুন পণ্য" দিন</div>';
  updateBadges();
  $('#pg').onclick=e=>{const t=e.target.closest('[data-pid]');if(t)addItem(S.products.get(t.dataset.pid))};
}
function autoPrice(it){ // পরিমাণ অনুযায়ী খুচরা/পাইকারী দাম (হাতে দাম বদলালে আর বদলায় না)
  const T=TYPES[POS.type];if(!T.price||it.manual)return;
  const p=S.products.get(it.pid);if(!p)return;
  const ws=wsOn(POS.type)&&num(p.wsPrice)>0&&num(p.wsMin)>0&&num(it.qty)>=num(p.wsMin);
  it.price=ws?num(p.wsPrice):num(p[T.price]);it.ws=ws;
}
function addItem(p,qty){
  const T=TYPES[POS.type];
  if((POS.type==='sale'||POS.type==='sale_order'||POS.type==='free')&&expDays(p)!==null&&expDays(p)<0&&!POS.items.find(i=>i.pid===p.id)&&!confirm(p.name+' — মেয়াদ শেষ ('+p.expiry+')। তবুও যোগ করবেন?'))return;const ex=POS.items.find(i=>i.pid===p.id);
  if(ex){ex.qty=num(ex.qty)+(qty||1);autoPrice(ex)}
  else{const it={pid:p.id,name:p.name,qty:qty||1,price:T.price?num(p[T.price]):0,cost:num(p.buyPrice),exp:p.expiry||''};autoPrice(it);POS.items.push(it)}
  paintCart();
}
function paintCart(){
  const T=TYPES[POS.type];
  $('#cart').innerHTML=POS.items.length?`<div class="cr" style="font-size:11px;color:var(--m)"><span>পণ্য</span><span>পরিমাণ</span><span>দাম</span><span></span></div>`+POS.items.map((it,i)=>`<div class="cr"><span>${esc(it.name)} <span class="bd bo" id="wb${i}" style="${it.ws?'':'display:none'}">পাইকারী</span><br><small id="lt${i}" style="color:var(--pd)">${money(num(it.qty)*num(it.price))}</small>${POS.type==='purchase'?`<br><label style="font-size:11px;color:var(--m)">মেয়াদ <input type="date" data-i="${i}" data-f="exp" value="${esc(it.exp||'')}" style="width:130px;padding:2px 4px;font-size:12px"></label>`:''}</span><input type="number" step="any" data-i="${i}" data-f="qty" value="${it.qty}"><input type="number" step="any" data-i="${i}" data-f="price" value="${it.price}" ${T.price?'':'disabled'}><span class="x" data-x="${i}">✕</span></div>`).join(''):'<div class="empty">বাম দিক থেকে পণ্য ট্যাপ করুন বা বারকোড স্ক্যান করুন</div>';
  $('#cart').oninput=e=>{const i=e.target.dataset.i;if(i==null)return;const it=POS.items[i],f=e.target.dataset.f;if(f==='exp'){it.exp=e.target.value;return}it[f]=num(e.target.value);
    if(f==='price')it.manual=true;
    if(f==='qty'){autoPrice(it);const pi=$(`#cart input[data-i="${i}"][data-f="price"]`);if(pi&&num(pi.value)!==num(it.price))pi.value=it.price}
    $('#lt'+i).textContent=money(num(it.qty)*num(it.price));const wb=$('#wb'+i);if(wb)wb.style.display=it.ws&&!it.manual?'':'none';
    updateBadges();updateSum()};
  $('#cart').onclick=e=>{const x=e.target.dataset.x;if(x!=null){POS.items.splice(x,1);paintCart()}};
  updateBadges();paintSum();
}
function posTotals(){
  const sub=POS.items.reduce((a,i)=>a+num(i.qty)*num(i.price),0);
  let disc=POS.dm==='pct'?sub*Math.min(100,num(POS.dv))/100:num(POS.dv);disc=r2(Math.min(Math.max(disc,0),sub));
  const total=r2(sub-disc);let pc,pb;
  const pa=(POS.pa===''||POS.pa==null)?total:Math.max(0,num(POS.pa));
  const da=Math.max(0,num(POS.pa));
  if(POS.pay==='cash'){pc=pa;pb=0}else if(POS.pay==='bank'){pc=0;pb=pa}else if(POS.pay==='due'){pc=da;pb=0}else{pc=num(POS.pc);pb=num(POS.pb)}
  const paid=r2(pc+pb),cost=POS.items.reduce((a,i)=>a+num(i.qty)*num(i.cost),0);
  return{sub,disc,total,pc:r2(pc),pb:r2(pb),paid,due:r2(Math.max(0,total-paid)),profit:r2(total-cost)};
}
function updateSum(){
  if(!$('#s_total')&&!$('#s_cnt'))return paintSum();
  const o=posTotals(),g=(id,v)=>{const e=$('#'+id);if(e)e.textContent=v};
  g('s_sub',money(o.sub));g('s_total',money(o.total));g('s_damt',POS.dm==='pct'&&o.disc?'= '+money(o.disc):'');
  g('s_pay',money(o.paid));g('s_due',money(o.due));
  const pf=$('#s_profit');if(pf){pf.textContent=money(o.profit);pf.style.color=o.profit<0?'var(--r)':'var(--g)'}
  const dw=$('#s_duew');if(dw)dw.style.display=o.due>0.001?'':'none';
  const pa=$('#s_pa');if(pa)pa.placeholder=POS.pay==='due'?'0':String(o.total);
}
function paintSum(){
  const T=TYPES[POS.type],o=posTotals();
  if(T.order||!T.price){$('#sm').innerHTML=`<div class="t" id="s_cnt"><span>মোট আইটেম</span><span>${r2(POS.items.reduce((a,i)=>a+num(i.qty),0))}</span></div>`+(T.order?`<div class="t"><span>আনুমানিক মোট</span><span id="s_total">${money(o.total)}</span></div>`:'');return}
  const modes=[['cash','💵 ক্যাশ'],['bank','🏦 ব্যাংক'],['due','📒 বাকি'],['split','⚖ মিশ্র']];
  const showProfit=POS.type==='sale'&&isOwner();
  $('#sm').innerHTML=`<div><span>সাবটোটাল</span><span id="s_sub">${money(o.sub)}</span></div>
  <div><span>ছাড় <small id="s_damt" style="color:var(--m)"></small></span><span class="row" style="flex-wrap:nowrap;gap:4px"><select id="s_dm" style="width:58px;padding:9px 4px"><option value="amt">৳</option><option value="pct">%</option></select><input type="number" id="s_disc" value="${num(POS.dv)||''}" placeholder="0"></span></div>
  <div class="t"><span>মোট</span><span id="s_total">${money(o.total)}</span></div>
  <div style="flex-direction:column;align-items:stretch"><span style="font-size:12px;color:var(--m)">${T.cash>0?'টাকা কীভাবে নিলেন?':'টাকা কীভাবে দিলেন?'}</span><div class="tabs" id="s_modes" style="margin:4px 0 0">${modes.map(([k,l])=>`<button class="btn s ${POS.pay===k?'':'o'}" data-m="${k}">${l}</button>`).join('')}</div></div>
  ${POS.pay==='split'?`<div><span>ক্যাশ</span><input type="number" id="s_pc" value="${num(POS.pc)||''}" placeholder="0"></div><div><span>ব্যাংক</span><input type="number" id="s_pb" value="${num(POS.pb)||''}" placeholder="0"></div>`:''}
  ${(POS.pay==='cash'||POS.pay==='bank')?`<div><span>কত টাকা ${T.cash>0?'পেলেন':'দিলেন'}?</span><input type="number" id="s_pa" value="${POS.pa===''?'':num(POS.pa)}" placeholder="${o.total}"></div>`:''}
  ${POS.pay==='due'?`<div><span>এখন কিছু আদায় করলে (ক্যাশ)</span><input type="number" id="s_pa" value="${POS.pa===''?'':num(POS.pa)}" placeholder="0"></div>`:''}
  <div><span>পরিশোধ${POS.pay==='cash'?' (ক্যাশ)':POS.pay==='bank'?' (ব্যাংক)':''}</span><b id="s_pay">${money(o.paid)}</b></div>
  <div id="s_duew" style="${o.due>0.001?'':'display:none'}"><span>বাকি${POS.partyId?'':' <small style="color:var(--r)">(পার্টি নির্বাচন করুন)</small>'}</span><b id="s_due" style="color:var(--r)">${money(o.due)}</b></div>
  ${showProfit?`<div><span>আনুমানিক লাভ</span><b id="s_profit" style="color:${o.profit<0?'var(--r)':'var(--g)'}">${money(o.profit)}</b></div>`:''}`;
  $('#s_dm').value=POS.dm;
  $('#s_dm').onchange=e=>{POS.dm=e.target.value;updateSum()};
  $('#s_disc').oninput=e=>{POS.dv=num(e.target.value);updateSum()};
  $('#s_modes').onclick=e=>{const m=e.target.dataset.m;if(!m)return;
    if(m==='split'&&POS.pay!=='split'){const t=posTotals();POS.pc=t.pc;POS.pb=t.pb;if(t.paid<=0)POS.pc=t.total}
    POS.pay=m;paintSum()};
  if($('#s_pa'))$('#s_pa').oninput=e=>{POS.pa=e.target.value;updateSum()};
  if($('#s_pc')){$('#s_pc').oninput=e=>{POS.pc=num(e.target.value);updateSum()};$('#s_pb').oninput=e=>{POS.pb=num(e.target.value);updateSum()}}
}
async function posSave(print){
  const T=TYPES[POS.type];if(!POS.items.length)return toast('পণ্য যোগ করুন','e');
  if(POS.items.some(i=>num(i.qty)<=0))return toast('পরিমাণ ০ এর বেশি হতে হবে','e');
  if(T.need&&!POS.partyId)return toast('পার্টি নির্বাচন করুন','e');
  const o=posTotals();const paid=T.money?o.paid:0;
  if(T.money&&(o.pc<0||o.pb<0))return toast('পরিশোধের পরিমাণ ঠিক নয়','e');
  if(T.money&&paid>o.total+0.001)return toast('পরিশোধ মোটের বেশি হতে পারে না','e');
  if(T.money&&o.due>0.001&&!POS.partyId)return toast('বাকি রাখতে হলে পার্টি নির্বাচন করুন','e');
  if(T.stock<0){const old=POS.editId?S.docs.get(POS.editId):null;
    for(const it of POS.items){let s=stockOf(it.pid);if(old&&TYPES[old.type].stock<0)s+=(old.items.find(x=>x.pid===it.pid)?.qty||0);
      if(s-num(it.qty)<0&&!confirm(`${it.name}: স্টক ${r2(s)}, বিক্রি ${it.qty}। তবুও সেভ করবেন?`))return}}
  const doc=POS.editId?{...S.docs.get(POS.editId)}:{id:uid(),no:nextNo(T.pre),createdAt:Date.now()};
  const oldCost={};(doc.items||[]).forEach(i=>oldCost[i.pid]=i.cost);
  Object.assign(doc,{type:POS.type,date:POS.date||today(),partyId:POS.partyId||'',
    items:POS.items.map(i=>({pid:i.pid,name:i.name,qty:num(i.qty),price:num(i.price),cost:T.price==='buyPrice'?num(i.price):(oldCost[i.pid]??num(S.products.get(i.pid)?.buyPrice??i.cost))})),
    sub:o.sub,disc:o.disc,discMode:POS.dm,discVal:num(POS.dv),total:T.price?o.total:0,paid,
    payCash:T.money?o.pc:0,payBank:T.money?o.pb:0,method:(T.money&&o.pb>0&&o.pc<=0)?'bank':'cash',note:POS.note});
  if(T.order)doc.status=doc.status||'open';
  await save('docs',doc);
  if(POS.type==='purchase'){const ups=[];POS.items.forEach(i=>{const p=S.products.get(i.pid);if(!p)return;const np={...p};let ch=false;if(num(p.buyPrice)!==num(i.price)){np.buyPrice=num(i.price);repriceAuto(np);ch=true}if(i.exp&&i.exp!==p.expiry){np.expiry=i.exp;ch=true}if(ch)ups.push(np)});if(ups.length)await saveMany('products',ups)}
  if(POS.fromOrder){const od=S.docs.get(POS.fromOrder);if(od)await save('docs',{...od,status:'done'})}
  const wasEdit=!!POS.editId,ty=POS.type;POS=null;toast('সেভ হয়েছে: '+doc.no,'k');
  if(print||biz().autoPrint)printDoc(doc);
  if(wasEdit)go('invoices');else go('pos:'+ty,{});
}

/* ========== invoices list / view / print ========== */
let INV={type:'all',from:'',to:'',q:'',lim:100};
SCR.invoices=()=>{
  view(`<div class="card"><div class="tabs">${[['all','সব'],['sale','বিক্রয়'],['purchase','ক্রয়'],['free','ফ্রি'],['order','অর্ডার'],['return','ফেরত']].map(([k,l])=>`<button class="btn s ${INV.type===k?'':'o'}" data-t="${k}">${l}</button>`).join('')}</div>
  <div class="grid g3"><div class="f"><label>শুরু</label><input type="date" id="if" value="${INV.from}"></div><div class="f"><label>শেষ</label><input type="date" id="it" value="${INV.to}"></div><div class="f"><label>খুঁজুন (নং / পার্টি)</label><input id="iq" value="${esc(INV.q)}"></div></div></div><div class="card" id="il"></div>`);
  $$('[data-t]').forEach(b=>b.onclick=()=>{INV.type=b.dataset.t;INV.lim=100;SCR.invoices()});
  $('#if').onchange=e=>{INV.from=e.target.value;paintInv()};$('#it').onchange=e=>{INV.to=e.target.value;paintInv()};$('#iq').oninput=e=>{INV.q=e.target.value;paintInv()};
  paintInv();
};
function paintInv(){
  const q=INV.q.toLowerCase();
  const m={sale:['sale'],purchase:['purchase'],free:['free'],order:['sale_order','purchase_order'],return:['sale_return','purchase_return']}[INV.type];
  const rows=live('docs').filter(d=>(!m||m.includes(d.type))&&(!INV.from||d.date>=INV.from)&&(!INV.to||d.date<=INV.to)&&(!q||d.no.toLowerCase().includes(q)||(S.parties.get(d.partyId)?.name||'').toLowerCase().includes(q))).sort(byDateDesc);
  const sh=rows.slice(0,INV.lim);
  $('#il').innerHTML=tblc(['ইনভয়েস','তারিখ','পার্টি','>মোট','>বকেয়া',''],sh.map(d=>{const t=TYPES[d.type],due=docDue(d),later=docLater(d);
   return [`${esc(d.no)}<br><span class="bd bp">${t.l}</span>${d.status==='done'?' <span class="bd bg">সম্পন্ন</span>':''}`,d.date,partyName(d.partyId),money(d.total),t.money?(due>0.001?`<span class="bd br">${money(due)}</span>`:'<span class="bd bg">পরিশোধিত</span>')+(later>0.001?`<br><small style="color:var(--m)">পরে ${money(later)} ${d.type==='purchase'?'দেওয়া':'পেয়েছি'}</small>`:''):'-',`<button class="btn o s" data-view="${d.id}">দেখুন</button>`]}))+
  `<div class="row sp" style="margin-top:8px"><small>${rows.length}টির মধ্যে ${sh.length}টি দেখানো হচ্ছে</small>${rows.length>sh.length?'<button class="btn o s" id="more">আরও দেখুন</button>':''}</div>`;
  if($('#more'))$('#more').onclick=()=>{INV.lim+=200;paintInv()};
}
document.addEventListener('click',e=>{const v=e.target.closest('[data-view]');if(v){e.preventDefault();viewDoc(v.dataset.view)}const g=e.target.closest('[data-go]');if(g)go(g.dataset.go)});

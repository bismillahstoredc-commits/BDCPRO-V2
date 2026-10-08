'use strict';
/* ========== products ========== */
let PQ='';
let PF='';
SCR.products=()=>{
  view(`<div class="card"><div class="row sp"><h3 style="margin:0">পণ্য তালিকা</h3><div class="row"><input id="q" placeholder="নাম / বারকোড..." style="width:150px" value="${esc(PQ)}"><select id="pf" style="width:auto"><option value="">সব পণ্য</option><option value="exp">মেয়াদ শেষ</option><option value="soon">৩০ দিনে শেষ হবে</option></select><button class="btn" id="add">+ নতুন পণ্য</button></div></div></div><div id="pst" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px"></div><div class="card" id="pl"></div>`);
  $('#add').onclick=()=>productForm(null,()=>SCR.products());$('#q').oninput=e=>{PQ=e.target.value;paint()};$('#pf').value=PF;$('#pf').onchange=e=>{PF=e.target.value;paint()};
  function paint(){
    const q=PQ.toLowerCase();let tv=0,ts=0;
    const rows=live('products').filter(p=>!q||p.name.toLowerCase().includes(q)||(p.category||'').toLowerCase().includes(q)||(p.barcode||'').toLowerCase().includes(q)).filter(p=>{if(!PF)return true;const d=expDays(p);return d!==null&&stockOf(p.id)>0&&(PF==='exp'?d<0:(d>=0&&d<=30))}).sort((a,b)=>a.name.localeCompare(b.name));
    const body=rows.map(p=>{const s=stockOf(p.id),v=Math.max(s,0)*num(p.buyPrice);tv+=v;ts+=s;const low=num(p.low)>0&&s<=num(p.low);
      return [`${esc(p.name)}${low?' <span class="bd br">লো</span>':''}${expTag(p)}${p.barcode?`<br><small style="color:var(--m)">▮ ${esc(p.barcode)}</small>`:''}`,esc(p.category||'-'),money(p.buyPrice),money(p.sellPrice)+(p.rAuto&&p.rPct!==''&&p.rPct!=null?`<br><small style="color:var(--m)">+${r2(p.rPct)}%</small>`:''),num(p.wsPrice)>0?`${money(p.wsPrice)}${p.wAuto&&p.wPct!==''&&p.wPct!=null?` <small style="color:var(--m)">+${r2(p.wPct)}%</small>`:''}<br><small style="color:var(--m)">${r2(p.wsMin)}+ ${esc(p.unit||'')}</small>`:'-',`${r2(s)} ${esc(p.unit||'')}`,money(v),`<button class="btn o s" data-e="${p.id}">এডিট</button>`]});
    const stb=(c,l,v)=>`<div class="stat ${c}" style="padding:10px 8px;min-width:0"><small>${l}</small><div style="font-size:clamp(14px,4.2vw,20px);word-break:break-word">${v}</div></div>`;
    $('#pst').innerHTML=stb('','মোট পণ্য',rows.length)+stb('g','মোট পরিমাণ (Qty)',r2(ts))+stb('o','মোট দর <small>(ক্রয় মূল্যে)</small>',money(tv));
    $('#pl').innerHTML=tblc(['নাম','ক্যাটাগরি','>ক্রয়','>খুচরা','>পাইকারী','>স্টক','>স্টক মূল্য',''],body,['মোট '+rows.length+'টি','','','','',r2(ts),money(tv),'']);
    $$('[data-e]').forEach(b=>b.onclick=()=>productForm(S.products.get(b.dataset.e),()=>SCR.products()));
  }
  paint();
};

/* ========== লো-স্টক পণ্য পেজ ========== */
SCR.lowstock=()=>{
  const L=lowProducts();let need=0;
  const body=L.map(p=>{const s=stockOf(p.id),n=lowNeed(p);need+=n*num(p.buyPrice);
    return [`${esc(p.name)}${p.barcode?`<br><small style="color:var(--m)">▮ ${esc(p.barcode)}</small>`:''}`,esc(p.category||'-'),`<span style="color:var(--r);font-weight:700">${r2(s)} ${esc(p.unit||'')}</span>`,`${r2(p.low)}`,`${r2(n)}`,money(p.buyPrice),`<button class="btn o s" data-e="${p.id}">এডিট</button>`]});
  view(`<div class="card"><div class="row sp"><h3 style="margin:0">⚠ লো-স্টক পণ্য (${L.length})</h3>${L.length?'<button class="btn" id="lbuy">📥 সব ক্রয়ে নিন</button>':''}</div>
  <p style="color:var(--m);font-size:13px;margin:6px 0 0">যেসব পণ্যের স্টক এলার্ট লেভেল বা তার কম। "প্রয়োজন" = এলার্ট লেভেলে পৌঁছাতে যতটা লাগবে। আনুমানিক ক্রয় খরচ ${money(need)}।</p></div>
  <div class="card">${L.length?tblc(['নাম','ক্যাটাগরি','>স্টক','>এলার্ট','>প্রয়োজন','>ক্রয় মূল্য',''],body,['মোট '+L.length+'টি','','','','','','']):'<div class="empty">✓ কোনো লো-স্টক পণ্য নেই</div>'}</div>`);
  if($('#lbuy'))$('#lbuy').onclick=()=>lowToPurchase(L.map(p=>p.id));
  $$('[data-e]').forEach(b=>b.onclick=()=>productForm(S.products.get(b.dataset.e),()=>SCR.lowstock()));
};

/* ========== ক্যাটাগরি ও একক ম্যানেজমেন্ট ========== */
function listPage(kind){
  const k=LK[kind];
  const cnt={};live('products').forEach(p=>{const n=(p[k.field]||'').trim();if(n)cnt[n]=(cnt[n]||0)+1});
  const recs={};live('meta').filter(m=>m.kind===kind).forEach(m=>recs[m.name]=m);
  const names=listNames(kind);
  view(`<div class="card"><h3>নতুন ${k.l} যোগ করুন</h3><div class="row" style="flex-wrap:nowrap"><input id="ln" placeholder="নাম লিখুন"><button class="btn" id="la">+ যোগ করুন</button></div></div>
  <div class="card"><h3>${k.l} তালিকা (${names.length}টি)</h3>${tblc(['নাম','>পণ্য সংখ্যা',''],names.map((n,i)=>[esc(n),cnt[n]||0,`<div class="row" style="flex-wrap:nowrap"><button class="btn o s" data-rn="${i}">নাম বদলান</button>${isOwner()?`<button class="btn d s" data-dl="${i}">ডিলিট</button>`:''}</div>`]))}</div>`);
  const add=async()=>{const n=$('#ln').value.trim();if(!n)return toast('নাম দিন','e');
    if(names.some(x=>x.toLowerCase()===n.toLowerCase()&&recs[x]))return toast('এই নাম আগে থেকেই আছে','e');
    await addListName(kind,n);toast('যোগ হয়েছে','k');listPage(kind)};
  $('#la').onclick=add;$('#ln').onkeydown=e=>{if(e.key==='Enter')add()};
  $$('#main [data-rn]').forEach(b=>b.onclick=async()=>{const old=names[b.dataset.rn];const nn=(prompt(k.l+' — নতুন নাম লিখুন:',old)||'').trim();if(!nn||nn===old)return;
    if(names.some(x=>x!==old&&x.toLowerCase()===nn.toLowerCase()))return toast('এই নাম আগে থেকেই আছে','e');
    if(recs[old])await save('meta',{...recs[old],name:nn});else await save('meta',{id:kind+'_'+uid(),kind,name:nn});
    const ps=live('products').filter(p=>(p[k.field]||'').trim()===old).map(p=>({...p,[k.field]:nn}));if(ps.length)await saveMany('products',ps);
    toast('নাম বদলেছে','k');listPage(kind)});
  $$('#main [data-dl]').forEach(b=>b.onclick=async()=>{const n=names[b.dataset.dl];
    if(cnt[n])return toast(`${cnt[n]}টি পণ্যে এই ${k.l} ব্যবহার হচ্ছে — আগে ওই পণ্যগুলো বদলান`,'e');
    if(!confirm('ডিলিট করবেন?'))return;if(recs[n])await remove('meta',recs[n]);toast('ডিলিট হয়েছে');listPage(kind)});
}
SCR.categories=()=>listPage('cat');
SCR.units=()=>listPage('unit');

/* ========== parties ========== */
let PT='customer';
SCR.parties=()=>{
  view(`<div class="card"><div class="row sp"><div class="tabs" style="margin:0"><button class="btn s ${PT==='customer'?'':'o'}" data-t="customer">কাস্টমার</button><button class="btn s ${PT==='supplier'?'':'o'}" data-t="supplier">সাপ্লায়ার</button></div><div class="row"><input id="q" placeholder="খুঁজুন..." style="width:150px"><button class="btn" id="add">+ নতুন</button></div></div></div><div class="card" id="pl"></div>`);
  $$('[data-t]').forEach(b=>b.onclick=()=>{PT=b.dataset.t;SCR.parties()});
  $('#add').onclick=()=>partyForm(null,PT,()=>SCR.parties());
  const paint=()=>{const q=$('#q').value.toLowerCase();
    const rows=live('parties').filter(p=>p.type===PT&&(!q||p.name.toLowerCase().includes(q)||(p.phone||'').includes(q))).sort((a,b)=>a.name.localeCompare(b.name));let tot=0;
    $('#pl').innerHTML=tblc(['নাম','ফোন','>'+(PT==='customer'?'পাওনা':'দেনা'),''],rows.map(p=>{const d=dueOf(p);tot+=d;return [esc(p.name),esc(p.phone||'-'),d>0.001?`<b style="color:var(--r)">${money(d)}</b>`:money(d),`<div class="row" style="flex-wrap:nowrap"><button class="btn gr s" data-pay="${p.id}">${PT==='customer'?'আদায়':'পরিশোধ'}</button><button class="btn o s" data-led="${p.id}">লেজার</button><button class="btn o s" data-e="${p.id}">এডিট</button></div>`]}),['মোট','',money(tot),'']);
    $$('[data-e]').forEach(b=>b.onclick=()=>partyForm(S.parties.get(b.dataset.e),null,()=>SCR.parties()));
    $$('[data-pay]').forEach(b=>b.onclick=()=>payForm(S.parties.get(b.dataset.pay)));
    $$('[data-led]').forEach(b=>b.onclick=()=>ledger(S.parties.get(b.dataset.led)));};
  $('#q').oninput=paint;paint();
};
function payForm(p,doc){
  const cu=p.type!=='supplier',ty=cu?'sale':'purchase';
  const dues=live('docs').filter(x=>x.partyId===p.id&&x.type===ty&&docDue(x)>0.001).sort(byDateDesc);
  const def=()=>{const v=$('#iv').value;return v?docDue(S.docs.get(v)):Math.max(0,r2(dueOf(p)))};
  modal((cu?'টাকা আদায় — ':'টাকা পরিশোধ — ')+p.name,`<p>বর্তমান মোট ${cu?'পাওনা':'দেনা'}: <b>${money(dueOf(p))}</b></p>
  <div class="f"><label>কোন ইনভয়েসের বিপরীতে?</label><select id="iv"><option value="">স্বয়ংক্রিয় (আগে শুরুর/পুরনো বকেয়া)</option>${dues.map(x=>`<option value="${x.id}" ${doc&&doc.id===x.id?'selected':''}>${esc(x.no)} • ${x.date} • বকেয়া ${money(docDue(x))}</option>`).join('')}</select></div>
  <div class="f"><label>পরিমাণ</label><input id="a" type="number"></div>
  <div class="grid g2"><div class="f"><label>মাধ্যম</label><select id="m"><option value="cash">ক্যাশ</option><option value="bank">ব্যাংক</option></select></div><div class="f"><label>তারিখ</label><input id="d" type="date" value="${today()}"></div></div>
  <div class="f"><label>নোট</label><input id="n"></div><div class="row"><button class="btn" id="s">সেভ করুন</button><button class="btn o" id="pcx" type="button">← ফিরে যান</button></div>`,()=>{
    $('#a').value=def();$('#iv').onchange=()=>{$('#a').value=def()};
    $('#pcx').onclick=()=>{if(doc)viewDoc(doc.id);else closeModal()};
    $('#s').onclick=async()=>{const a=num($('#a').value);if(a<=0)return toast('সঠিক পরিমাণ দিন','e');
      const iv=$('#iv').value;
      await save('money',{id:uid(),kind:cu?'payment_in':'payment_out',partyId:p.id,docId:iv||undefined,amount:a,method:$('#m').value,date:$('#d').value||today(),note:$('#n').value,createdAt:Date.now()});
      toast('সেভ হয়েছে','k');MDIRTY=true;
      if(doc)viewDoc(doc.id);else closeModal()};
  });
}
function ledger(p){
  const ev=[];
  S.docs.forEach(d=>{if(d.del||d.partyId!==p.id||TYPES[d.type].order)return;const k={sale:1,sale_return:-1,purchase:-1,purchase_return:1}[d.type]||0;
    ev.push({date:d.date,at:num(d.createdAt),txt:`${TYPES[d.type].l} ${d.no} (মোট ${money(d.total)}, পরিশোধ ${money(d.paid)})`,net:k*(num(d.total)-num(d.paid))})});
  S.money.forEach(m=>{if(m.del||m.partyId!==p.id)return;ev.push({date:m.date,at:num(m.createdAt),txt:(m.kind==='payment_in'?'আদায়':'পরিশোধ')+' '+money(m.amount)+(m.docId&&S.docs.get(m.docId)?' ('+esc(S.docs.get(m.docId).no)+' এর বিপরীতে)':'')+(m.note?' — '+esc(m.note):''),net:m.kind==='payment_in'?-num(m.amount):num(m.amount)})});
  ev.sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:a.at-b.at);
  let run=num(p.opening);const sup=p.type==='supplier';
  const rows=[['শুরুর ব্যালেন্স','',money(run)]];
  ev.forEach(e=>{run+=sup?-e.net:e.net;rows.push([e.date,e.txt,money(run)])});
  modal('লেজার — '+p.name,tblc(['তারিখ','বিবরণ','>ব্যালেন্স'],rows.map(r=>r.length===3&&r[1]===''?['—',r[0],r[2]]:r)),null,true);
}

/* ========== due list ========== */
let DT='customer';
SCR.due=()=>{
  view(`<div class="card"><div class="tabs" style="margin:0"><button class="btn s ${DT==='customer'?'':'o'}" data-t="customer">কাস্টমারের কাছে পাওনা</button><button class="btn s ${DT==='supplier'?'':'o'}" data-t="supplier">সাপ্লায়ারকে দেনা</button></div></div><div class="card" id="dl"></div>`);
  $$('[data-t]').forEach(b=>b.onclick=()=>{DT=b.dataset.t;SCR.due()});
  let tot=0;const rows=live('parties').filter(p=>p.type===DT).map(p=>({p,d:dueOf(p)})).filter(x=>Math.abs(x.d)>0.001).sort((a,b)=>b.d-a.d);
  rows.forEach(x=>tot+=x.d);
  $('#dl').innerHTML=tblc(['নাম','ফোন','>বকেয়া',''],rows.map(x=>[esc(x.p.name),esc(x.p.phone||'-'),`<b>${money(x.d)}</b>`,`<button class="btn gr s" data-pay="${x.p.id}">${DT==='customer'?'আদায়':'পরিশোধ'}</button>`]),['মোট','',money(tot),'']);
  $$('[data-pay]').forEach(b=>b.onclick=()=>payForm(S.parties.get(b.dataset.pay)));
};

/* ========== expense ========== */
let EM=today().slice(0,7);
SCR.expense=()=>{
  const cats=[...new Set(live('money').filter(m=>m.kind==='expense').map(m=>m.cat).filter(Boolean))];
  view(`<div class="card"><h3>খরচ যোগ করুন</h3><div class="grid g3"><div class="f"><label>ক্যাটাগরি</label><input id="c" list="cats" placeholder="ভাড়া, বিদ্যুৎ, বেতন..."><datalist id="cats">${cats.map(c=>`<option value="${esc(c)}">`).join('')}</datalist></div><div class="f"><label>পরিমাণ</label><input id="a" type="number"></div><div class="f"><label>মাধ্যম</label><select id="m"><option value="cash">ক্যাশ</option><option value="bank">ব্যাংক</option></select></div></div>
  <div class="grid g2"><div class="f"><label>তারিখ</label><input id="d" type="date" value="${today()}"></div><div class="f"><label>নোট</label><input id="n"></div></div><button class="btn" id="s">সেভ করুন</button></div>
  <div class="card"><div class="row sp"><h3 style="margin:0">খরচের তালিকা</h3><input type="month" id="mo" value="${EM}" style="width:auto"></div><div id="el"></div></div>`);
  $('#s').onclick=async()=>{const cat=$('#c').value.trim(),a=num($('#a').value);if(!cat||a<=0)return toast('ক্যাটাগরি ও পরিমাণ দিন','e');
    await save('money',{id:uid(),kind:'expense',cat,amount:a,method:$('#m').value,date:$('#d').value||today(),note:$('#n').value,createdAt:Date.now()});toast('সেভ হয়েছে','k');SCR.expense()};
  $('#mo').onchange=e=>{EM=e.target.value;paint()};
  function paint(){const rows=live('money').filter(m=>m.kind==='expense'&&m.date.startsWith(EM)).sort(byDateDesc);let t=0;const by={};rows.forEach(m=>{t+=num(m.amount);by[m.cat]=(by[m.cat]||0)+num(m.amount)});
    $('#el').innerHTML=`<div class="row" style="margin:8px 0">${Object.entries(by).map(([k,v])=>`<span class="bd bp">${esc(k)}: ${money(v)}</span>`).join('')}</div>`+tblc(['তারিখ','ক্যাটাগরি','নোট','>পরিমাণ',''],rows.map(m=>[m.date,esc(m.cat),esc(m.note||'-'),money(m.amount),isOwner()?`<button class="btn d s" data-x="${m.id}">✕</button>`:'']),['মোট','','',money(t),'']);
    $$('[data-x]').forEach(b=>b.onclick=async()=>{if(confirm('ডিলিট করবেন?')){await remove('money',S.money.get(b.dataset.x));paint()}})}
  paint();
};

/* ========== cash & bank ========== */
let CM=today().slice(0,7);
const CB_L={cash_in:'নগদ জমা (ক্যাশে)',cash_out:'নগদ উত্তোলন (ক্যাশ থেকে)',bank_in:'ব্যাংকে জমা (বাইরে থেকে)',bank_out:'ব্যাংক থেকে উত্তোলন (বাইরে)',c2b:'ক্যাশ → ব্যাংকে জমা',b2c:'ব্যাংক → ক্যাশে উত্তোলন'};
SCR.cash=()=>{
  const X=idx(),PA=profitAll();
  view(`<div class="grid g2"><div class="stat g"><small>ক্যাশ ব্যালেন্স</small><div>${money(X.cash)}</div></div><div class="stat"><small>ব্যাংক ব্যালেন্স</small><div>${money(X.bank)}</div></div></div>
  <div class="card" style="margin-top:12px"><h3>নতুন এন্ট্রি</h3><div class="grid g2"><div class="f"><label>ধরন</label><select id="k">${Object.entries(CB_L).map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}</select></div><div class="f"><label>পরিমাণ</label><input id="a" type="number"></div></div>
  <div class="grid g2"><div class="f"><label>তারিখ</label><input id="d" type="date" value="${today()}"></div><div class="f"><label>নোট</label><input id="n"></div></div><button class="btn" id="s">সেভ করুন</button></div>
  ${isOwner()?`<div class="card" style="margin-top:12px;border:2px solid var(--p)"><h3>💸 লভ্যাংশ উত্তোলন (শুধু লাভের টাকা)</h3>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px"><div class="stat" style="padding:8px"><small>মোট নীট লাভ</small><div style="font-size:16px">${money(PA.net)}</div></div><div class="stat r" style="padding:8px"><small>মোট উত্তোলন</small><div style="font-size:16px">${money(PA.draw)}</div></div><div class="stat g" style="padding:8px"><small>উত্তোলনযোগ্য লাভ</small><div style="font-size:16px;color:${PA.avail<0?'var(--r)':'var(--g)'}">${money(Math.max(PA.avail,0))}</div></div></div>
  <div class="grid g2"><div class="f"><label>পরিমাণ</label><input id="wa" type="number" step="any"></div><div class="f"><label>কোথা থেকে</label><select id="wm"><option value="cash">ক্যাশ (${money(X.cash)})</option><option value="bank">ব্যাংক (${money(X.bank)})</option></select></div></div>
  <div class="grid g2"><div class="f"><label>তারিখ</label><input id="wd" type="date" value="${today()}"></div><div class="f"><label>নোট</label><input id="wn"></div></div>
  <button class="btn" id="ws">লভ্যাংশ তুলুন</button><small style="display:block;color:var(--m);margin-top:6px">শুধু জমা হওয়া লাভের টাকাই তোলা যাবে — লাভের বেশি বা ক্যাশ/ব্যাংকে যা আছে তার বেশি তোলা যাবে না। মূলধনে হাত পড়বে না।</small></div>`:''}
  <div class="card"><div class="row sp"><h3 style="margin:0">এন্ট্রির তালিকা</h3><input type="month" id="mo" value="${CM}" style="width:auto"></div><div id="cl"></div></div>`);
  $('#s').onclick=async()=>{const a=num($('#a').value);if(a<=0)return toast('সঠিক পরিমাণ দিন','e');
    await save('money',{id:uid(),kind:$('#k').value,amount:a,date:$('#d').value||today(),note:$('#n').value,createdAt:Date.now()});toast('সেভ হয়েছে','k');SCR.cash()};
  if($('#ws'))$('#ws').onclick=async()=>{const a=num($('#wa').value),m=$('#wm').value,P=profitAll(),XX=idx();
    if(a<=0)return toast('সঠিক পরিমাণ দিন','e');
    if(a>P.avail+0.001)return toast('শুধু লাভের টাকা তোলা যাবে — উত্তোলনযোগ্য লাভ '+money(Math.max(P.avail,0)),'e');
    if(a>(m==='bank'?XX.bank:XX.cash)+0.001)return toast((m==='bank'?'ব্যাংকে':'ক্যাশে')+' এত টাকা নেই (আছে '+money(m==='bank'?XX.bank:XX.cash)+')','e');
    if(!confirm(money(a)+' লভ্যাংশ উত্তোলন করবেন? উত্তোলনের পর অবশিষ্ট লাভ '+money(P.avail-a)))return;
    await save('money',{id:uid(),kind:'drawing',method:m,amount:a,date:$('#wd').value||today(),note:$('#wn').value,createdAt:Date.now()});toast('লভ্যাংশ উত্তোলন সেভ হয়েছে','k');SCR.cash()};
  $('#mo').onchange=e=>{CM=e.target.value;paint()};
  function paint(){const rows=live('money').filter(m=>(CB_L[m.kind]||m.kind==='drawing')&&m.date.startsWith(CM)).sort(byDateDesc);
    $('#cl').innerHTML=tblc(['তারিখ','ধরন','নোট','>পরিমাণ',''],rows.map(m=>[m.date,CB_L[m.kind]||('💸 লভ্যাংশ উত্তোলন ('+(m.method==='bank'?'ব্যাংক':'ক্যাশ')+')'),esc(m.note||'-'),money(m.amount),isOwner()?`<button class="btn d s" data-x="${m.id}">✕</button>`:'']));
    $$('[data-x]').forEach(b=>b.onclick=async()=>{if(confirm('ডিলিট করবেন?')){await remove('money',S.money.get(b.dataset.x));SCR.cash()}})}
  paint();
};

/* ========== reports ========== */
let RP={tab:'sales',from:today().slice(0,8)+'01',to:today(),sq:''};
const RTABS=[['sales','বিক্রয়'],['items','পণ্যভিত্তিক বিক্রয়'],['purchase','ক্রয়'],['stock','স্টক'],['due','দেনা-পাওনা'],['expense','খরচ'],['daybook','ক্যাশবুক','o'],['pl','লাভ-ক্ষতি','o'],['bs','ব্যালেন্স শীট','o']];
SCR.reports=()=>{
  view(`<div class="card"><div class="tabs">${RTABS.filter(t=>t[2]!=='o'||isOwner()).map(([k,l])=>`<button class="btn s ${RP.tab===k?'':'o'}" data-t="${k}">${l}</button>`).join('')}</div>
  <div class="row"><div class="f" style="margin:0"><label>শুরু</label><input type="date" id="f" value="${RP.from}"></div><div class="f" style="margin:0"><label>শেষ</label><input type="date" id="t" value="${RP.to}"></div><button class="btn o" id="pr" style="margin-top:16px">🖨 প্রিন্ট</button></div>${RP.tab==='stock'?`<div class="row" style="margin-top:10px;flex-wrap:nowrap"><input id="rsq" placeholder="🔍 নাম / ক্যাটাগরি / বারকোড দিয়ে খুঁজুন..." value="${esc(RP.sq)}" style="flex:1;min-width:0"><button class="btn s" id="rscan" type="button">📷 স্ক্যান</button><button class="btn o s" id="rsx" type="button" title="মুছুন">✕</button></div>`:''}</div><div class="card" id="rb"></div>`);
  $$('[data-t]').forEach(b=>b.onclick=()=>{RP.tab=b.dataset.t;SCR.reports()});
  $('#f').onchange=e=>{RP.from=e.target.value;paintR()};$('#t').onchange=e=>{RP.to=e.target.value;paintR()};
  $('#pr').onclick=()=>printHTML(`<html><head><meta charset="utf-8"><style>body{font-family:'Hind Siliguri',Arial,sans-serif;font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #999;padding:4px;text-align:left}.n{text-align:right}tr.tot td{font-weight:700}</style></head><body><h3>${esc(biz().name||'')} — ${RTABS.find(t=>t[0]===RP.tab)[1]} রিপোর্ট</h3><p>${RP.from} থেকে ${RP.to}</p>${$('#rb').innerHTML}</body></html>`);
  if($('#rsq')){
    $('#rsq').oninput=e=>{RP.sq=e.target.value;paintR()};
    $('#rsq').onkeydown=e=>{if(e.key==='Enter')e.preventDefault()};
    $('#rsx').onclick=()=>{RP.sq='';$('#rsq').value='';paintR();$('#rsq').focus()};
    $('#rscan').onclick=()=>openScanner(c=>{RP.sq=String(c).trim();$('#rsq').value=RP.sq;paintR();const n=live('products').filter(p=>(p.barcode||'').trim()===RP.sq).length;beep(n>0);return n?'✓ পাওয়া গেছে':'✗ এই বারকোডের পণ্য নেই'},false);
  }
  paintR();
};
const inR=d=>(!RP.from||d.date>=RP.from)&&(!RP.to||d.date<=RP.to);
function paintR(){
  const el=$('#rb'),docs=live('docs').filter(inR),T=RP.tab;let h='';
  const dl=t=>docs.filter(d=>d.type===t).sort((a,b)=>byDateDesc(b,a));
  if(T==='sales'||T==='purchase'){const rows=dl(T);let a=0,b=0,c=0;rows.forEach(d=>{a+=num(d.total);b+=num(d.paid)+docLater(d);c+=docDue(d)});
    h=`<div class="grid g3"><div class="stat g"><small>মোট</small><div>${money(a)}</div></div><div class="stat"><small>পরিশোধ</small><div>${money(b)}</div></div><div class="stat r"><small>বকেয়া</small><div>${money(c)}</div></div></div><br>`+tblc(['ইনভয়েস','তারিখ','পার্টি','>মোট','>পরিশোধ','>বকেয়া'],rows.map(d=>[esc(d.no),d.date,partyName(d.partyId),money(d.total),money(num(d.paid)+docLater(d)),money(docDue(d))]),['মোট '+rows.length+'টি','','',money(a),money(b),money(c)])}
  else if(T==='items'){const m={};dl('sale').forEach(d=>d.items.forEach(i=>{const x=m[i.pid]||(m[i.pid]={n:i.name,q:0,a:0,c:0});x.q+=num(i.qty);x.a+=num(i.qty)*num(i.price);x.c+=num(i.qty)*num(i.cost)}));
    const rows=Object.values(m).sort((a,b)=>b.a-a.a);let q=0,a=0,c=0;rows.forEach(x=>{q+=x.q;a+=x.a;c+=x.c});
    h=isOwner()?tblc(['পণ্য','>পরিমাণ','>বিক্রয়','>লাভ'],rows.map(x=>[esc(x.n),r2(x.q),money(x.a),money(x.a-x.c)]),['মোট',r2(q),money(a),money(a-c)]):tblc(['পণ্য','>পরিমাণ','>বিক্রয়'],rows.map(x=>[esc(x.n),r2(x.q),money(x.a)]),['মোট',r2(q),money(a)])}
  else if(T==='stock'){let tv=0,ts=0;const sq=(RP.sq||'').trim().toLowerCase();const rows=live('products').filter(p=>!sq||p.name.toLowerCase().includes(sq)||(p.category||'').toLowerCase().includes(sq)||(p.barcode||'').toLowerCase().includes(sq)).sort((a,b)=>a.name.localeCompare(b.name)).map(p=>{const s=stockOf(p.id),v=Math.max(s,0)*num(p.buyPrice);tv+=v;ts+=s;return [esc(p.name),`${r2(s)} ${esc(p.unit||'')}`,money(p.buyPrice),money(v)]});
    h=tblc(['পণ্য','>স্টক','>ক্রয় মূল্য','>স্টক মূল্য'],rows,['মোট '+rows.length+'টি',r2(ts),'',money(tv)])}
  else if(T==='due'){['customer','supplier'].forEach(ty=>{let t=0;const rows=live('parties').filter(p=>p.type===ty).map(p=>({p,d:dueOf(p)})).filter(x=>Math.abs(x.d)>.001).sort((a,b)=>b.d-a.d);rows.forEach(x=>t+=x.d);
    h+=`<h3>${ty==='customer'?'কাস্টমারের কাছে পাওনা':'সাপ্লায়ারকে দেনা'}</h3>`+tblc(['নাম','ফোন','>টাকা'],rows.map(x=>[esc(x.p.name),esc(x.p.phone||'-'),money(x.d)]),['মোট','',money(t)])})}
  else if(T==='expense'){const rows=live('money').filter(m=>m.kind==='expense'&&inR(m)).sort(byDateDesc);const by={};let t=0;rows.forEach(m=>{by[m.cat]=(by[m.cat]||0)+num(m.amount);t+=num(m.amount)});
    h=`<h3>ক্যাটাগরি অনুযায়ী</h3>`+tblc(['ক্যাটাগরি','>টাকা'],Object.entries(by).map(([k,v])=>[esc(k),money(v)]),['মোট',money(t)])+`<h3>বিস্তারিত</h3>`+tblc(['তারিখ','ক্যাটাগরি','নোট','>টাকা'],rows.map(m=>[m.date,esc(m.cat),esc(m.note||'-'),money(m.amount)]))}
  else if(T==='daybook'&&isOwner()){
    const ev=[];docs.forEach(d=>{const e=cashEffect(0,d);if(e[0]||e[1])ev.push({date:d.date,txt:TYPES[d.type].l+' '+d.no,c:e[0],b:e[1]})});
    live('money').filter(inR).forEach(m=>{const e=cashEffect(0,m);if(e[0]||e[1])ev.push({date:m.date,txt:(CB_L[m.kind]||({payment_in:'আদায়',payment_out:'পরিশোধ',drawing:'💸 লভ্যাংশ উত্তোলন',expense:'খরচ: '+(m.cat||'')})[m.kind])+(m.partyId?' — '+partyName(m.partyId):''),c:e[0],b:e[1]})});
    ev.sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);let ci=0,co=0,bi=0,bo=0;ev.forEach(e=>{if(e.c>0)ci+=e.c;else co-=e.c;if(e.b>0)bi+=e.b;else bo-=e.b});
    h=tblc(['তারিখ','বিবরণ','>ক্যাশ জমা','>ক্যাশ খরচ','>ব্যাংক জমা','>ব্যাংক খরচ'],ev.map(e=>[e.date,esc(e.txt),e.c>0?money(e.c):'',e.c<0?money(-e.c):'',e.b>0?money(e.b):'',e.b<0?money(-e.b):'']),['মোট','',money(ci),money(co),money(bi),money(bo)])}
  else if(T==='pl'&&isOwner()){let rev=0,cogs=0,free=0;docs.forEach(d=>{if(d.type==='sale'||d.type==='sale_return'){const k=d.type==='sale'?1:-1;rev+=k*num(d.total);d.items.forEach(i=>cogs+=k*num(i.qty)*num(i.cost))}if(d.type==='free')d.items.forEach(i=>free+=num(i.qty)*num(i.cost))});
    let ex=0;live('money').filter(m=>m.kind==='expense'&&inR(m)).forEach(m=>ex+=num(m.amount));const gp=rev-cogs,net=gp-ex-free;let dw=0;live('money').filter(m=>m.kind==='drawing'&&inR(m)).forEach(m=>dw+=num(m.amount));const PA=profitAll();
    h=`<table><tr><td>নীট বিক্রয়</td><td class="n">${money(rev)}</td></tr><tr><td>বিক্রীত পণ্যের ক্রয়মূল্য</td><td class="n">- ${money(cogs)}</td></tr><tr class="tot"><td>মোট লাভ (গ্রস)</td><td class="n">${money(gp)}</td></tr><tr><td>মোট খরচ</td><td class="n">- ${money(ex)}</td></tr><tr><td>ফ্রি আইটেমের ক্রয়মূল্য</td><td class="n">- ${money(free)}</td></tr><tr class="tot"><td>নীট লাভ / (ক্ষতি)</td><td class="n" style="color:${net<0?'var(--r)':'var(--g)'}">${money(net)}</td></tr><tr><td>লভ্যাংশ উত্তোলন (এই সময়ে)</td><td class="n">- ${money(dw)}</td></tr><tr class="tot"><td>অবশিষ্ট লাভ (এই সময়ে)</td><td class="n">${money(net-dw)}</td></tr></table><small style="display:block;margin-top:8px;color:var(--m)">সব সময়ের হিসাবে: মোট নীট লাভ ${money(PA.net)} − মোট উত্তোলন ${money(PA.draw)} = উত্তোলনযোগ্য লাভ <b>${money(Math.max(PA.avail,0))}</b></small>`}
  else if(T==='bs'&&isOwner()){const X=idx();let recv=0,pay=0,sv=0;S.parties.forEach(p=>{if(p.del)return;const d=dueOf(p);if(p.type==='supplier')pay+=d;else recv+=d});S.products.forEach(p=>{if(!p.del)sv+=Math.max(stockOf(p.id),0)*num(p.buyPrice)});
    const ta=X.cash+X.bank+sv+recv;h=`<div class="grid g2"><div><h3>সম্পদ</h3><table><tr><td>ক্যাশ</td><td class="n">${money(X.cash)}</td></tr><tr><td>ব্যাংক</td><td class="n">${money(X.bank)}</td></tr><tr><td>স্টক মূল্য</td><td class="n">${money(sv)}</td></tr><tr><td>কাস্টমারের কাছে পাওনা</td><td class="n">${money(recv)}</td></tr><tr class="tot"><td>মোট সম্পদ</td><td class="n">${money(ta)}</td></tr></table></div>
    <div><h3>দায় ও মূলধন</h3><table><tr><td>সাপ্লায়ারকে দেনা</td><td class="n">${money(pay)}</td></tr><tr><td>মালিকের মূলধন (নীট)</td><td class="n">${money(ta-pay)}</td></tr><tr><td style="color:var(--m)">— এর মধ্যে অবশিষ্ট লাভ</td><td class="n" style="color:var(--m)">${money(profitAll().avail)}</td></tr><tr><td style="color:var(--m)">— মোট লভ্যাংশ উত্তোলন (আগেই বাদ)</td><td class="n" style="color:var(--m)">${money(profitAll().draw)}</td></tr><tr class="tot"><td>মোট</td><td class="n">${money(ta)}</td></tr></table></div></div><small>ব্যালেন্স শীট সর্বদা বর্তমান অবস্থার হিসাব (তারিখ ফিল্টার প্রযোজ্য নয়)।</small>`}
  el.innerHTML=h||'<div class="empty">নেই</div>';
}

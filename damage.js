'use strict';
/* ========== ড্যামেজ / মেয়াদোত্তীর্ণ ফেরত ও বদলি (ডিলার ব্যবসা) ==========
   ১) দোকানদার ড্যামেজ ফেরত দিলে → বিক্রয় ফেরত (dmg) + বদলি বিক্রয় (repl): ড্যামেজ মাল আলাদা "ড্যামেজ স্টকে" জমা, বিক্রির স্টকে নয়
   ২) কোম্পানিকে ফেরত দিলে → ক্রয় ফেরত (dmg) + নতুন মাল ক্রয়: ড্যামেজ স্টক কমে, নতুন মাল বিক্রির স্টকে আসে
   সব বাকিতে (পেমেন্ট ০) — লাভ ও দেনা-পাওনা নিজে থেকে ঠিক থাকে */
const DMG_REASONS=['ড্যামেজ','মেয়াদ শেষ','অন্যান্য'];
function dmgPool(){return idx().dmg||{}}
const dmgLeft=pid=>r2((dmgPool()[pid])||0);
async function dmgMakeDoc(type,partyId,date,items,note,extra){
  const T=TYPES[type],sub=r2(items.reduce((a,i)=>a+num(i.qty)*num(i.price),0));
  const buy=type==='purchase'||type==='purchase_return';
  const doc={id:uid(),no:nextNo(T.pre),createdAt:Date.now(),type,date,partyId,
    items:items.map(i=>({pid:i.pid,name:i.name,qty:num(i.qty),price:num(i.price),cost:buy?num(i.price):num((S.products.get(i.pid)||{}).buyPrice)})),
    sub,disc:0,discMode:'amt',discVal:0,total:sub,paid:0,payCash:0,payBank:0,method:'cash',note,...extra};
  if(type==='sale')doc.freeItems=[];
  await save('docs',doc);return doc;
}
function dmgRowHTML(prods,i){
  return `<div class="dr" data-r="${i}" style="border:1px solid var(--b);border-radius:10px;padding:8px;margin-bottom:8px">
  <div class="row" style="flex-wrap:nowrap;gap:6px"><input type="text" class="dsq" placeholder="🔍 পণ্যের নাম বা বারকোড দিয়ে খুঁজুন" autocomplete="off" style="flex:1;min-width:0"><button class="btn o s dscan" type="button" title="ক্যামেরায় বারকোড স্ক্যান">📷 স্ক্যান</button><button class="btn o s dx" type="button">✕</button></div>
  <input type="hidden" class="dp" value="">
  <div class="dlist" style="display:none;margin-top:4px;max-height:210px;overflow:auto;border:1px solid var(--b);border-radius:8px;background:#fff"></div>
  <div class="dq" style="margin-top:6px;font-size:13px;color:var(--m)">পণ্য খুঁজে বাছলে পরিমাণ লেখার ঘর আসবে</div></div>`;
}
/* পণ্য খোঁজার তালিকা: নাম বা বারকোড লিখলে ছেঁকে দেখায়; ক্যামেরা/স্ক্যানার/Enter দিয়েও বাছা যায় */
function dmgBindPicker(rows,prods){
  const norm=x=>String(x||'').toLowerCase();
  const find=q=>{q=norm(q).trim();const bc=q&&prods.find(p=>norm(p.barcode)===q);if(bc)return[bc];
    return(q?prods.filter(p=>norm(p.name).includes(q)||norm(p.barcode).includes(q)):prods).slice(0,40)};
  const pick=(r,p)=>{const dp=r.querySelector('.dp'),sq=r.querySelector('.dsq');dp.value=p.id;sq.value=p.name;r.querySelector('.dlist').style.display='none';dp.dispatchEvent(new Event('change',{bubbles:true}))};
  const show=r=>{const sq=r.querySelector('.dsq'),box=r.querySelector('.dlist'),L=find(sq.value);r._opts=L;r._hi=0;
    box.innerHTML=L.length?L.map((p,i)=>`<div class="dopt" data-i="${i}" style="padding:9px 10px;border-bottom:1px solid var(--b);cursor:pointer;${i===0?'background:var(--pll)':''}"><b style="font-size:14px">${esc(p.name)}</b><br><small style="color:var(--m)">${p.barcode?'▮ '+esc(p.barcode)+' · ':''}স্টক ${esc(fq(p,stockOf(p.id)))}</small></div>`).join(''):'<div style="padding:10px;color:var(--m)">কোনো পণ্য পাওয়া যায়নি</div>';
    box.style.display='block'};
  rows.addEventListener('input',e=>{if(!e.target.classList.contains('dsq'))return;const r=e.target.closest('.dr');r.querySelector('.dp').value='';r.dataset.pid='';show(r)});
  rows.addEventListener('focusin',e=>{if(e.target.classList.contains('dsq')){const r=e.target.closest('.dr');if(!r.querySelector('.dp').value)show(r);else try{e.target.select()}catch(x){}}});
  rows.addEventListener('keydown',e=>{if(!e.target.classList.contains('dsq'))return;const r=e.target.closest('.dr'),box=r.querySelector('.dlist');
    const mark=()=>[...box.querySelectorAll('.dopt')].forEach((o,i)=>o.style.background=i===r._hi?'var(--pll)':'');
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(box.style.display==='none')show(r);const n=(r._opts||[]).length;if(n){r._hi=(r._hi+(e.key==='ArrowDown'?1:n-1))%n;mark();const o=box.querySelectorAll('.dopt')[r._hi];if(o)o.scrollIntoView({block:'nearest'})}}
    else if(e.key==='Enter'){e.preventDefault();e.stopPropagation();const L=r._opts||find(e.target.value);const p=L[r._hi||0]||L[0];if(p)pick(r,p)}
    else if(e.key==='Escape'&&box.style.display!=='none'){e.stopPropagation();box.style.display='none'}});
  rows.addEventListener('mousedown',e=>{const o=e.target.closest('.dopt');if(!o)return;e.preventDefault();const r=o.closest('.dr');pick(r,r._opts[+o.dataset.i])});
  rows.addEventListener('click',e=>{if(!e.target.classList.contains('dscan'))return;const r=e.target.closest('.dr');
    openScanner(code=>{const p=prods.find(x=>norm(x.barcode)===norm(code));if(!p){toast('এই বারকোডের পণ্য পাওয়া যায়নি: '+code,'e');return}pick(r,p);toast('✓ '+p.name,'k')},false)});
  rows.addEventListener('focusout',e=>{if(e.target.classList.contains('dsq')){const r=e.target.closest('.dr');setTimeout(()=>{const b=r&&r.querySelector('.dlist');if(b&&!r.contains(document.activeElement))b.style.display='none'},180)}});
}

/* ---- বদলি বাকি: ফেরত নেওয়া/দেওয়া ড্যামেজ বনাম বদলি মাল (দোকানদার ও কোম্পানি আলাদা) ----
   দোকানদার: ড্যামেজ ফেরত (sale_return) − বদলি দেওয়া (sale repl) = দোকানদারকে বদলি দিতে বাকি
   কোম্পানি: কোম্পানিকে ফেরত (purchase_return) − নতুন মাল পাওয়া (purchase repl) = কোম্পানির কাছে বদলি পাওনা
   পুরনো ফেরত আগে মেটে (FIFO), তাই "কতদিন ধরে বাকি" সবচেয়ে পুরনোটা থেকে গোনা হয়। */
function dmgPending(){
  const g={};
  live('docs').forEach(d=>{
    let side,k;
    if(d.type==='sale_return'&&d.dmg){side='shop';k=1}
    else if(d.type==='sale'&&d.repl){side='shop';k=-1}
    else if(d.type==='purchase_return'&&d.dmg){side='comp';k=1}
    else if(d.type==='purchase'&&d.repl){side='comp';k=-1}
    else return;
    (d.items||[]).forEach(i=>{if(i.rc)return;
      const key=side+'|'+(d.partyId||'')+'|'+i.pid;
      const o=g[key]=g[key]||{side,party:d.partyId||'',pid:i.pid,rets:[],repl:0};
      if(k>0)o.rets.push({date:d.date||'',at:num(d.createdAt),q:num(i.qty),price:num(i.price)});else o.repl+=num(i.qty)})});
  const out={shop:[],comp:[]};
  Object.values(g).forEach(o=>{
    o.rets.sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:a.at-b.at);
    let rem=o.repl,pend=0,since='',price=0;
    for(const r of o.rets){let q=r.q;const use=Math.min(q,rem);rem-=use;q-=use;if(q>1e-9){pend+=q;if(!since)since=r.date;price=r.price}}
    pend=Math.round(pend*1e6)/1e6; // r2 নয়: ১ পিস = ১/৪৮ কেস (০.০২০৮…) দুই দশমিকে গোল করলে ভুল হয়
    if(pend>0.0001&&S.products.get(o.pid)&&!S.products.get(o.pid).del){o.pend=pend;o.since=since;o.price=price;out[o.side].push(o)}});
  return out;
}
const dmgDays=d=>{if(!d)return 0;const t=new Date(d+'T00:00:00').getTime();return Math.max(0,Math.floor((Date.now()-t)/864e5))};
/* "বদলি বাকি" মিটিয়ে নেওয়া/মাফ: ওই পার্টি+পণ্যের সব ফেরত ও বদলি লাইনে rc চিহ্ন বসে, হিসাব থেকে বাদ যায় (স্টক/টাকার হিসাব বদলায় না) */
async function dmgCloseReplacement(side,partyId,pid){
  const list=[];
  live('docs').forEach(d=>{
    const ok=side==='shop'?((d.type==='sale_return'&&d.dmg)||(d.type==='sale'&&d.repl)):((d.type==='purchase_return'&&d.dmg)||(d.type==='purchase'&&d.repl));
    if(!ok||(d.partyId||'')!==partyId)return;
    if((d.items||[]).some(i=>i.pid===pid&&!i.rc))list.push(d)});
  for(const d of list){const nd={...d,items:d.items.map(i=>i.pid===pid?{...i,rc:1}:i)};await save('docs',nd)}
}
/* "বদলি লাগবে না" করা লাইনের তালিকা ও ফিরিয়ে আনা */
function dmgClosedList(side){
  const g={};
  live('docs').forEach(d=>{
    let k;
    if(side==='shop'){if(d.type==='sale_return'&&d.dmg)k=1;else if(d.type==='sale'&&d.repl)k=-1}
    else{if(d.type==='purchase_return'&&d.dmg)k=1;else if(d.type==='purchase'&&d.repl)k=-1}
    if(!k)return;
    (d.items||[]).forEach(i=>{if(!i.rc)return;const key=(d.partyId||'')+'|'+i.pid;const o=g[key]=g[key]||{party:d.partyId||'',pid:i.pid,net:0,date:''};
      o.net+=k*num(i.qty);if(k>0&&(!o.date||(d.date||'')<o.date))o.date=d.date||''})});
  return Object.values(g).filter(o=>S.products.get(o.pid)&&!S.products.get(o.pid).del);
}
async function dmgReopenReplacement(side,partyId,pid){
  const list=[];
  live('docs').forEach(d=>{
    const ok=side==='shop'?((d.type==='sale_return'&&d.dmg)||(d.type==='sale'&&d.repl)):((d.type==='purchase_return'&&d.dmg)||(d.type==='purchase'&&d.repl));
    if(!ok||(d.partyId||'')!==partyId)return;
    if((d.items||[]).some(i=>i.pid===pid&&i.rc))list.push(d)});
  for(const d of list){const nd={...d,items:d.items.map(i=>{if(i.pid!==pid||!i.rc)return i;const n={...i};delete n.rc;return n})};await save('docs',nd)}
}
/* পরে বদলি দেওয়া (দোকানদারকে) বা পরে নতুন মাল পাওয়া (কোম্পানি থেকে) */
function dmgReplForm(side,partyId){
  const P=dmgPending()[side].filter(o=>o.party===partyId).sort((a,b)=>S.products.get(a.pid).name.localeCompare(S.products.get(b.pid).name));
  if(!P.length)return toast('এই পার্টির বদলি বাকি নেই','k');
  const shop=side==='shop',party=S.parties.get(partyId);
  modal(shop?'🔁 দোকানদারকে বদলি মাল দিন':'📦 কোম্পানি থেকে বদলি মাল পেলাম',
  `<div class="grid g2"><div class="f"><label>তারিখ</label><input type="date" id="dr_d" value="${today()}"></div>
  <div class="f"><label>${shop?'দোকানদার':'কোম্পানি'}</label><input value="${esc(party?party.name:'')}" disabled></div></div>
  <div id="dr_rows">${P.map(o=>{const p=S.products.get(o.pid),pr=o.price||num(shop?p.sellPrice:p.buyPrice);
    return `<div class="dr" data-pid="${o.pid}" style="border:1px solid var(--b);border-radius:10px;padding:8px;margin-bottom:8px">
    <b>${esc(p.name)}</b> <small style="color:var(--m)">বদলি বাকি: ${esc(fq(p,o.pend))} · ${o.since?esc(o.since)+' থেকে ('+dmgDays(o.since)+' দিন)':''}</small>
    <div style="margin-top:6px">${shop?'এখন বদলি দিলাম':'নতুন মাল পেলাম'}: ${qtyHTML(p,o.pend,'rp')} <small style="color:var(--m)">(বাকি ঘর ফাঁকা/০ রাখলে পরে বাকি থাকবে)</small></div>
    <div style="margin-top:4px">${shop?'দাম':'ক্রয়মূল্য'} প্রতি ${esc(p.unit||'')}: <input type="number" step="any" class="dpr" value="${pr}" style="width:96px;padding:6px"></div></div>`}).join('')}</div>
  <p style="font-size:12px;color:var(--m)">${shop?'বদলি মাল দোকানদারকে বাকিতে দেওয়া হবে; ফেরত নেওয়ার সময়ের ক্রেডিট ও এই বিক্রয় মিলে বাকির হিসাব ঠিক থাকবে।':'নতুন মাল ক্রয় হিসেবে স্টকে যোগ হবে (বাকিতে); ড্যামেজ ফেরতের ক্রেডিট ও এই ক্রয় মিলে কোম্পানির হিসাব ঠিক থাকবে।'} বাকির বেশি লেখা যাবে না।</p>
  <div class="row"><button class="btn" id="dr_s">সেভ করুন</button><button class="btn o" id="dr_c">বাতিল</button></div>`,()=>{
    $('#dr_c').onclick=()=>closeModal();
    $('#dr_s').onclick=async()=>{
      const items=[];
      for(const r of $('#dr_rows').querySelectorAll('.dr')){
        const p=S.products.get(r.dataset.pid),o=P.find(x=>x.pid===p.id),q=qtyRead(r,'rp',p),price=num(r.querySelector('.dpr').value);
        if(q<=0)continue;
        if(q>o.pend+1e-4)return toast(p.name+': বাকির বেশি ('+fq(p,o.pend)+') লেখা যাবে না','e');
        items.push({pid:p.id,name:p.name,qty:q,price})}
      if(!items.length)return toast('অন্তত একটি পণ্যের পরিমাণ দিন','e');
      if(shop)for(const it of items){const s=stockOf(it.pid);if(s-it.qty<0&&!confirm(`${it.name}: স্টক ${fq(S.products.get(it.pid),s)}, বদলি ${fq(S.products.get(it.pid),it.qty)}। তবুও সেভ করবেন?`))return}
      const d=await dmgMakeDoc(shop?'sale':'purchase',partyId,$('#dr_d').value||today(),items,shop?'ড্যামেজ বদলি (পরে দেওয়া)':'ড্যামেজ বদলে নতুন মাল (পরে পাওয়া)',{repl:1,reason:'পরে বদলি',grp:uid()});
      closeModal();toast('সেভ হয়েছে: '+d.no,'k');if(CUR.r==='damage')SCR.damage();
    };
  });
}
function dmgOutForm(){
  const cus=live('parties').filter(p=>p.type==='customer').sort((a,b)=>a.name.localeCompare(b.name));
  const prods=live('products').sort((a,b)=>a.name.localeCompare(b.name));
  let n=0;
  modal('🔁 দোকানদারের ড্যামেজ ফেরত ও বদলি',`<div class="grid g2"><div class="f"><label>তারিখ</label><input type="date" id="do_d" value="${today()}"></div>
  <div class="f"><label>দোকানদার * <small style="color:var(--m)">(তালিকা থেকে বাছুন বা নিজে নাম লিখুন)</small></label><input id="do_pn" list="do_pl" autocomplete="off" placeholder="🔍 দোকানদারের নাম লিখুন বা বাছুন"><datalist id="do_pl">${cus.map(p=>`<option value="${esc(p.name)}">${esc(p.phone||'')}</option>`).join('')}</datalist><small id="do_pnote" style="color:var(--m);display:block;margin-top:3px"></small></div></div>
  <div class="f"><label>কারণ</label><select id="do_r">${DMG_REASONS.map(r=>`<option>${r}</option>`).join('')}</select></div>
  <label style="display:flex;gap:8px;align-items:center;margin-bottom:8px;padding:8px;border-radius:8px;background:var(--pll)"><input type="checkbox" id="do_later" style="width:auto"> <span><b>বদলি মাল পরে দেব</b> <small style="color:var(--m)">(এখন শুধু ড্যামেজ ফেরত নেব; বাকি থাকবে "দোকানদারকে বদলি বাকি" তালিকায়)</small></span></label>
  <div id="do_rows">${dmgRowHTML(prods,n++)}</div><button class="btn o s" id="do_add" type="button">+ আরেকটি পণ্য</button>
  <p style="font-size:12px;color:var(--m)">ফেরত নেওয়া ড্যামেজ মাল বিক্রির স্টকে যোগ হবে না, আলাদা ড্যামেজ স্টকে থাকবে। বদলি মাল দোকানদারকে বাকিতে (একই দামে) দেওয়া হবে, তাই বাকির হিসাব আগের মতোই থাকবে।</p>
  <div class="row"><button class="btn" id="do_s">সেভ করুন</button><button class="btn o" id="do_c">বাতিল</button></div>`,()=>{
    const rows=$('#do_rows');let later=false;
    const lockRep=()=>rows.querySelectorAll('[data-qk="rep"]').forEach(x=>{if(later)x.value='';x.disabled=later});
    $('#do_later').onchange=e=>{later=e.target.checked;lockRep();rows.querySelectorAll('[data-same]').forEach(b=>b.disabled=later)};
    const fill=r=>{ // পণ্য বাছার পর ঘরগুলো সাজানো
      const p=S.products.get(r.querySelector('.dp').value),q=r.querySelector('.dq');
      if(!p){q.innerHTML='পণ্য বাছলে পরিমাণ লেখার ঘর আসবে';return}
      r.dataset.pid=p.id;
      q.innerHTML=`<div>ফেরত নিলাম (ড্যামেজ): ${qtyHTML(p,0,'ret')}</div><div style="margin-top:4px">বদলি দিলাম (নতুন): ${qtyHTML(p,0,'rep')} <button class="btn o s" type="button" data-same="1"${''}>= সমান</button></div>
      <div style="margin-top:4px">দাম প্রতি ${esc(p.unit||'')}: <input type="number" step="any" class="dpr" value="${num(p.sellPrice)}" style="width:96px;padding:6px">${hasSub(p)?` <small>(প্রতি ${esc(p.subUnit)} ৳<span class="dps">${perSub(p,p.sellPrice)}</span>)</small>`:''}</div>`;
      lockRep();r.querySelectorAll('[data-same]').forEach(b=>b.disabled=later);
    };
    rows.addEventListener('change',e=>{if(e.target.classList.contains('dp'))fill(e.target.closest('.dr'))});
    dmgBindPicker(rows,prods);
    const nameHint=()=>{const v=$('#do_pn').value.trim().toLowerCase(),h=$('#do_pnote');if(!v){h.textContent='';return}const hit=cus.find(c=>c.name.trim().toLowerCase()===v);h.style.color=hit?'var(--g)':'var(--o)';h.textContent=hit?'✓ আগের দোকানদার':'➕ নতুন দোকানদার হিসেবে যোগ হবে'};
    $('#do_pn').addEventListener('input',nameHint);
    rows.addEventListener('input',e=>{
      const r=e.target.closest('.dr');if(!r)return;const p=S.products.get(r.dataset.pid);if(!p)return;
      if(e.target.classList.contains('dpr')){const s=r.querySelector('.dps');if(s)s.textContent=perSub(p,e.target.value)}
      if(e.target.dataset.qk==='ret'&&!r.dataset.touchedRep&&!later){ // বদলি ঘর অপরিবর্তিত থাকলে ফেরতের সমান ধরা
        const v=qtyRead(r,'ret',p),sp=splitQty(p,v);r.querySelectorAll('[data-qk="rep"]').forEach(x=>{x.value=x.dataset.part==='s'?(v?sp.s:''):(v?(hasSub(p)?sp.c:r2(v)):'')})}
      if(e.target.dataset.qk==='rep')r.dataset.touchedRep='1'});
    rows.addEventListener('click',e=>{
      const r=e.target.closest('.dr');if(!r)return;
      if(e.target.classList.contains('dx')){if(rows.children.length>1)r.remove();else{r.dataset.pid='';r.querySelector('.dp').value='';{const q=r.querySelector('.dsq');if(q)q.value=''}fill(r)}}
      if(e.target.dataset.same){const p=S.products.get(r.dataset.pid);if(!p)return;const v=qtyRead(r,'ret',p),sp=splitQty(p,v);r.querySelectorAll('[data-qk="rep"]').forEach(x=>{x.value=x.dataset.part==='s'?(v?sp.s:''):(v?(hasSub(p)?sp.c:r2(v)):'')});delete r.dataset.touchedRep}});
    $('#do_add').onclick=()=>{rows.insertAdjacentHTML('beforeend',dmgRowHTML(prods,n++))};
    $('#do_c').onclick=()=>closeModal();
    $('#do_s').onclick=async()=>{
      const typed=$('#do_pn').value.trim();if(!typed)return toast('দোকানদারের নাম লিখুন বা বাছুন','e');
      const ret=[],rep=[];
      for(const r of rows.querySelectorAll('.dr')){
        const p=S.products.get(r.dataset.pid);if(!p)continue;
        const q1=qtyRead(r,'ret',p),q2=later?0:qtyRead(r,'rep',p),price=num(r.querySelector('.dpr').value);
        if(q1<=0&&q2<=0)continue;if(q1<=0)return toast(p.name+': ফেরত নেওয়া পরিমাণ লিখুন','e');
        ret.push({pid:p.id,name:p.name,qty:q1,price});if(q2>0)rep.push({pid:p.id,name:p.name,qty:q2,price});
      }
      if(!ret.length)return toast('অন্তত একটি পণ্য ও ফেরত পরিমাণ দিন','e');
      for(const it of rep){const s=stockOf(it.pid);if(s-it.qty<0&&!confirm(`${it.name}: স্টক ${fq(S.products.get(it.pid),s)}, বদলি ${fq(S.products.get(it.pid),it.qty)}। তবুও সেভ করবেন?`))return}
      let party=live('parties').find(c=>c.type==='customer'&&c.name.trim().toLowerCase()===typed.toLowerCase());
      if(!party){party={id:uid(),createdAt:Date.now(),name:typed,type:'customer',phone:'',address:'',opening:0};await save('parties',party)}
      const pid=party.id;
      const date=$('#do_d').value||today(),reason=$('#do_r').value,grp=uid();
      const d1=await dmgMakeDoc('sale_return',pid,date,ret,'ড্যামেজ ফেরত ('+reason+')',{dmg:1,reason,grp});
      let d2=null;if(rep.length)d2=await dmgMakeDoc('sale',pid,date,rep,'ড্যামেজ বদল ('+reason+')',{repl:1,reason,grp});
      closeModal();toast('সেভ হয়েছে: '+d1.no+(d2?' ও '+d2.no:' — বদলি বাকি তালিকায় জমা হলো'),'k');if(CUR.r==='damage')SCR.damage();
    };
  });
}
function dmgInForm(){
  const sup=live('parties').filter(p=>p.type==='supplier').sort((a,b)=>a.name.localeCompare(b.name));
  const pool=Object.entries(dmgPool()).map(([pid,q])=>({p:S.products.get(pid),pid,q:r2(q)})).filter(a=>a.p&&!a.p.del&&a.q>0).sort((a,b)=>a.p.name.localeCompare(b.p.name));
  if(!pool.length)return toast('ড্যামেজ স্টক নেই — কোম্পানিকে ফেরত দেওয়ার মতো মাল নেই','e');
  if(!sup.length)return toast('আগে কোম্পানি/সাপ্লায়ার যোগ করুন','e');
  modal('↩ কোম্পানিকে ড্যামেজ ফেরত ও নতুন মাল',`<div class="grid g2"><div class="f"><label>তারিখ</label><input type="date" id="di_d" value="${today()}"></div>
  <div class="f"><label>কোম্পানি / সাপ্লায়ার *</label><select id="di_p"><option value="">-- নির্বাচন --</option>${sup.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div></div>
  <div class="row" style="flex-wrap:nowrap;gap:6px;margin-bottom:8px"><input type="text" id="di_q" placeholder="🔍 পণ্যের নাম বা বারকোড দিয়ে খুঁজুন" autocomplete="off" style="flex:1;min-width:0"><button class="btn o s" id="di_scan" type="button">📷 স্ক্যান</button></div>
  <label style="display:flex;gap:8px;align-items:center;margin-bottom:8px;padding:8px;border-radius:8px;background:var(--pll)"><input type="checkbox" id="di_later" style="width:auto"> <span><b>নতুন মাল পরে পাব</b> <small style="color:var(--m)">(এখন শুধু ফেরত দেব; বাকি থাকবে "কোম্পানির কাছে বদলি পাওনা" তালিকায়)</small></span></label>
  <div id="di_rows">${pool.map((a,i)=>`<div class="dr" data-pid="${a.pid}" data-sq="${esc((a.p.name+' '+(a.p.barcode||'')).toLowerCase())}" style="border:1px solid var(--b);border-radius:10px;padding:8px;margin-bottom:8px">
    <b>${esc(a.p.name)}</b> <small style="color:var(--m)">ড্যামেজ স্টকে আছে: ${esc(fq(a.p,a.q))}</small>
    <div style="margin-top:6px">ফেরত দিলাম: ${qtyHTML(a.p,a.q,'ret')}</div>
    <div style="margin-top:4px">নতুন মাল পেলাম: ${qtyHTML(a.p,a.q,'rep')}</div>
    <div style="margin-top:4px">ক্রয়মূল্য প্রতি ${esc(a.p.unit||'')}: <input type="number" step="any" class="dpr" value="${num(a.p.buyPrice)}" style="width:96px;padding:6px"></div></div>`).join('')}</div>
  <p style="font-size:12px;color:var(--m)">যা ফেরত দেবেন না, তার ঘর ফাঁকা বা ০ রাখুন। নতুন মাল পাওয়া না গেলে সেটিও ফাঁকা রাখুন (শুধু ফেরত হবে)। ড্যামেজ স্টকের বেশি ফেরত দেওয়া যাবে না। সব বাকিতে হবে, তাই দেনার হিসাব আগের মতোই থাকবে।</p>
  <div class="row"><button class="btn" id="di_s">সেভ করুন</button><button class="btn o" id="di_c">বাতিল</button></div>`,()=>{
    const rows=$('#di_rows');let later=false;
    $('#di_later').onchange=e=>{later=e.target.checked;rows.querySelectorAll('[data-qk="rep"]').forEach(x=>{if(later)x.value='';x.disabled=later})};
    rows.addEventListener('input',e=>{const r=e.target.closest('.dr');if(!r||e.target.dataset.qk!=='ret'||r.dataset.touchedRep||later)return;const p=S.products.get(r.dataset.pid),v=qtyRead(r,'ret',p),sp=splitQty(p,v);
      r.querySelectorAll('[data-qk="rep"]').forEach(x=>{x.value=x.dataset.part==='s'?(v?sp.s:''):(v?(hasSub(p)?sp.c:r2(v)):'')})});
    rows.addEventListener('input',e=>{if(e.target.dataset.qk==='rep')e.target.closest('.dr').dataset.touchedRep='1'});
    const flt=()=>{const q=$('#di_q').value.trim().toLowerCase();let n=0;rows.querySelectorAll('.dr').forEach(r=>{const ok=!q||r.dataset.sq.includes(q);r.style.display=ok?'':'none';if(ok)n++});let m=$('#di_none');if(!m){m=document.createElement('div');m.id='di_none';m.style.cssText='padding:10px;color:var(--m)';m.textContent='কোনো ড্যামেজ পণ্য পাওয়া যায়নি';rows.after(m)}m.style.display=n?'none':'block'};
    $('#di_q').addEventListener('input',flt);$('#di_q').onkeydown=e=>{if(e.key==='Enter')e.preventDefault()};
    $('#di_scan').onclick=()=>openScanner(code=>{const hit=[...rows.querySelectorAll('.dr')].find(r=>{const p=S.products.get(r.dataset.pid);return p&&String(p.barcode||'').toLowerCase()===String(code).toLowerCase()});if(!hit){toast('এই বারকোডের পণ্য ড্যামেজ স্টকে নেই: '+code,'e');return}$('#di_q').value=code;flt();toast('✓ পাওয়া গেছে','k')},false);
    $('#di_c').onclick=()=>closeModal();
    $('#di_s').onclick=async()=>{
      const pid=$('#di_p').value;if(!pid)return toast('কোম্পানি নির্বাচন করুন','e');
      const ret=[],neu=[],left=dmgPool();
      for(const r of rows.querySelectorAll('.dr')){
        const p=S.products.get(r.dataset.pid),q1=qtyRead(r,'ret',p),q2=later?0:qtyRead(r,'rep',p),price=num(r.querySelector('.dpr').value);
        if(q1<=0&&q2<=0)continue;if(q1<=0)return toast(p.name+': ফেরত পরিমাণ লিখুন','e');
        if(q1>(left[p.id]||0)+1e-9)return toast(p.name+': ড্যামেজ স্টকের বেশি ফেরত দেওয়া যাবে না (আছে '+fq(p,left[p.id]||0)+')','e');
        ret.push({pid:p.id,name:p.name,qty:q1,price});if(q2>0)neu.push({pid:p.id,name:p.name,qty:q2,price});
      }
      if(!ret.length)return toast('অন্তত একটি পণ্যের ফেরত পরিমাণ দিন','e');
      const date=$('#di_d').value||today(),grp=uid();
      const d1=await dmgMakeDoc('purchase_return',pid,date,ret,'ড্যামেজ ফেরত (কোম্পানিকে)',{dmg:1,reason:'কোম্পানিকে ফেরত',grp});
      let d2=null;if(neu.length)d2=await dmgMakeDoc('purchase',pid,date,neu,'ড্যামেজ বদলে নতুন মাল',{repl:1,reason:'কোম্পানিকে ফেরত',grp});
      closeModal();toast('সেভ হয়েছে: '+d1.no+(d2?' ও '+d2.no:' — বদলি পাওনা তালিকায় জমা হলো'),'k');if(CUR.r==='damage')SCR.damage();
    };
  });
}

/* ---- ড্যামেজ পেজ ---- */
let DM={tab:'pool'};
SCR.damage=()=>{
  const X=idx(),pool=X.dmg||{},PD=dmgPending();
  const inn={},out={},shop={};let val=0,tin=0,tout=0;
  live('docs').forEach(d=>{
    if(!d.dmg)return;
    (d.items||[]).forEach(i=>{
      if(d.type==='sale_return'){inn[i.pid]=(inn[i.pid]||0)+num(i.qty);const o=shop[d.partyId||'']=shop[d.partyId||'']||{v:0,l:{}};o.v+=num(i.qty)*num(i.price);o.l[i.pid]=(o.l[i.pid]||0)+num(i.qty)}
      else if(d.type==='purchase_return')out[i.pid]=(out[i.pid]||0)+num(i.qty)})});
  Object.entries(pool).forEach(([pid,q])=>{const p=S.products.get(pid);if(p&&q>0)val+=q*num(p.buyPrice)});
  const pids=[...new Set([...Object.keys(inn),...Object.keys(out)])].map(id=>S.products.get(id)).filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name));
  const left=pids.reduce((a,p)=>a+((pool[p.id]||0)>0?1:0),0);
  const card=(l,v,c)=>`<div style="flex:1;min-width:120px;background:var(--pll);border-radius:10px;padding:10px 12px"><div style="font-size:12px;color:var(--m)">${l}</div><div style="font-size:20px;font-weight:700;color:${c}">${v}</div></div>`;
  const tabs=[['pool','ড্যামেজ স্টক'],['pshop','দোকানদারকে বদলি বাকি ('+PD.shop.length+')'],['pcomp','কোম্পানির কাছে বদলি পাওনা ('+PD.comp.length+')'],['shop','দোকানদার অনুযায়ী'],['hist','ইতিহাস']];
  view(`<div class="card"><div class="row sp"><h3 style="margin:0">🔁 ড্যামেজ ফেরত ও বদলি</h3><div class="row"><button class="btn" id="dout">+ দোকানদারের ড্যামেজ ফেরত</button><button class="btn o" id="din">↩ কোম্পানিকে ফেরত</button></div></div>
  <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap">${card('কোম্পানিকে ফেরত দিতে বাকি',left+'টি পণ্য','var(--o)')}${card('এর ক্রয়মূল্য',money(val),'var(--pd)')}${card('দোকানদারকে বদলি দিতে বাকি',PD.shop.length+'টি পণ্য',PD.shop.length?'var(--o)':'var(--g)')}${card('কোম্পানির কাছে বদলি পাওনা',PD.comp.length+'টি পণ্য',PD.comp.length?'var(--o)':'var(--g)')}</div>
  <p style="color:var(--m);font-size:12px;margin:8px 0 0">ক্রয়মূল্যের এই অংশ কোম্পানির কাছে আপনার ফেরতযোগ্য সম্পদ (ব্যালেন্স শীটে "ড্যামেজ মাল" নামে আছে)।</p></div>
  <div class="card"><div class="tabs">${tabs.map(([k,l])=>`<button class="btn s ${DM.tab===k?'':'o'}" data-dt="${k}">${l}</button>`).join('')}</div><div id="dbody"></div></div>`);
  $$('[data-dt]').forEach(b=>b.onclick=()=>{DM.tab=b.dataset.dt;SCR.damage()});
  $('#dout').onclick=dmgOutForm;$('#din').onclick=dmgInForm;
  const body=$('#dbody');
  if(DM.tab==='pool'){
    body.innerHTML=pids.length?tblc(['পণ্য','>দোকানদারের কাছ থেকে পেয়েছি','>কোম্পানিকে ফেরত দিয়েছি','>বাকি'],pids.map(p=>[`${imgTag(p.id,'pthm')}${esc(p.name)}`,esc(fq(p,inn[p.id]||0)),esc(fq(p,out[p.id]||0)),`<b style="color:${(pool[p.id]||0)>0?'var(--o)':'var(--g)'}">${esc(fq(p,Math.max(0,pool[p.id]||0)))}</b>`]),['মোট '+pids.length+'টি পণ্য','','','']):'<div class="empty">কোনো ড্যামেজ ফেরত এখনো নেই</div>';
  }else if(DM.tab==='pshop'||DM.tab==='pcomp'){
    const sd=DM.tab==='pshop'?'shop':'comp',L=PD[sd].sort((a,b)=>(a.since||'').localeCompare(b.since||'')),shopSide=sd==='shop';
    const col=n=>n>=30?'var(--r,#c0392b)':n>=7?'var(--o)':'var(--m)';
    body.innerHTML=L.length?`<p style="color:var(--m);font-size:12px;margin:0 0 8px">${shopSide?'দোকানদারের ড্যামেজ নিয়েছেন কিন্তু বদলি মাল এখনো দেননি — পুরনো আগে দেখাচ্ছে।':'কোম্পানিকে ড্যামেজ ফেরত দিয়েছেন কিন্তু নতুন মাল এখনো পাননি — পুরনো আগে দেখাচ্ছে।'}</p>`+tblc([shopSide?'দোকানদার':'কোম্পানি','পণ্য','>বাকি','কতদিন','',''],L.map(o=>{const p=S.products.get(o.pid),n=dmgDays(o.since);
      return [esc(partyName(o.party)),`${imgTag(p.id,'pthm')}${esc(p.name)}`,`<b style="color:var(--o)">${esc(fq(p,o.pend))}</b>`,`<span style="color:${col(n)}">${n} দিন <small>(${esc(o.since||'')})</small></span>`,
        `<button class="btn s" data-rp="${o.party}">${shopSide?'বদলি দিন':'নতুন মাল পেলাম'}</button>`,`<button class="btn o s" data-rc="${o.party}|${o.pid}" title="মাল না দিয়েই লাইনটি তালিকা থেকে সরায় — স্টক কমে না">🚫 বদলি লাগবে না</button>`]}),['মোট '+L.length+'টি','','','','','']):`<div class="empty">${shopSide?'দোকানদারকে কোনো বদলি বাকি নেই 🎉':'কোম্পানির কাছে কোনো বদলি পাওনা নেই 🎉'}</div>`;
    $$('[data-rp]').forEach(b=>b.onclick=()=>dmgReplForm(sd,b.dataset.rp));
    $$('[data-rc]').forEach(b=>b.onclick=async()=>{const[pt,pd]=b.dataset.rc.split('|'),p=S.products.get(pd);
      if(!confirm((p?p.name:'')+' — '+partyName(pt)+'\n⚠ এতে কোনো মাল দেওয়া/পাওয়া হবে না, স্টকও কমবে-বাড়বে না। শুধু তালিকা থেকে সরবে (পরে নিচের "বদলি লাগবে না" তালিকা থেকে ফেরানো যাবে)।\n\nমাল দিতে চাইলে বাতিল করে "'+(shopSide?'বদলি দিন':'নতুন মাল পেলাম')+'" চাপুন। তবুও সরাবেন?'))return;
      await dmgCloseReplacement(sd,pt,pd);toast('তালিকা থেকে সরানো হয়েছে — স্টক বদলায়নি','k');SCR.damage()});
    const CL=dmgClosedList(sd);
    if(CL.length){body.insertAdjacentHTML('beforeend',`<h4 style="margin:16px 0 6px">🚫 "বদলি লাগবে না" করা লাইন</h4><p style="color:var(--m);font-size:12px;margin:0 0 6px">ভুলে করে থাকলে "↩ ফিরিয়ে আনুন" চাপুন, লাইনটি আবার ওপরের তালিকায় যাবে।</p>`+tblc([shopSide?'দোকানদার':'কোম্পানি','পণ্য','>তখন বাকি ছিল',''],CL.map(o=>{const p=S.products.get(o.pid);return [esc(partyName(o.party)),esc(p.name),esc(fq(p,Math.max(0,o.net))),`<button class="btn o s" data-ro="${o.party}|${o.pid}">↩ ফিরিয়ে আনুন</button>`]}),['','','','']));
      $$('[data-ro]').forEach(b=>b.onclick=async()=>{const[pt,pd]=b.dataset.ro.split('|');await dmgReopenReplacement(sd,pt,pd);toast('ফিরিয়ে আনা হয়েছে','k');SCR.damage()})}
  }else if(DM.tab==='shop'){
    const rows=Object.entries(shop).sort((a,b)=>b[1].v-a[1].v);
    body.innerHTML=rows.length?tblc(['দোকানদার','>মূল্য (বিক্রয়মূল্যে)','কী কী'],rows.map(([k,o])=>[esc(partyName(k)),money(o.v),Object.entries(o.l).map(([pid,q])=>{const p=S.products.get(pid);return esc(p?p.name:'?')+' × '+esc(fq(p,q))}).join(', ')]),['মোট '+rows.length+' জন','','']):'<div class="empty">কোনো ড্যামেজ ফেরত এখনো নেই</div>';
  }else{
    const hs=live('docs').filter(d=>d.dmg||d.repl).sort((a,b)=>(b.date||'').localeCompare(a.date||'')||num(b.createdAt)-num(a.createdAt));
    body.innerHTML=hs.length?tblc(['তারিখ','ধরন','পার্টি','পণ্য','>মোট',''],hs.map(d=>[d.date||'',esc(TYPES[d.type].l)+(d.dmg?' <span class="bd br">ড্যামেজ</span>':' <span class="bd bo">বদলি</span>'),esc(partyName(d.partyId)),(d.items||[]).map(i=>esc(i.name)+' × '+esc(fq(S.products.get(i.pid),i.qty))).join(', '),money(d.total),`<button class="btn o s" data-hv="${d.id}">${esc(d.no)}</button>`]),['মোট '+hs.length+'টি','','','','','']):'<div class="empty">ইতিহাস নেই</div>';
  }
  $$('[data-hv]').forEach(b=>b.onclick=()=>viewDoc(b.dataset.hv));
};

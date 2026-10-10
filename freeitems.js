'use strict';
/* ========== কোম্পানির ফ্রি আইটেম: আলাদা হিসাব (প্রাপ্তি − দেওয়া = অবশিষ্ট), মূল স্টক/লাভ/টাকার সাথে সম্পর্ক নেই ========== */
const FI_IN=()=>live('meta').filter(m=>m.kind==='freein');
const FI_MAN=()=>live('meta').filter(m=>m.kind==='freeout');
function freeStats(exDoc){
  const m=new Map(),g=pid=>{let o=m.get(pid);if(!o){o={in:0,man:0,sale:0};m.set(pid,o)}return o};
  FI_IN().forEach(r=>{g(r.pid).in+=num(r.qty)});FI_MAN().forEach(r=>{g(r.pid).man+=num(r.qty)});
  live('docs').forEach(d=>{if(d.type==='sale'&&d.id!==exDoc)(d.freeItems||[]).forEach(x=>{g(x.pid).sale+=num(x.qty)})});
  m.forEach(o=>{o.in=r2(o.in);o.out=r2(o.man+o.sale);o.rem=r2(o.in-o.out)});
  return m;
}
const freeMerge=l=>{const o={};(l||[]).forEach(x=>{if(!o[x.pid])o[x.pid]={pid:x.pid,name:x.name,qty:0};o[x.pid].qty+=num(x.qty)});return Object.values(o)};
const pUnit=p=>p&&p.unit?' '+esc(p.unit):'';

/* ---- বিক্রয় পেজে আলাদা ফ্রি অংশ ---- */
function paintFree(){
  const box=$('#fsec');if(!box||!POS||POS.type!=='sale')return;
  POS.free=POS.free||[];
  const st=freeStats(POS.editId),used={};POS.free.forEach(x=>{used[x.pid]=(used[x.pid]||0)+num(x.qty)});
  const avail=[...st.entries()].map(([pid,o])=>({p:S.products.get(pid),rem:r2(o.rem-(used[pid]||0))})).filter(a=>a.p&&!a.p.del&&a.rem>0).sort((a,b)=>a.p.name.localeCompare(b.p.name));
  const anyStock=[...st.values()].some(o=>o.rem>0);
  box.innerHTML=`<div style="border:1px dashed var(--g);border-radius:10px;padding:10px;margin:10px 0;background:#f4fbf6">
  <div><b style="color:var(--g)">🎁 ফ্রি আইটেম</b> <small style="color:var(--m)">কোম্পানির ফ্রি স্টক থেকে · বিলের টাকা ও লাভে যুক্ত হবে না</small></div>
  ${POS.free.map((x,i)=>{const mx=r2((st.get(x.pid)?st.get(x.pid).rem:0)-(used[x.pid]||0)+num(x.qty));return `<div class="row" style="flex-wrap:nowrap;align-items:center;margin-top:6px"><span style="flex:1;min-width:0;font-size:14px">${esc(x.name)}<br><small style="color:var(--m)">সর্বোচ্চ ${mx}</small></span><input type="number" data-fq="${i}" data-mx="${mx}" min="0" step="any" value="${x.qty}" style="width:84px"><button class="btn o s" data-fd="${i}" type="button">✕</button></div>`}).join('')}
  ${avail.length?`<div class="row" style="flex-wrap:nowrap;margin-top:8px"><select id="fpid" style="flex:1;min-width:0">${avail.map(a=>`<option value="${a.p.id}" data-r="${a.rem}">${esc(a.p.name)} — অবশিষ্ট ${a.rem}${a.p.unit?' '+esc(a.p.unit):''}</option>`).join('')}</select><input type="number" id="fqty" min="0" step="any" value="1" style="width:84px"><button class="btn s gr" id="fadd" type="button">+ ফ্রি দিন</button></div>`
   :`<div style="margin-top:6px;font-size:13px;color:var(--m)">${anyStock?'সব ফ্রি পণ্য এই বিলে যোগ হয়ে গেছে।':'ফ্রি স্টক নেই। "কোম্পানির ফ্রি আইটেম" পেজে প্রাপ্তি যোগ করুন।'}</div>`}</div>`;
  const add=$('#fadd');
  if(add)add.onclick=()=>{const sel=$('#fpid'),pid=sel.value,rem=num(sel.selectedOptions[0].dataset.r),q=num($('#fqty').value);
    if(q<=0)return toast('পরিমাণ লিখুন','e');
    if(q>rem+1e-9)return toast('ফ্রি স্টকের চেয়ে বেশি দেওয়া যাবে না (অবশিষ্ট '+rem+')','e');
    const ex=POS.free.find(x=>x.pid===pid);if(ex)ex.qty=r2(num(ex.qty)+q);else POS.free.push({pid,name:S.products.get(pid).name,qty:q});
    paintFree()};
  box.querySelectorAll('[data-fq]').forEach(e=>{
    e.oninput=()=>{POS.free[+e.dataset.fq].qty=num(e.value)};
    e.onchange=()=>{const mx=num(e.dataset.mx);if(num(e.value)>mx){toast('ফ্রি স্টকের চেয়ে বেশি দেওয়া যাবে না (সর্বোচ্চ '+mx+')','e');e.value=mx;POS.free[+e.dataset.fq].qty=mx}paintFree()}});
  box.querySelectorAll('[data-fd]').forEach(b=>b.onclick=()=>{POS.free.splice(+b.dataset.fd,1);paintFree()});
}
function freeCheck(){ // সেভের আগে কঠোর যাচাই; ঠিক থাকলে মার্জ করা তালিকা ফেরত, নইলে null
  const list=freeMerge(POS.free);if(!list.length)return [];
  const st=freeStats(POS.editId);
  for(const x of list){
    if(x.qty<=0){toast('ফ্রি আইটেমের পরিমাণ ০ এর বেশি হতে হবে','e');return null}
    const rem=st.get(x.pid)?st.get(x.pid).rem:0;
    if(x.qty>rem+1e-9){toast(x.name+': ফ্রি স্টকের চেয়ে বেশি দেওয়া যাবে না (অবশিষ্ট '+Math.max(0,rem)+')','e');return null}
  }
  return list;
}

/* ---- ফ্রি আইটেম পেজ ---- */
let FS={tab:'prod',q:''};
const findProd=t=>{t=String(t||'').trim().toLowerCase();if(!t)return null;return live('products').find(p=>(p.barcode&&String(p.barcode).toLowerCase()===t)||p.name.toLowerCase()===t)||null};
SCR.freestock=()=>{
  const st=freeStats(),pn=id=>{const p=S.products.get(id);return p?esc(p.name):'(মুছে ফেলা পণ্য)'};
  let tin=0,tout=0;st.forEach(o=>{tin+=o.in;tout+=o.out});
  const card=(l,v,c)=>`<div style="flex:1;min-width:110px;background:var(--pll);border-radius:10px;padding:10px 12px"><div style="font-size:12px;color:var(--m)">${l}</div><div style="font-size:22px;font-weight:700;color:${c}">${r2(v)}</div></div>`;
  const tabs=[['prod','পণ্য অনুযায়ী'],['in','প্রাপ্তি তালিকা'],['out','দেওয়ার তালিকা'],['cus','কাস্টমার অনুযায়ী']];
  view(`<div class="card"><div class="row sp"><h3 style="margin:0">🎁 কোম্পানির ফ্রি আইটেম</h3><div class="row"><button class="btn" id="fin">+ প্রাপ্তি যোগ</button><button class="btn o" id="fout">🎁 কাস্টমারকে ফ্রি দিন</button></div></div>
  <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap">${card('কোম্পানি থেকে পেয়েছি',tin,'var(--pd)')}${card('কাস্টমারকে দিয়েছি',tout,'var(--o)')}${card('অবশিষ্ট',tin-tout,tin-tout<0?'var(--r)':'var(--g)')}</div></div>
  <div class="card"><div class="tabs">${tabs.map(([k,l])=>`<button class="btn s ${FS.tab===k?'':'o'}" data-ft="${k}">${l}</button>`).join('')}</div>
  ${FS.tab==='prod'?`<input id="fq" placeholder="পণ্য খুঁজুন..." value="${esc(FS.q)}" style="margin-bottom:8px">`:''}<div id="fbody"></div></div>`);
  $$('[data-ft]').forEach(b=>b.onclick=()=>{FS.tab=b.dataset.ft;SCR.freestock()});
  $('#fin').onclick=()=>freeInForm();$('#fout').onclick=()=>freeOutForm();
  const body=$('#fbody'),T=(c,r,f)=>tblc(c,r,f);
  const btns=(id,k)=>`<button class="btn o s" data-fe="${k}:${id}">এডিট</button> <button class="btn d s" data-fx="${k}:${id}">ডিলিট</button>`;
  if(FS.tab==='prod'){
    const q=FS.q.trim().toLowerCase();
    const rows=[...st.entries()].map(([pid,o])=>({pid,o,p:S.products.get(pid)})).filter(a=>a.p&&(!q||a.p.name.toLowerCase().includes(q)||String(a.p.barcode||'').includes(q))).sort((a,b)=>a.p.name.localeCompare(b.p.name));
    body.innerHTML=T(['পণ্য','>পেয়েছি','>দিয়েছি','>অবশিষ্ট'],rows.map(a=>[`${imgTag(a.pid,'pthm')}${esc(a.p.name)}`,r2(a.o.in)+pUnit(a.p),r2(a.o.out)+pUnit(a.p),`<b style="color:${a.o.rem<=0?'var(--r)':'var(--g)'}">${a.o.rem}${pUnit(a.p)}</b>`]),['মোট '+rows.length+'টি পণ্য','','','']);
    $('#fq').oninput=e=>{FS.q=e.target.value;const pos=e.target.selectionStart;SCR.freestock();const n=$('#fq');n.focus();n.setSelectionRange(pos,pos)};
  }else if(FS.tab==='in'){
    const rows=FI_IN().sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(b.createdAt||0)-(a.createdAt||0));
    body.innerHTML=T(['তারিখ','কোম্পানি','পণ্য','>পরিমাণ','নোট',''],rows.map(r=>[r.date||'',r.partyId?partyName(r.partyId):'-',pn(r.pid),r2(r.qty),esc(r.note||''),btns(r.id,'in')]),['মোট '+rows.length+'টি','','',r2(rows.reduce((a,r)=>a+num(r.qty),0)),'','']);
  }else if(FS.tab==='out'||FS.tab==='cus'){
    const out=[];
    FI_MAN().forEach(r=>out.push({date:r.date||'',pid:r.pid,qty:num(r.qty),party:r.partyId,note:r.note||'',src:'man',id:r.id}));
    live('docs').forEach(d=>{if(d.type==='sale')(d.freeItems||[]).forEach(x=>out.push({date:d.date||'',pid:x.pid,qty:num(x.qty),party:d.partyId,note:'',src:'doc',id:d.id,no:d.no}))});
    out.sort((a,b)=>b.date.localeCompare(a.date));
    if(FS.tab==='out'){
      body.innerHTML=T(['তারিখ','কাস্টমার','পণ্য','>পরিমাণ','সূত্র',''],out.map(r=>[r.date,partyName(r.party),pn(r.pid),r2(r.qty),r.src==='doc'?'বিক্রয় '+esc(r.no||''):esc(r.note||'সরাসরি'),r.src==='doc'?`<button class="btn o s" data-fv="${r.id}">ইনভয়েস</button>`:btns(r.id,'out')]),['মোট '+out.length+'টি','','',r2(out.reduce((a,r)=>a+r.qty,0)),'','']);
    }else{
      const g={};out.forEach(r=>{const k=r.party||'';(g[k]=g[k]||{n:0,l:{}});g[k].n+=r.qty;g[k].l[r.pid]=(g[k].l[r.pid]||0)+r.qty});
      const rows=Object.entries(g).sort((a,b)=>b[1].n-a[1].n);
      body.innerHTML=T(['কাস্টমার','>মোট ফ্রি','কী কী'],rows.map(([k,o])=>[partyName(k),r2(o.n),Object.entries(o.l).map(([pid,q])=>pn(pid)+' × '+r2(q)).join(', ')]),['মোট '+rows.length+' জন','','']);
    }
  }
  $$('[data-fv]').forEach(b=>b.onclick=()=>viewDoc(b.dataset.fv));
  $$('[data-fe]').forEach(b=>{const[k,id]=b.dataset.fe.split(':');b.onclick=()=>k==='in'?freeInForm(S.meta.get(id)):freeOutForm(S.meta.get(id))});
  $$('[data-fx]').forEach(b=>{const[k,id]=b.dataset.fx.split(':');b.onclick=async()=>{
    const r=S.meta.get(id);if(!r)return;
    if(k==='in'){const o=freeStats().get(r.pid);const after=r2((o?o.in:0)-num(r.qty)-(o?o.out:0));
      if(after<0)return toast('এই প্রাপ্তি মুছলে দেওয়া ফ্রি পণ্যের চেয়ে স্টক কমে যায় (অবশিষ্ট '+after+')। আগে দেওয়ার হিসাব ঠিক করুন।','e')}
    if(!confirm('মুছে ফেলবেন?'))return;await remove('meta',r);toast('মুছে ফেলা হয়েছে','k');SCR.freestock()}});
};
function prodDatalist(){return `<datalist id="fpl">${live('products').sort((a,b)=>a.name.localeCompare(b.name)).map(p=>`<option value="${esc(p.name)}">${esc(p.barcode||'')}</option>`).join('')}</datalist>`}
function freeInForm(rec){
  const sup=live('parties').filter(p=>p.type==='supplier').sort((a,b)=>a.name.localeCompare(b.name)),pr=rec?S.products.get(rec.pid):null;
  modal(rec?'প্রাপ্তি এডিট':'কোম্পানি থেকে ফ্রি প্রাপ্তি',`<div class="grid g2"><div class="f"><label>তারিখ</label><input type="date" id="fi_d" value="${rec?rec.date:today()}"></div>
  <div class="f"><label>কোম্পানি / সাপ্লায়ার</label><select id="fi_p"><option value="">-- ঐচ্ছিক --</option>${sup.map(p=>`<option value="${p.id}" ${rec&&rec.partyId===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div></div>
  <div class="f"><label>পণ্য (নাম বা বারকোড) *</label><input id="fi_n" list="fpl" autocomplete="off" value="${pr?esc(pr.name):''}" placeholder="পণ্যের নাম লিখুন বা বাছুন">${prodDatalist()}</div>
  <div class="f"><label>ফ্রি পরিমাণ *</label><input type="number" id="fi_q" min="0" step="any" value="${rec?rec.qty:''}"></div>
  <div class="f"><label>নোট</label><input id="fi_t" value="${esc(rec?rec.note||'':'')}"></div>
  <div class="row"><button class="btn" id="fi_s">${rec?'আপডেট':'সেভ করুন'}</button><button class="btn o" id="fi_c">বাতিল</button></div>`,()=>{
    $('#fi_c').onclick=()=>closeModal();
    $('#fi_s').onclick=async()=>{
      const p=findProd($('#fi_n').value),q=num($('#fi_q').value);
      if(!p)return toast('তালিকা থেকে সঠিক পণ্য বাছুন','e');if(q<=0)return toast('পরিমাণ লিখুন','e');
      if(rec&&rec.pid===p.id){const o=freeStats().get(p.id);const after=r2((o?o.in:0)-num(rec.qty)+q-(o?o.out:0));if(after<0)return toast('এই পরিমাণ কমালে দেওয়া ফ্রির চেয়ে স্টক কম হয়ে যায়','e')}
      else if(rec){const o=freeStats().get(rec.pid);if(r2((o?o.in:0)-num(rec.qty)-(o?o.out:0))<0)return toast('আগের পণ্যের দেওয়া ফ্রি আছে, পণ্য বদলানো যাবে না','e')}
      await save('meta',{...(rec||{id:uid(),kind:'freein',createdAt:Date.now()}),kind:'freein',date:$('#fi_d').value||today(),partyId:$('#fi_p').value,pid:p.id,qty:q,note:$('#fi_t').value.trim()});
      closeModal();toast('সেভ হয়েছে','k');if(CUR.r==='freestock')SCR.freestock()};
  });
}
function freeOutForm(rec){
  const st=freeStats(),cus=live('parties').filter(p=>p.type==='customer').sort((a,b)=>a.name.localeCompare(b.name));
  const avail=[...st.entries()].map(([pid,o])=>({p:S.products.get(pid),rem:r2(o.rem+(rec&&rec.pid===pid?num(rec.qty):0))})).filter(a=>a.p&&!a.p.del&&a.rem>0).sort((a,b)=>a.p.name.localeCompare(b.p.name));
  if(!avail.length)return toast('ফ্রি স্টক নেই — আগে প্রাপ্তি যোগ করুন','e');
  modal(rec?'ফ্রি দেওয়া এডিট':'কাস্টমারকে ফ্রি দিন',`<div class="grid g2"><div class="f"><label>তারিখ</label><input type="date" id="fo_d" value="${rec?rec.date:today()}"></div>
  <div class="f"><label>কাস্টমার *</label><select id="fo_p"><option value="">-- নির্বাচন --</option>${cus.map(p=>`<option value="${p.id}" ${rec&&rec.partyId===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div></div>
  <div class="f"><label>পণ্য *</label><select id="fo_n">${avail.map(a=>`<option value="${a.p.id}" data-r="${a.rem}" ${rec&&rec.pid===a.p.id?'selected':''}>${esc(a.p.name)} — অবশিষ্ট ${a.rem}</option>`).join('')}</select></div>
  <div class="f"><label>পরিমাণ * <small id="fo_h" style="color:var(--m)"></small></label><input type="number" id="fo_q" min="0" step="any" value="${rec?rec.qty:''}"></div>
  <div class="f"><label>নোট</label><input id="fo_t" value="${esc(rec?rec.note||'':'')}"></div>
  <div class="row"><button class="btn" id="fo_s">${rec?'আপডেট':'সেভ করুন'}</button><button class="btn o" id="fo_c">বাতিল</button></div>`,()=>{
    const hint=()=>{$('#fo_h').textContent='(সর্বোচ্চ '+$('#fo_n').selectedOptions[0].dataset.r+')'};hint();$('#fo_n').onchange=hint;
    $('#fo_c').onclick=()=>closeModal();
    $('#fo_s').onclick=async()=>{
      const pid=$('#fo_n').value,rem=num($('#fo_n').selectedOptions[0].dataset.r),q=num($('#fo_q').value);
      if(!$('#fo_p').value)return toast('কাস্টমার নির্বাচন করুন','e');if(q<=0)return toast('পরিমাণ লিখুন','e');
      if(q>rem+1e-9)return toast('ফ্রি স্টকের চেয়ে বেশি দেওয়া যাবে না (অবশিষ্ট '+rem+')','e');
      await save('meta',{...(rec||{id:uid(),kind:'freeout',createdAt:Date.now()}),kind:'freeout',date:$('#fo_d').value||today(),partyId:$('#fo_p').value,pid,qty:q,note:$('#fo_t').value.trim()});
      closeModal();toast('সেভ হয়েছে','k');if(CUR.r==='freestock')SCR.freestock()};
  });
}

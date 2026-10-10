'use strict';
/* ========== কোম্পানির ফ্রি আইটেম: নিজস্ব ফ্রি-পণ্য তালিকা (ডিটেইল সহ), পিছ হিসাব, স্কিম, আলাদা হিসাব ========== */
/* ফ্রি পণ্য = meta{kind:'freeprod'}; প্রাপ্তি = meta{kind:'freein'}; সরাসরি দেওয়া = meta{kind:'freeout'}; বিক্রয়ে দেওয়া = sale.freeItems */
const FP=id=>{const m=S.meta.get(id);if(m&&m.kind==='freeprod')return m.del?null:m;const p=S.products.get(id);return p&&!p.del?p:null};
const fpAll=()=>live('meta').filter(m=>m.kind==='freeprod').sort((a,b)=>a.name.localeCompare(b.name));
const FI_IN=()=>live('meta').filter(m=>m.kind==='freein');
const FI_MAN=()=>live('meta').filter(m=>m.kind==='freeout');
const fpU=p=>(p&&p.unit)||'পিছ';
function freeStats(exDoc){
  const m=new Map(),g=pid=>{let o=m.get(pid);if(!o){o={in:0,man:0,sale:0};m.set(pid,o)}return o};
  FI_IN().forEach(r=>{g(r.pid).in+=num(r.qty)});FI_MAN().forEach(r=>{g(r.pid).man+=num(r.qty)});
  live('docs').forEach(d=>{if(d.type==='sale'&&d.id!==exDoc)(d.freeItems||[]).forEach(x=>{g(x.pid).sale+=num(x.qty)})});
  m.forEach(o=>{o.in=r2(o.in);o.out=r2(o.man+o.sale);o.rem=r2(o.in-o.out)});
  return m;
}
const freeMerge=l=>{const o={};(l||[]).forEach(x=>{if(!o[x.pid])o[x.pid]={pid:x.pid,name:x.name,unit:x.unit||'',qty:0};o[x.pid].qty+=num(x.qty)});return Object.values(o)};
const schemeTxt=f=>{if(!f||!f.linkPid||num(f.sN)<=0||num(f.sM)<=0)return '';const lp=S.products.get(f.linkPid);return `${lp?esc(lp.name):'পণ্য'} — প্রতি ${r2(f.sN)}${lp&&lp.unit?' '+esc(lp.unit):''} বিক্রয়ে ${r2(f.sM)} ${esc(fpU(f))} ফ্রি`};

/* ---- বিক্রয় পেজে আলাদা ফ্রি অংশ ---- */
let _fsr=0;function freeSoon(){if(!$('#fsec'))return;cancelAnimationFrame(_fsr);_fsr=requestAnimationFrame(paintFree)}
function freeSuggest(st,used){
  const out=[];
  fpAll().forEach(f=>{const N=num(f.sN),M=num(f.sM);if(!f.linkPid||N<=0||M<=0)return;
    const q=POS.items.filter(i=>i.pid===f.linkPid).reduce((a,i)=>a+num(i.qty),0),k=Math.floor(q/N+1e-9)*M;if(k<=0)return;
    const given=used[f.id]||0,want=r2(k-given);if(want<=0)return;
    const rem=r2((st.get(f.id)?st.get(f.id).rem:0)-given);out.push({f,q,k,want,rem,give:Math.max(0,Math.min(want,rem))})});
  return out;
}
function paintFree(){
  const box=$('#fsec');if(!box||!POS||POS.type!=='sale')return;
  POS.free=POS.free||[];
  const st=freeStats(POS.editId),used={};POS.free.forEach(x=>{used[x.pid]=(used[x.pid]||0)+num(x.qty)});
  const avail=[...st.entries()].map(([pid,o])=>({p:FP(pid),pid,rem:r2(o.rem-(used[pid]||0))})).filter(a=>a.p&&a.rem>0).sort((a,b)=>a.p.name.localeCompare(b.p.name));
  const anyStock=[...st.values()].some(o=>o.rem>0),sg=freeSuggest(st,used);
  box.innerHTML=`<div style="border:1px dashed var(--g);border-radius:10px;padding:10px;margin:10px 0;background:#f4fbf6">
  <div><b style="color:var(--g)">🎁 ফ্রি আইটেম</b> <small style="color:var(--m)">কোম্পানির ফ্রি স্টক থেকে · বিলের টাকা ও লাভে যুক্ত হবে না</small></div>
  ${sg.map((s,i)=>`<div class="row" style="flex-wrap:nowrap;align-items:center;margin-top:6px;background:#fff7e0;border-radius:8px;padding:6px 8px"><span style="flex:1;font-size:13px">💡 ${schemeTxt(s.f)}<br><b>${r2(s.q)} বিক্রয় → ${r2(s.k)} ${esc(fpU(s.f))} ${esc(s.f.name)} ফ্রি</b>${s.rem<s.want?`<br><small style="color:var(--r)">ফ্রি স্টকে অবশিষ্ট মাত্র ${Math.max(0,s.rem)}</small>`:''}</span>${s.give>0?`<button class="btn s gr" data-fs="${i}" type="button">+ ${r2(s.give)} যোগ</button>`:''}</div>`).join('')}
  ${POS.free.map((x,i)=>{const mx=r2((st.get(x.pid)?st.get(x.pid).rem:0)-(used[x.pid]||0)+num(x.qty));return `<div class="row" style="flex-wrap:nowrap;align-items:center;margin-top:6px"><span style="flex:1;min-width:0;font-size:14px">${esc(x.name)}<br><small style="color:var(--m)">সর্বোচ্চ ${mx} ${esc(x.unit||'')}</small></span><input type="number" data-fq="${i}" data-mx="${mx}" min="0" step="any" value="${x.qty}" style="width:84px"><button class="btn o s" data-fd="${i}" type="button">✕</button></div>`}).join('')}
  ${avail.length?`<div class="row" style="flex-wrap:nowrap;margin-top:8px"><select id="fpid" style="flex:1;min-width:0">${avail.map(a=>`<option value="${a.pid}" data-r="${a.rem}">${esc(a.p.name)} — অবশিষ্ট ${a.rem} ${esc(fpU(a.p))}</option>`).join('')}</select><input type="number" id="fqty" min="0" step="any" value="1" style="width:84px"><button class="btn s gr" id="fadd" type="button">+ ফ্রি দিন</button></div>`
   :`<div style="margin-top:6px;font-size:13px;color:var(--m)">${anyStock?'সব ফ্রি পণ্য এই বিলে যোগ হয়ে গেছে।':'ফ্রি স্টক নেই। "কোম্পানির ফ্রি আইটেম" পেজে প্রাপ্তি যোগ করুন।'}</div>`}</div>`;
  const addFree=(pid,q)=>{const p=FP(pid);const ex=POS.free.find(x=>x.pid===pid);if(ex)ex.qty=r2(num(ex.qty)+q);else POS.free.push({pid,name:p.name,unit:fpU(p),qty:q});paintFree()};
  const add=$('#fadd');
  if(add)add.onclick=()=>{const sel=$('#fpid'),pid=sel.value,rem=num(sel.selectedOptions[0].dataset.r),q=num($('#fqty').value);
    if(q<=0)return toast('পরিমাণ লিখুন','e');
    if(q>rem+1e-9)return toast('ফ্রি স্টকের চেয়ে বেশি দেওয়া যাবে না (অবশিষ্ট '+rem+')','e');
    addFree(pid,q)};
  box.querySelectorAll('[data-fs]').forEach(b=>b.onclick=()=>{const s=sg[+b.dataset.fs];addFree(s.f.id,s.give)});
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

/* ---- ফ্রি পণ্য যোগ/এডিট ফর্ম (ডিটেইল সহ) ---- */
function freeProdForm(rec,cb){
  const sup=live('parties').filter(p=>p.type==='supplier').sort((a,b)=>a.name.localeCompare(b.name));
  const prods=live('products').sort((a,b)=>a.name.localeCompare(b.name));
  modal(rec?'ফ্রি পণ্য এডিট':'নতুন ফ্রি পণ্য যোগ',`<div class="f"><label>পণ্যের নাম *</label><input id="fp_n" value="${esc(rec?rec.name:'')}" placeholder="যেমন: ফ্রি বোতল / গিফট আইটেম"></div>
  <div class="grid g2"><div class="f"><label>একক</label><input id="fp_u" list="fp_ul" value="${esc(rec?rec.unit||'পিছ':'পিছ')}"><datalist id="fp_ul"><option value="পিছ"><option value="কার্টুন"><option value="প্যাকেট"><option value="ডজন"><option value="কেজি"></datalist></div>
  <div class="f"><label>বারকোড (ঐচ্ছিক)</label><input id="fp_b" value="${esc(rec?rec.barcode||'':'')}"></div></div>
  <div class="f"><label>কোম্পানি / সাপ্লায়ার</label><select id="fp_p"><option value="">-- ঐচ্ছিক --</option>${sup.map(p=>`<option value="${p.id}" ${rec&&rec.partyId===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div>
  <div class="f"><label>ডিটেইল / বিবরণ</label><textarea id="fp_d" rows="2" placeholder="সাইজ, ধরন, আনুমানিক মূল্য ইত্যাদি">${esc(rec?rec.detail||'':'')}</textarea></div>
  <div class="f" style="border:1px dashed var(--b);border-radius:10px;padding:10px"><label style="font-weight:700">🎯 স্কিম (ঐচ্ছিক) — কোন বিক্রয় পণ্যে ফ্রি পাওয়া যায়</label>
  <select id="fp_l"><option value="">-- স্কিম নেই --</option>${prods.map(p=>`<option value="${p.id}" ${rec&&rec.linkPid===p.id?'selected':''}>${esc(p.name)}${p.unit?' ('+esc(p.unit)+')':''}</option>`).join('')}</select>
  <div class="row" style="flex-wrap:nowrap;align-items:center;margin-top:6px;gap:6px">প্রতি <input type="number" id="fp_sn" min="0" step="any" value="${rec&&rec.sN?rec.sN:''}" style="width:80px"> বিক্রয়ে <input type="number" id="fp_sm" min="0" step="any" value="${rec&&rec.sM?rec.sM:''}" style="width:80px"> ফ্রি</div>
  <small style="color:var(--m)">যেমন: কার্টুন পণ্য নির্বাচন → প্রতি ২ বিক্রয়ে ১ ফ্রি। বিক্রয়ের সময় অ্যাপ নিজেই জানাবে কতটা ফ্রি দেওয়া যায়।</small></div>
  ${photoField(rec||{id:'__new'})}
  <div class="row"><button class="btn" id="fp_s">${rec?'আপডেট':'সেভ করুন'}</button><button class="btn o" id="fp_c">বাতিল</button></div>`,()=>{
    photoBind();$('#fp_c').onclick=()=>closeModal();
    $('#fp_s').onclick=async()=>{
      const name=$('#fp_n').value.trim();if(!name)return toast('পণ্যের নাম লিখুন','e');
      if(fpAll().some(f=>f.name.toLowerCase()===name.toLowerCase()&&(!rec||f.id!==rec.id)))return toast('এই নামে ফ্রি পণ্য আগেই আছে','e');
      const link=$('#fp_l').value,sN=num($('#fp_sn').value),sM=num($('#fp_sm').value);
      if(link&&(sN<=0||sM<=0))return toast('স্কিমের জন্য দুটো সংখ্যাই লিখুন (প্রতি কত বিক্রয়ে কত ফ্রি)','e');
      const r={...(rec||{id:uid(),createdAt:Date.now()}),kind:'freeprod',name,unit:$('#fp_u').value.trim()||'পিছ',barcode:$('#fp_b').value.trim(),partyId:$('#fp_p').value,detail:$('#fp_d').value.trim(),linkPid:link,sN:link?sN:0,sM:link?sM:0};
      await save('meta',r);await photoApply(r.id);closeModal();toast('সেভ হয়েছে','k');
      if(cb)cb(r);else if(CUR.r==='freestock')SCR.freestock()};
  });
}

/* ---- ফ্রি আইটেম পেজ ---- */
let FS={tab:'prod',q:''};
SCR.freestock=()=>{
  const st=freeStats(),pn=id=>{const p=FP(id);return p?esc(p.name):'(মুছে ফেলা পণ্য)'},un=id=>{const p=FP(id);return p?' '+esc(fpU(p)):''};
  let tin=0,tout=0;st.forEach(o=>{tin+=o.in;tout+=o.out});
  const card=(l,v,c)=>`<div style="flex:1;min-width:110px;background:var(--pll);border-radius:10px;padding:10px 12px"><div style="font-size:12px;color:var(--m)">${l}</div><div style="font-size:22px;font-weight:700;color:${c}">${r2(v)}</div></div>`;
  const tabs=[['prod','পণ্য অনুযায়ী'],['cat','ফ্রি পণ্যের তালিকা'],['in','প্রাপ্তি'],['out','দেওয়ার তালিকা'],['cus','কাস্টমার অনুযায়ী']];
  view(`<div class="card"><div class="row sp"><h3 style="margin:0">🎁 কোম্পানির ফ্রি আইটেম <small style="color:var(--m);font-weight:400">(পিছ হিসাব)</small></h3><div class="row"><button class="btn" id="fnew">+ নতুন ফ্রি পণ্য</button><button class="btn" id="fin">+ প্রাপ্তি</button><button class="btn o" id="fout">🎁 কাস্টমারকে দিন</button></div></div>
  <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap">${card('কোম্পানি থেকে পেয়েছি',tin,'var(--pd)')}${card('কাস্টমারকে দিয়েছি',tout,'var(--o)')}${card('অবশিষ্ট',tin-tout,tin-tout<0?'var(--r)':'var(--g)')}</div></div>
  <div class="card"><div class="tabs">${tabs.map(([k,l])=>`<button class="btn s ${FS.tab===k?'':'o'}" data-ft="${k}">${l}</button>`).join('')}</div>
  ${FS.tab==='prod'?`<input id="fq" placeholder="পণ্য খুঁজুন..." value="${esc(FS.q)}" style="margin-bottom:8px">`:''}<div id="fbody"></div></div>`);
  $$('[data-ft]').forEach(b=>b.onclick=()=>{FS.tab=b.dataset.ft;SCR.freestock()});
  $('#fnew').onclick=()=>freeProdForm();$('#fin').onclick=()=>freeInForm();$('#fout').onclick=()=>freeOutForm();
  const body=$('#fbody'),T=(c,r,f)=>tblc(c,r,f);
  const btns=(id,k)=>`<button class="btn o s" data-fe="${k}:${id}">এডিট</button> <button class="btn d s" data-fx="${k}:${id}">ডিলিট</button>`;
  if(FS.tab==='prod'){
    const q=FS.q.trim().toLowerCase();
    const rows=[...st.entries()].map(([pid,o])=>({pid,o,p:FP(pid)})).filter(a=>a.p&&(!q||a.p.name.toLowerCase().includes(q)||String(a.p.barcode||'').includes(q))).sort((a,b)=>a.p.name.localeCompare(b.p.name));
    body.innerHTML=T(['পণ্য','>পেয়েছি','>দিয়েছি','>অবশিষ্ট'],rows.map(a=>[`${imgTag(a.pid,'pthm')}${esc(a.p.name)}`,r2(a.o.in)+' '+esc(fpU(a.p)),r2(a.o.out)+' '+esc(fpU(a.p)),`<b style="color:${a.o.rem<=0?'var(--r)':'var(--g)'}">${a.o.rem} ${esc(fpU(a.p))}</b>`]),['মোট '+rows.length+'টি পণ্য','','','']);
    $('#fq').oninput=e=>{FS.q=e.target.value;const pos=e.target.selectionStart;SCR.freestock();const n=$('#fq');n.focus();n.setSelectionRange(pos,pos)};
  }else if(FS.tab==='cat'){
    const rows=fpAll();
    body.innerHTML=T(['ফ্রি পণ্য','একক','কোম্পানি','স্কিম','>অবশিষ্ট',''],rows.map(f=>[`${imgTag(f.id,'pthm')}${esc(f.name)}${f.detail?`<br><small style="color:var(--m)">${esc(f.detail)}</small>`:''}${f.barcode?`<br><small style="color:var(--m)">▮ ${esc(f.barcode)}</small>`:''}`,esc(fpU(f)),f.partyId?partyName(f.partyId):'-',schemeTxt(f)||'-',(st.get(f.id)?st.get(f.id).rem:0)+' '+esc(fpU(f)),btns(f.id,'fp')]),['মোট '+rows.length+'টি','','','','','']);
    if(!rows.length)body.insertAdjacentHTML('beforeend','<p style="color:var(--m);font-size:13px">প্রথমে "+ নতুন ফ্রি পণ্য" দিয়ে ফ্রি পণ্যটি ডিটেইল সহ যোগ করুন, তারপর "+ প্রাপ্তি" দিয়ে কত পিছ পেলেন লিখুন।</p>');
  }else if(FS.tab==='in'){
    const rows=FI_IN().sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(b.createdAt||0)-(a.createdAt||0));
    body.innerHTML=T(['তারিখ','কোম্পানি','পণ্য','>পরিমাণ','নোট',''],rows.map(r=>[r.date||'',r.partyId?partyName(r.partyId):'-',pn(r.pid),r2(r.qty)+un(r.pid),esc(r.note||''),btns(r.id,'in')]),['মোট '+rows.length+'টি','','',r2(rows.reduce((a,r)=>a+num(r.qty),0)),'','']);
  }else if(FS.tab==='out'||FS.tab==='cus'){
    const out=[];
    FI_MAN().forEach(r=>out.push({date:r.date||'',pid:r.pid,qty:num(r.qty),party:r.partyId,note:r.note||'',src:'man',id:r.id}));
    live('docs').forEach(d=>{if(d.type==='sale')(d.freeItems||[]).forEach(x=>out.push({date:d.date||'',pid:x.pid,qty:num(x.qty),party:d.partyId,note:'',src:'doc',id:d.id,no:d.no}))});
    out.sort((a,b)=>b.date.localeCompare(a.date));
    if(FS.tab==='out'){
      body.innerHTML=T(['তারিখ','কাস্টমার','পণ্য','>পরিমাণ','সূত্র',''],out.map(r=>[r.date,partyName(r.party),pn(r.pid),r2(r.qty)+un(r.pid),r.src==='doc'?'বিক্রয় '+esc(r.no||''):esc(r.note||'সরাসরি'),r.src==='doc'?`<button class="btn o s" data-fv="${r.id}">ইনভয়েস</button>`:btns(r.id,'out')]),['মোট '+out.length+'টি','','',r2(out.reduce((a,r)=>a+r.qty,0)),'','']);
    }else{
      const g={};out.forEach(r=>{const k=r.party||'';(g[k]=g[k]||{n:0,l:{}});g[k].n+=r.qty;g[k].l[r.pid]=(g[k].l[r.pid]||0)+r.qty});
      const rows=Object.entries(g).sort((a,b)=>b[1].n-a[1].n);
      body.innerHTML=T(['কাস্টমার','>মোট ফ্রি','কী কী'],rows.map(([k,o])=>[partyName(k),r2(o.n),Object.entries(o.l).map(([pid,q])=>pn(pid)+' × '+r2(q)+un(pid)).join(', ')]),['মোট '+rows.length+' জন','','']);
    }
  }
  $$('[data-fv]').forEach(b=>b.onclick=()=>viewDoc(b.dataset.fv));
  $$('[data-fe]').forEach(b=>{const[k,id]=b.dataset.fe.split(':');b.onclick=()=>k==='fp'?freeProdForm(S.meta.get(id)):k==='in'?freeInForm(S.meta.get(id)):freeOutForm(S.meta.get(id))});
  $$('[data-fx]').forEach(b=>{const[k,id]=b.dataset.fx.split(':');b.onclick=async()=>{
    const r=S.meta.get(id);if(!r)return;
    if(k==='fp'){const o=st.get(id);if(o&&(o.in>0||o.out>0))return toast('এই ফ্রি পণ্যের প্রাপ্তি/দেওয়ার হিসাব আছে, তাই মুছা যাবে না','e')}
    if(k==='in'){const o=freeStats().get(r.pid);const after=r2((o?o.in:0)-num(r.qty)-(o?o.out:0));
      if(after<0)return toast('এই প্রাপ্তি মুছলে দেওয়া ফ্রি পণ্যের চেয়ে স্টক কমে যায় (অবশিষ্ট '+after+')। আগে দেওয়ার হিসাব ঠিক করুন।','e')}
    if(!confirm('মুছে ফেলবেন?'))return;await remove('meta',r);toast('মুছে ফেলা হয়েছে','k');SCR.freestock()}});
};
function freeInForm(rec){
  const cat=fpAll();
  if(!cat.length&&!rec){toast('আগে একটি ফ্রি পণ্য যোগ করুন','e');return freeProdForm(null,f=>{SCR.freestock&&CUR.r==='freestock'&&SCR.freestock();freeInForm()})}
  const sup=live('parties').filter(p=>p.type==='supplier').sort((a,b)=>a.name.localeCompare(b.name));
  const opts=[...cat];if(rec&&!opts.some(f=>f.id===rec.pid)){const l=FP(rec.pid);if(l)opts.push(l)}
  modal(rec?'প্রাপ্তি এডিট':'কোম্পানি থেকে ফ্রি প্রাপ্তি',`<div class="grid g2"><div class="f"><label>তারিখ</label><input type="date" id="fi_d" value="${rec?rec.date:today()}"></div>
  <div class="f"><label>কোম্পানি / সাপ্লায়ার</label><select id="fi_p"><option value="">-- ঐচ্ছিক --</option>${sup.map(p=>`<option value="${p.id}" ${rec&&rec.partyId===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div></div>
  <div class="f"><label>ফ্রি পণ্য * <button class="btn o s" id="fi_new" type="button" style="margin-left:6px">+ নতুন ফ্রি পণ্য</button></label><select id="fi_n">${opts.map(f=>`<option value="${f.id}" ${rec&&rec.pid===f.id?'selected':''}>${esc(f.name)} (${esc(fpU(f))})</option>`).join('')}</select></div>
  <div class="f"><label>কত পেয়েছেন * <small id="fi_u" style="color:var(--m)"></small></label><input type="number" id="fi_q" min="0" step="any" value="${rec?rec.qty:''}"></div>
  <div class="f"><label>নোট</label><input id="fi_t" value="${esc(rec?rec.note||'':'')}"></div>
  <div class="row"><button class="btn" id="fi_s">${rec?'আপডেট':'সেভ করুন'}</button><button class="btn o" id="fi_c">বাতিল</button></div>`,()=>{
    const un=()=>{const f=FP($('#fi_n').value);$('#fi_u').textContent=f?'('+fpU(f)+')':''};un();$('#fi_n').onchange=un;
    $('#fi_c').onclick=()=>closeModal();
    $('#fi_new').onclick=()=>freeProdForm(null,f=>{if(CUR.r==='freestock')SCR.freestock();freeInForm(rec)});
    $('#fi_s').onclick=async()=>{
      const pid=$('#fi_n').value,q=num($('#fi_q').value);
      if(!pid)return toast('ফ্রি পণ্য বাছুন','e');if(q<=0)return toast('পরিমাণ লিখুন','e');
      if(rec&&rec.pid===pid){const o=freeStats().get(pid);const after=r2((o?o.in:0)-num(rec.qty)+q-(o?o.out:0));if(after<0)return toast('এই পরিমাণ কমালে দেওয়া ফ্রির চেয়ে স্টক কম হয়ে যায়','e')}
      else if(rec){const o=freeStats().get(rec.pid);if(r2((o?o.in:0)-num(rec.qty)-(o?o.out:0))<0)return toast('আগের পণ্যের দেওয়া ফ্রি আছে, পণ্য বদলানো যাবে না','e')}
      await save('meta',{...(rec||{id:uid(),kind:'freein',createdAt:Date.now()}),kind:'freein',date:$('#fi_d').value||today(),partyId:$('#fi_p').value,pid,qty:q,note:$('#fi_t').value.trim()});
      closeModal();toast('সেভ হয়েছে','k');if(CUR.r==='freestock')SCR.freestock()};
  });
}
function freeOutForm(rec){
  const st=freeStats(),cus=live('parties').filter(p=>p.type==='customer').sort((a,b)=>a.name.localeCompare(b.name));
  const avail=[...st.entries()].map(([pid,o])=>({p:FP(pid),pid,rem:r2(o.rem+(rec&&rec.pid===pid?num(rec.qty):0))})).filter(a=>a.p&&a.rem>0).sort((a,b)=>a.p.name.localeCompare(b.p.name));
  if(!avail.length)return toast('ফ্রি স্টক নেই — আগে প্রাপ্তি যোগ করুন','e');
  modal(rec?'ফ্রি দেওয়া এডিট':'কাস্টমারকে ফ্রি দিন',`<div class="grid g2"><div class="f"><label>তারিখ</label><input type="date" id="fo_d" value="${rec?rec.date:today()}"></div>
  <div class="f"><label>কাস্টমার *</label><select id="fo_p"><option value="">-- নির্বাচন --</option>${cus.map(p=>`<option value="${p.id}" ${rec&&rec.partyId===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div></div>
  <div class="f"><label>ফ্রি পণ্য *</label><select id="fo_n">${avail.map(a=>`<option value="${a.pid}" data-r="${a.rem}" ${rec&&rec.pid===a.pid?'selected':''}>${esc(a.p.name)} — অবশিষ্ট ${a.rem} ${esc(fpU(a.p))}</option>`).join('')}</select></div>
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

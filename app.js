'use strict';
/* ========== auth screens ========== */
const profName=p=>p.id===PROF.cur?(biz().name||p.name||'নতুন প্রোফাইল'):(p.name||'নতুন প্রোফাইল');
function profSel(){return PROF.list.length>1?`<div class="f"><label>🏢 প্রোফাইল (ব্যবসা)</label><select id="pfs">${PROF.list.map(p=>`<option value="${p.id}" ${p.id===PROF.cur?'selected':''}>${esc(profName(p))}</option>`).join('')}</select></div>`:''}
function syncProfName(){const p=PROF.list.find(x=>x.id===PROF.cur),n=biz().name||'';if(p&&n&&p.name!==n)p.name=n;profSave()}
function switchProfile(id){try{sessionStorage.setItem('bdcpro_sw','1')}catch(e){}localStorage.setItem('bdcpro_cur',id);location.reload()}
function createProfile(name){const id='p'+Date.now().toString(36);PROF.list.push({id,name});profSave();switchProfile(id)}
function profilesModal(){
  const own=isOwner();
  modal('🏢 ব্যবসা প্রোফাইল',`<p style="color:var(--m);margin-top:0;font-size:13px">প্রতিটি প্রোফাইলের পণ্য, বিক্রয়-ক্রয়, হিসাব, পার্টি, ইউজার ও ক্লাউড সিঙ্ক সম্পূর্ণ আলাদা — একটির সাথে আরেকটি কখনো মিশবে না।</p>
  ${PROF.list.map(p=>{const cur=p.id===PROF.cur;return `<div style="display:flex;align-items:center;gap:10px;padding:10px;margin-bottom:8px;border-radius:10px;border:${cur?'2px solid var(--p)':'1px solid var(--b)'}"><div style="flex:1"><b>${esc(profName(p))}</b>${cur?' <span class="bd bg">চালু</span>':''}</div>${cur?'':`<button class="btn s" data-sw="${p.id}">চালু করুন</button>`}</div>`}).join('')}
  ${own?'<button class="btn" id="pnew" style="width:100%;margin-top:4px">➕ নতুন প্রোফাইল যোগ করুন</button>':'<small style="color:var(--m)">নতুন প্রোফাইল যোগ করতে মালিকের আইডি দিয়ে লগইন করুন।</small>'}
  ${own&&PROF.list.length>1?'<button class="btn d" id="pdel" style="width:100%;margin-top:8px">🗑 এই প্রোফাইল মুছুন</button>':''}
  <small style="color:var(--m);display:block;margin-top:8px">নতুন প্রোফাইল চালু করলে সেটির জন্য আলাদা মালিক/পাসওয়ার্ড দিয়ে শুরু করতে হবে। অন্য প্রোফাইলে যেতে লগআউট লাগবে না — "চালু করুন" চাপলেই হবে।</small>`,()=>{
    $$('[data-sw]').forEach(b=>b.onclick=()=>switchProfile(b.dataset.sw));
    if($('#pnew'))$('#pnew').onclick=()=>{const nm=(prompt('নতুন ব্যবসা/প্রোফাইলের নাম:')||'').trim();if(!nm)return;if(PROF.list.some(p=>profName(p)===nm))return toast('এই নামে প্রোফাইল আগে থেকেই আছে','e');createProfile(nm)};
    if($('#pdel'))$('#pdel').onclick=deleteProfile;
  });
}
async function deleteProfile(){
  if(!isOwner()||PROF.list.length<2)return;
  const pw=prompt('এই প্রোফাইলের সব তথ্য মুছে যাবে। চালিয়ে যেতে আপনার পাসওয়ার্ড দিন:');if(pw===null)return;
  if(await sha256(ME.salt+':'+pw)!==ME.hash)return toast('পাসওয়ার্ড ভুল','e');
  const nm=biz().name||'';if((prompt('নিশ্চিত করতে ব্যবসার নাম লিখুন: '+nm)||'')!==nm)return toast('নাম মেলেনি — কিছু মোছা হয়নি','e');
  try{backupNow('profile-delete')}catch(e){}
  try{IDB.db.close()}catch(e){}
  await new Promise(r=>{const q=indexedDB.deleteDatabase(DBNAME);q.onsuccess=q.onerror=q.onblocked=()=>r()});
  PROF.list=PROF.list.filter(p=>p.id!==PROF.cur);profSave();try{const _m=JSON.parse(localStorage.getItem('bdcpro_dirs')||'{}');delete _m[PROF.cur];localStorage.setItem('bdcpro_dirs',JSON.stringify(_m))}catch(_e){}localStorage.removeItem(UIDK);try{sessionStorage.setItem('bdcpro_sw','1')}catch(e){}localStorage.setItem('bdcpro_cur',PROF.list[0].id);location.reload();
}
function showAuth(html){$('#app').style.display='none';const a=$('#auth');a.style.display='flex';a.innerHTML=`<div class="ac"><div class="brand"><img class="l" src="${LOGO_URI}" alt=""><span class="wm"><img src="${WM_URI}" alt="BDC PRO"></span></div>${profSel()}${html}</div>`;const ps=$('#pfs');if(ps)ps.onchange=()=>switchProfile(ps.value)}
async function mkUser(name,username,pass,role){
  const salt=uid().slice(0,8);return{id:uid(),name,username,role,salt,hash:await sha256(salt+':'+pass),active:1,createdAt:Date.now()};
}
function authSetup(){
  showAuth(`<p style="text-align:center;color:var(--m)">শুরু করুন</p>
  <button class="btn" style="width:100%;margin-bottom:8px" id="a1">নতুন ব্যবসা তৈরি করুন</button>
  <button class="btn o" style="width:100%" id="a2">আগের ডেটা GitHub থেকে ফিরিয়ে আনুন</button>`);
  $('#a1').onclick=authNew;$('#a2').onclick=authRestore;
}
function authNew(){
  showAuth(`<h2>নতুন ব্যবসা</h2><div class="f"><label>ব্যবসার নাম</label><input id="bn" value="${esc((PROF.list.find(p=>p.id===PROF.cur)||{}).name||'')}"></div><div class="f"><label>আপনার নাম (মালিক)</label><input id="un"></div>
  <div class="f"><label>ইউজারনেম / ফোন</label><input id="uu"></div><div class="f"><label>পাসওয়ার্ড</label><input id="up" type="password"></div>
  <button class="btn" style="width:100%" id="go">তৈরি করুন</button><p style="text-align:center"><a id="bk">← ফিরে যান</a></p>`);
  $('#bk').onclick=authSetup;
  $('#go').onclick=async()=>{const bn=$('#bn').value.trim(),n=$('#un').value.trim(),u=$('#uu').value.trim(),p=$('#up').value;
    if(!bn||!n||!u||p.length<4)return toast('সব ঘর পূরণ করুন (পাসওয়ার্ড কমপক্ষে ৪ অক্ষর)','e');
    ME=await mkUser(n,u,p,'owner');await save('users',ME);
    await save('meta',{id:'biz',name:bn,design:'t80',footer:'ধন্যবাদ',openCash:0,openBank:0});
    localStorage.setItem(UIDK,ME.id);boot()};
}
function authRestore(){
  showAuth(`<h2>GitHub থেকে রিস্টোর</h2><div class="f"><label>GitHub ইউজারনেম</label><input id="go1" value="${esc(SYNC.owner)}"></div><div class="f"><label>ডেটা Repository-র নাম (প্রাইভেট)</label><input id="gr" value="${esc(SYNC.repo)}"></div>
  <div class="f"><label>ব্রাঞ্চ</label><input id="gb" value="${esc(SYNC.branch||'main')}"></div><div class="f"><label>ডেটা ফোল্ডার (এই প্রোফাইলের)</label><input id="gd" value="${esc(ddir())}"></div><div class="f"><label>অ্যাক্সেস টোকেন</label><input id="gt" type="password" value="${esc(SYNC.token)}"></div>
  <button class="btn" style="width:100%" id="go">রিস্টোর করুন</button><p style="text-align:center"><a id="bk">← ফিরে যান</a></p>`);
  $('#bk').onclick=authSetup;
  $('#go').onclick=async()=>{{const _d=$('#gd').value.trim()||DATADIR,_k=$('#go1').value.trim()+'/'+$('#gr').value.trim()+'/'+_d;let _m={};try{_m=JSON.parse(localStorage.getItem('bdcpro_dirs')||'{}')}catch(_e){}const _x=Object.keys(_m).find(k=>_m[k]===_k&&k!==PROF.cur);if(_x)return toast('এই ফোল্ডার অন্য প্রোফাইল ব্যবহার করছে — ডেটা মিশে যাবে। আলাদা ফোল্ডারের নাম দিন','e');_m[PROF.cur]=_k;try{localStorage.setItem('bdcpro_dirs',JSON.stringify(_m))}catch(_e){}}Object.assign(SYNC,{owner:$('#go1').value.trim(),repo:$('#gr').value.trim(),branch:$('#gb').value.trim()||'main',dir:$('#gd').value.trim()||DATADIR,token:$('#gt').value.trim(),sha:{}});
    $('#go').disabled=true;$('#go').textContent='ডাউনলোড হচ্ছে...';await doSync(true);
    if(!live('users').length){$('#go').disabled=false;$('#go').textContent='রিস্টোর করুন';toast('এই repository-তে কোনো ডেটা পাওয়া যায়নি','e');return}
    boot()};
}
function authLogin(){
  const us=live('users').filter(u=>u.active);
  showAuth(`<h2>${esc(biz().name||'BDC PRO v2')}</h2><div class="f"><label>ব্যবহারকারী</label><select id="lu">${us.map(u=>`<option value="${u.id}">${esc(u.name)} (${u.role==='owner'?'মালিক':'স্টাফ'})</option>`).join('')}</select></div>
  <div class="f"><label>পাসওয়ার্ড</label><input id="lp" type="password"></div><button class="btn" style="width:100%" id="go">লগইন</button>`);
  const go=async()=>{const u=S.users.get($('#lu').value);if(!u||await sha256(u.salt+':'+$('#lp').value)!==u.hash)return toast('পাসওয়ার্ড ভুল','e');
    ME=u;localStorage.setItem(UIDK,u.id);boot()};
  $('#go').onclick=go;$('#lp').onkeydown=e=>{if(e.key==='Enter')go()};$('#lp').focus();
}

/* ========== PWA install (মোবাইল ও কম্পিউটার) ========== */
let DEFER=null;
const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function refreshInstall(){const e=$('#inst');if(e)e.style.display=(!isStandalone()&&(DEFER||isIOS()))?'':'none'}
addEventListener('beforeinstallprompt',e=>{e.preventDefault();DEFER=e;refreshInstall()});
addEventListener('appinstalled',()=>{DEFER=null;refreshInstall();toast('অ্যাপ ইনস্টল হয়েছে','k')});
async function installApp(){
  closeDrawer();
  if(DEFER){DEFER.prompt();try{await DEFER.userChoice}catch(e){}DEFER=null;refreshInstall();return}
  modal('অ্যাপ ইনস্টল করুন',`<p>${isIOS()?'iPhone/iPad-এ <b>Safari</b> ব্রাউজারে: নিচের <b>শেয়ার (⬆)</b> বাটন → <b>Add to Home Screen</b> চাপুন।':'ব্রাউজারের মেনু (⋮) থেকে <b>Install app</b> / <b>Add to Home screen</b> বেছে নিন।'}</p><button class="btn" onclick="closeModal()">ঠিক আছে</button>`);
}

/* ========== boot ========== */
async function boot(){
  if(!IDB.db){await IDB.open();await loadAll();if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{})}
  syncProfName();
  if(!live('users').length)return authSetup();
  const sid=localStorage.getItem(UIDK);ME=sid?S.users.get(sid):null;
  if(!ME||ME.del||!ME.active){ME=null;return authLogin()}
  $('#auth').style.display='none';$('#app').style.display='flex';
  $('#tbz').textContent=biz().name||'';buildMenu();setStatus();
  const g0=new URLSearchParams(location.search).get('go');
  if(g0){history.replaceState(null,'',location.pathname);go(g0)}else go(CUR.r==='logout'?'dash':CUR.r,CUR.a);
  refreshInstall();
  if(syncOn())doSync();
}
window.onSynced=()=>{
  ME=S.users.get(ME&&ME.id)||ME;if(ME&&(ME.del||!ME.active)){localStorage.removeItem(UIDK);location.reload();return}
  $('#tbz').textContent=biz().name||'';syncProfName();
  if(!modalOpen()&&['dash','invoices','parties','products','categories','units','due','expense','cash'].includes(CUR.r))go(CUR.r,CUR.a);
  toast('নতুন তথ্য সিঙ্ক হয়েছে','k');
};
$('#mb').onclick=()=>{$('#drawer').classList.toggle('open');$('#ov').classList.toggle('show')};
$('#ov').onclick=closeDrawer;
$('#drawer').onclick=e=>{const m=e.target.closest('.mi');if(m)go(m.dataset.r)};
$('#pill').onclick=()=>{if(syncOn())doSync(true);else if(isOwner())go('settings');};
window.addEventListener('error',e=>console.error(e.message));

/* ========== settings ========== */
SCR.settings=()=>{
  if(!isOwner())return go('dash');
  const b=biz();
  view(`<div class="card"><h3>ব্যবসার প্রোফাইল</h3>${b.logo?`<img src="${b.logo}" style="height:60px;margin-bottom:8px;border-radius:8px"><br>`:''}
  <div class="grid g2"><div class="f"><label>ব্যবসার নাম</label><input id="bn" value="${esc(b.name||'')}"></div><div class="f"><label>ফোন</label><input id="bp" value="${esc(b.phone||'')}"></div></div>
  <div class="f"><label>ঠিকানা</label><input id="ba" value="${esc(b.address||'')}"></div><div class="f"><label>ইনভয়েসের নিচের লেখা</label><input id="bf" value="${esc(b.footer||'')}"></div>
  <div class="grid g2"><div class="f"><label>শুরুর ক্যাশ ব্যালেন্স</label><input id="oc" type="number" value="${num(b.openCash)}"></div><div class="f"><label>শুরুর ব্যাংক ব্যালেন্স</label><input id="ob" type="number" value="${num(b.openBank)}"></div></div>
  <div class="grid g2"><div class="f"><label>ডিফল্ট ইনভয়েস ডিজাইন</label><select id="bd">${DESIGNS.map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}</select></div>
  <div class="f"><label>সেভ করলে অটো প্রিন্ট</label><select id="bap"><option value="">না</option><option value="1">হ্যাঁ</option></select></div></div>
  <div class="f"><label>লোগো (ছোট করে সেভ হবে)</label><input type="file" id="bl" accept="image/*"></div>
  <h3 style="margin-top:14px">✍ বিক্রেতার সাইন (ইনভয়েসে)</h3>
  <div class="grid g2"><div class="f"><label>সাইনের লেখা (সিগনেচার ফন্টে)</label><input id="bst" value="${esc(b.sigText||'Bismillah Distribution Center')}"></div><div class="f"><label>ইনভয়েসে সাইন দেখাবে?</label><select id="bso"><option value="">হ্যাঁ</option><option value="1">না</option></select></div></div>
  <div class="f"><label>অথবা নিজের সাইনের ছবি (ঐচ্ছিক — দিলে লেখার বদলে ছবি বসবে)</label><input type="file" id="bsi" accept="image/*">${b.sigImg?`<div style="margin-top:6px"><img src="${b.sigImg}" style="max-height:50px;border:1px solid var(--b);border-radius:6px;background:#fff"> <label style="font-size:13px"><input type="checkbox" id="bsr" style="width:auto"> ছবি সরান</label></div>`:''}</div>
  <div style="text-align:center;padding:8px;border:1px dashed var(--b);border-radius:10px;margin-bottom:10px"><span class="sgf" style="font-size:26px;color:#1e3a8a">${esc(b.sigText||'Bismillah Distribution Center')}</span><br><small style="color:var(--m)">BDC-PRO-V-2.0</small></div>
  <button class="btn" id="bsv">সেভ করুন</button></div>
  <div class="card"><h3>ব্যবহারকারী (স্টাফ)</h3><div id="ul"></div><div class="grid g3" style="margin-top:8px"><div class="f"><label>নাম</label><input id="sn"></div><div class="f"><label>ইউজারনেম</label><input id="su"></div><div class="f"><label>পাসওয়ার্ড</label><input id="sp" type="password"></div></div><button class="btn" id="sadd">স্টাফ যোগ করুন</button></div>
  <div class="card"><h3>☁ ক্লাউড সিঙ্ক (GitHub)</h3><small style="display:block;color:var(--m);margin-bottom:6px">এই প্রোফাইলের ডেটা GitHub-এ <b>${esc(ddir())}/</b> ফোল্ডারে থাকে — প্রতিটি প্রোফাইলের ফোল্ডার আলাদা, একই repository ব্যবহার করলেও মিশবে না।</small><p style="color:var(--m);font-size:13px;margin-top:0">একাধিক ডিভাইস ও ব্যবহারকারীর ডেটা একসাথে রাখতে একটি <b>প্রাইভেট</b> repository ব্যবহার করুন (README দেখুন)। ডেটা মাস অনুযায়ী আলাদা ছোট ফাইলে জমা হয়, তাই বছরের পর বছর ধীর হবে না।</p>
  <div class="grid g2"><div class="f"><label>GitHub ইউজারনেম</label><input id="go1" value="${esc(SYNC.owner)}"></div><div class="f"><label>Repository (প্রাইভেট)</label><input id="gr" value="${esc(SYNC.repo)}"></div><div class="f"><label>ব্রাঞ্চ</label><input id="gb" value="${esc(SYNC.branch||'main')}"></div><div class="f"><label>অ্যাক্সেস টোকেন</label><input id="gt" type="password" value="${esc(SYNC.token)}"></div></div>
  <div class="row"><button class="btn" id="gsv">সংযোগ পরীক্ষা ও সেভ</button><button class="btn gr" id="gsy">এখনই সিঙ্ক</button><button class="btn o" id="gall">সব ডেটা আপলোড</button></div><p id="gst" style="font-size:13px;color:var(--m)">${SYNC.last?'সর্বশেষ সিঙ্ক: '+new Date(SYNC.last).toLocaleString():''}</p></div>
  <div class="card"><h3>ব্যাকআপ ও স্টোরেজ</h3><div class="row"><button class="btn" id="ex">ব্যাকআপ ডাউনলোড (JSON)</button><label class="btn o" style="margin:0">ব্যাকআপ ফাইল থেকে ফিরিয়ে আনুন<input type="file" id="im" accept=".json" hidden></label></div><p id="stg" style="font-size:13px;color:var(--m)"></p></div>`);
  $('#bd').value=b.design||'t80';$('#bso').value=b.sigOff?'1':'';$('#bap').value=b.autoPrint?'1':'';
  $('#bsv').onclick=async()=>{const rec={...biz(),name:$('#bn').value.trim(),phone:$('#bp').value.trim(),address:$('#ba').value.trim(),footer:$('#bf').value.trim(),openCash:num($('#oc').value),openBank:num($('#ob').value),design:$('#bd').value,autoPrint:$('#bap').value?1:0};
    const f=$('#bl').files[0];if(f)rec.logo=await shrink(f);rec.sigText=$('#bst').value.trim()||'Bismillah Distribution Center';rec.sigOff=$('#bso').value?1:0;const sf=$('#bsi').files[0];if(sf)rec.sigImg=await shrink(sf);else if($('#bsr')&&$('#bsr').checked)delete rec.sigImg;await save('meta',rec);syncProfName();$('#tbz').textContent=rec.name;toast('সেভ হয়েছে','k');SCR.settings()};
  const ul=()=>{$('#ul').innerHTML=tblc(['নাম','ইউজারনেম','ভূমিকা','স্ট্যাটাস',''],live('users').map(u=>[esc(u.name),esc(u.username),u.role==='owner'?'মালিক':'স্টাফ',u.active?'<span class="bd bg">সক্রিয়</span>':'<span class="bd br">বন্ধ</span>',u.role==='owner'&&u.id===ME.id?'':`<div class="row" style="flex-wrap:nowrap"><button class="btn o s" data-tg="${u.id}">${u.active?'বন্ধ করুন':'চালু করুন'}</button><button class="btn o s" data-pw="${u.id}">পাসওয়ার্ড</button></div>`]));
    $$('[data-tg]').forEach(x=>x.onclick=async()=>{const u=S.users.get(x.dataset.tg);await save('users',{...u,active:u.active?0:1});ul()});
    $$('[data-pw]').forEach(x=>x.onclick=async()=>{const p=prompt('নতুন পাসওয়ার্ড (কমপক্ষে ৪ অক্ষর):');if(!p||p.length<4)return;const u=S.users.get(x.dataset.pw),salt=uid().slice(0,8);await save('users',{...u,salt,hash:await sha256(salt+':'+p)});toast('পাসওয়ার্ড বদলেছে','k')})};ul();
  $('#sadd').onclick=async()=>{const n=$('#sn').value.trim(),u=$('#su').value.trim(),p=$('#sp').value;if(!n||!u||p.length<4)return toast('সব ঘর পূরণ করুন (পাসওয়ার্ড ৪+ অক্ষর)','e');
    if(live('users').some(x=>x.username===u))return toast('এই ইউজারনেম আছে','e');await save('users',await mkUser(n,u,p,'staff'));toast('স্টাফ যোগ হয়েছে','k');SCR.settings()};
  const rd=()=>Object.assign(SYNC,{owner:$('#go1').value.trim(),repo:$('#gr').value.trim(),branch:$('#gb').value.trim()||'main',token:$('#gt').value.trim()});
  $('#gsv').onclick=async()=>{rd();try{const r=await gh('');if(!r.ok)throw new Error(r.status===404?'Repository পাওয়া যায়নি (নাম/টোকেন দেখুন)':r.status===401?'টোকেন ভুল':'ত্রুটি '+r.status);const j=await r.json();
      if(!j.permissions||!j.permissions.push)throw new Error('টোকেনে লেখার অনুমতি নেই (Contents: Read and write দিন)');
      if(!j.private&&!confirm('⚠ এই repository পাবলিক! আপনার ব্যবসার সব হিসাব সবাই দেখতে পারবে। তবুও চালিয়ে যাবেন?'))return;
      saveKV();toast('সংযোগ ঠিক আছে, সিঙ্ক শুরু হচ্ছে','k');await doSync(true);SCR.settings()}catch(e){toast(e.message,'e')}};
  $('#gsy').onclick=()=>{rd();saveKV();doSync(true)};
  $('#gall').onclick=()=>{rd();if(confirm('সব ডেটা GitHub-এ আপলোড হবে। চালিয়ে যাবেন?'))pushAll()};
  $('#ex').onclick=()=>{const o={v:2,at:new Date().toISOString()};SYNCED.forEach(s=>o[s]=[...S[s].values()]);const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(o)],{type:'application/json'}));a.download='BSPRO-backup-'+today()+'.json';a.click()};
  $('#im').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const o=JSON.parse(await f.text());if(o.prof&&o.prof!==PROF.cur&&!confirm('⚠ সতর্কতা: এই ব্যাকআপ অন্য প্রোফাইলের ('+(o.profName||o.prof)+')। এখনকার প্রোফাইলে বসালে দুটোর তথ্য মিশে যাবে। তবুও চালিয়ে যাবেন?')){e.target.value='';return}if(!confirm('ব্যাকআপ ফাইলের সব তথ্য এখনকার তথ্যের ওপর বসানো হবে। চালিয়ে যাবেন?')){e.target.value='';return}let n=0;
    for(const s of SYNCED){const rows=(o[s]||[]).filter(r=>r&&r.id);if(rows.length){await saveMany(s,rows.map(r=>({...r})));n+=rows.length}}
    IDXC=null;saveKV();toast(n+'টি তথ্য ফিরিয়ে আনা হয়েছে','k');SCR.settings()}catch(x){toast('ফাইলটি সঠিক নয়','e')}};
  if(navigator.storage&&navigator.storage.estimate)navigator.storage.estimate().then(s=>{$('#stg').textContent=`ব্যবহৃত স্টোরেজ: ${(s.usage/1048576).toFixed(1)} MB (ব্রাউজার বরাদ্দ: ~${Math.round(s.quota/1048576)} MB)`}).catch(()=>{});
};
function shrink(file){return new Promise(res=>{const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas'),k=Math.min(1,256/Math.max(im.width,im.height));c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);res(c.toDataURL('image/png'))};im.src=r.result};r.readAsDataURL(file)})}

if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
boot();

/* ========== ইউটিলিটি: অ্যাকাউন্ট রিসেট (শুধু মালিক) ========== */
function backupNow(tag){const o={v:2,at:new Date().toISOString(),prof:PROF.cur,profName:(biz().name||'')};SYNCED.forEach(s=>o[s]=[...S[s].values()]);const el=document.createElement('a');el.href=URL.createObjectURL(new Blob([JSON.stringify(o)],{type:'application/json'}));el.download='BDCPRO-'+((biz().name||PROF.cur).replace(/[^\w\u0980-\u09FF-]+/g,'_'))+'-backup-'+(tag||'')+today()+'.json';el.click()}
SCR.reset=()=>{
  if(!isOwner())return go('dash');
  const n=(st,f)=>[...S[st].values()].filter(r=>!r.del&&(!f||f(r))).length;
  const c={docs:n('docs'),money:n('money'),prod:n('products'),par:n('parties'),lists:n('meta',r=>r.kind==='unit'||r.kind==='cat')};
  view(`<div class="card"><h3>🔧 অ্যাকাউন্ট রিসেট</h3>
  <p style="margin-top:0;color:var(--r)"><b>সতর্কতা:</b> রিসেট করলে হিসাব ফিরিয়ে আনা যায় না। শুরুর আগে অটোমেটিক একটি ব্যাকআপ ফাইল ডাউনলোড হবে — সেটি সযত্নে রাখুন। ব্যবহারকারী (মালিক/স্টাফ), ব্যবসার প্রোফাইল ও সিঙ্ক সেটিং অক্ষত থাকবে।</p>
  <label class="f" style="flex-direction:row;gap:8px;align-items:flex-start;cursor:pointer"><input type="radio" name="rm" value="tx" checked style="width:auto;margin-top:4px"><span><b>শুধু লেনদেন রিসেট</b><br><small style="color:var(--m)">${c.docs}টি ইনভয়েস/অর্ডার/ফেরত/ফ্রি এবং ${c.money}টি খরচ, আদায়-পরিশোধ ও ক্যাশ-ব্যাংক এন্ট্রি মুছবে। পণ্য (শুরুর স্টকসহ), পার্টি (শুরুর বকেয়াসহ), ক্যাটাগরি ও একক থাকবে।</small></span></label>
  <label class="f" style="flex-direction:row;gap:8px;align-items:flex-start;cursor:pointer"><input type="radio" name="rm" value="all" style="width:auto;margin-top:4px"><span><b>পূর্ণ রিসেট (নতুন করে শুরু)</b><br><small style="color:var(--m)">উপরের সব লেনদেন + ${c.prod}টি পণ্য + ${c.par}টি পার্টি + ${c.lists}টি ক্যাটাগরি/একক মুছবে।</small></span></label>
  <label class="f" style="flex-direction:row;gap:8px;align-items:center;cursor:pointer"><input type="checkbox" id="rz" style="width:auto"><span>শুরুর ক্যাশ ও ব্যাংক ব্যালেন্সও ০ করুন</span></label>
  <div class="grid g2"><div class="f"><label>আপনার (মালিকের) পাসওয়ার্ড</label><input type="password" id="rp" autocomplete="current-password"></div><div class="f"><label>নিশ্চিত করতে <b>RESET</b> লিখুন</label><input id="rc" autocomplete="off"></div></div>
  <button class="btn d" id="rgo">রিসেট করুন</button></div>`);
  $('#rgo').onclick=async()=>{
    const full=$('input[name=rm]:checked').value==='all';
    if($('#rc').value.trim()!=='RESET')return toast('নিশ্চিত করতে RESET লিখুন','e');
    const u=S.users.get(ME.id);if(!u||await sha256(u.salt+':'+$('#rp').value)!==u.hash)return toast('পাসওয়ার্ড ভুল','e');
    if(!confirm(full?'সব ডেটা (পণ্য, পার্টি, লেনদেন) মুছে যাবে। নিশ্চিত?':'সব লেনদেন মুছে যাবে। নিশ্চিত?'))return;
    $('#rgo').disabled=true;
    try{
      backupNow('before-reset-');
      const del=async(st,f)=>{const rs=[...S[st].values()].filter(r=>!r.del&&(!f||f(r))).map(r=>({...r,del:1}));if(rs.length)await saveMany(st,rs)};
      await del('docs');await del('money');
      if(full){await del('products');await del('parties');await del('meta',r=>r.kind==='unit'||r.kind==='cat')}
      if($('#rz').checked)await save('meta',{...biz(),openCash:0,openBank:0});
      POS=null;IDXC=null;
      toast('রিসেট সম্পন্ন হয়েছে','k');go('dash');
    }catch(e){toast('ত্রুটি: '+e.message,'e');$('#rgo').disabled=false}
  };
};

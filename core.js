'use strict';
/* ========== helpers ========== */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>{const n=parseFloat(v);return isFinite(n)?n:0};
const r2=n=>Math.round(num(n)*100)/100;
const money=n=>'৳'+r2(n).toLocaleString('en-US');
const pad=n=>String(n).padStart(2,'0');
const today=()=>{const d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2,12);
function toast(m,t){const e=document.createElement('div');e.className='toast '+(t||'');e.textContent=m;$('#tw').appendChild(e);setTimeout(()=>e.remove(),3000)}
let MH=false,MSKIP=0,MDIRTY=false;
function modal(title,html,mount,wide){
  const w=$('#mw');
  w.innerHTML=`<div class="mo"><div class="mb2 ${wide?'w':''}"><div class="mh"><button class="mx" id="mback" type="button" aria-label="ফিরে যান">←</button><h3>${esc(title)}</h3><button class="mx" id="mclose" type="button" aria-label="বন্ধ করুন">✕</button></div><div id="mbody">${html}</div></div></div>`;
  const mo=$('.mo',w);let down=null;
  mo.addEventListener('pointerdown',e=>{down=e.target});
  mo.addEventListener('click',e=>{if(e.target===mo&&down===mo)closeModal()});
  $('#mback',w).onclick=()=>closeModal();$('#mclose',w).onclick=()=>closeModal();
  if(!MH){try{history.pushState({m:1},'')}catch(e){}MH=true}
  if(mount)mount($('#mbody'));
}
function closeModal(fromPop){
  if(!$('#mw .mo'))return;
  $('#mw').innerHTML='';
  if(MDIRTY){MDIRTY=false;setTimeout(()=>{if(!modalOpen()&&typeof CUR!=='undefined'&&CUR.r!=='pos')go(CUR.r,CUR.a)},0)}
  if(MH&&fromPop!==true){MH=false;MSKIP=1;try{history.back()}catch(e){MSKIP=0}}else MH=false;
}
const modalOpen=()=>!!$('#mw .mo');
addEventListener('popstate',()=>{if(MSKIP){MSKIP=0;return}if(modalOpen())closeModal(true)});
addEventListener('keydown',e=>{if(e.key==='Escape'&&modalOpen())closeModal()});
const BN99=['শূন্য','এক','দুই','তিন','চার','পাঁচ','ছয়','সাত','আট','নয়','দশ','এগারো','বারো','তেরো','চৌদ্দ','পনেরো','ষোল','সতেরো','আঠারো','উনিশ','বিশ','একুশ','বাইশ','তেইশ','চব্বিশ','পঁচিশ','ছাব্বিশ','সাতাশ','আটাশ','ঊনত্রিশ','ত্রিশ','একত্রিশ','বত্রিশ','তেত্রিশ','চৌত্রিশ','পঁয়ত্রিশ','ছত্রিশ','সাঁইত্রিশ','আটত্রিশ','ঊনচল্লিশ','চল্লিশ','একচল্লিশ','বিয়াল্লিশ','তেতাল্লিশ','চুয়াল্লিশ','পঁয়তাল্লিশ','ছেচল্লিশ','সাতচল্লিশ','আটচল্লিশ','ঊনপঞ্চাশ','পঞ্চাশ','একান্ন','বায়ান্ন','তিপ্পান্ন','চুয়ান্ন','পঞ্চান্ন','ছাপ্পান্ন','সাতান্ন','আটান্ন','ঊনষাট','ষাট','একষট্টি','বাষট্টি','তেষট্টি','চৌষট্টি','পঁয়ষট্টি','ছেষট্টি','সাতষট্টি','আটষট্টি','ঊনসত্তর','সত্তর','একাত্তর','বাহাত্তর','তিয়াত্তর','চুয়াত্তর','পঁচাত্তর','ছিয়াত্তর','সাতাত্তর','আটাত্তর','ঊনআশি','আশি','একাশি','বিরাশি','তিরাশি','চুরাশি','পঁচাশি','ছিয়াশি','সাতাশি','অষ্টাশি','ঊননব্বই','নব্বই','একানব্বই','বিরানব্বই','তিরানব্বই','চুরানব্বই','পঁচানব্বই','ছিয়ানব্বই','সাতানব্বই','আটানব্বই','নিরানব্বই'];
function bnWords(n){ // পূর্ণসংখ্যা → বাংলা কথায় (কোটি/লক্ষ/হাজার/শত)
  n=Math.floor(n);if(n<=0)return BN99[0];const out=[];
  const cr=Math.floor(n/1e7);n%=1e7;const lk=Math.floor(n/1e5);n%=1e5;const hz=Math.floor(n/1e3);n%=1e3;const sh=Math.floor(n/100);const rest=n%100;
  if(cr)out.push((cr>99?bnWords(cr):BN99[cr])+' কোটি');if(lk)out.push(BN99[lk]+' লক্ষ');if(hz)out.push(BN99[hz]+' হাজার');if(sh)out.push(BN99[sh]+' শত');if(rest)out.push(BN99[rest]);
  return out.join(' ');
}
function takaWords(v){v=Math.abs(r2(v));const t=Math.floor(v),ps=Math.round((v-t)*100);
  return bnWords(t)+' টাকা'+(ps?' '+bnWords(ps)+' পয়সা':'')+' মাত্র'}
function printHTML(html){
  const f=document.createElement('iframe');f.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.appendChild(f);const d=f.contentDocument;d.open();d.write(html);d.close();
  setTimeout(()=>{try{f.contentWindow.focus();f.contentWindow.print()}catch(e){}setTimeout(()=>f.remove(),5000)},350);
}
async function sha256(t){
  if(crypto.subtle){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
  let h=5381;for(let i=0;i<t.length;i++)h=((h<<5)+h+t.charCodeAt(i))|0;return 'x'+h;
}
function toB64(str){const by=new TextEncoder().encode(str);let s='';for(let i=0;i<by.length;i+=0x8000)s+=String.fromCharCode.apply(null,by.subarray(i,i+0x8000));return btoa(s)}

/* ========== IndexedDB (large + fast, one record per row) ========== */
const SYNCED=['products','parties','docs','money','users','meta'];
/* ===== একাধিক প্রোফাইল: প্রতিটির আলাদা ডেটাবেস, লগইন-কী ও GitHub ফোল্ডার ===== */
const PROF=(()=>{let l=[];try{l=JSON.parse(localStorage.getItem('bdcpro_profiles')||'[]')}catch(e){}if(!Array.isArray(l)||!l.length)l=[{id:'main',name:''}];let c=localStorage.getItem('bdcpro_cur');if(!l.some(p=>p.id===c))c=l[0].id;return{list:l,cur:c}})();
const profSave=()=>{try{localStorage.setItem('bdcpro_profiles',JSON.stringify(PROF.list))}catch(e){}};
const DBNAME=PROF.cur==='main'?'bdcpro2':'bdcpro2_'+PROF.cur;
const UIDK=PROF.cur==='main'?'bdcpro_uid':'bdcpro_uid_'+PROF.cur;
const DATADIR=PROF.cur==='main'?'data':'data-'+PROF.cur;
const ddir=()=>(typeof SYNC!=='undefined'&&SYNC.dir)||DATADIR;
const IDB={db:null,
  open(){return new Promise((res,rej)=>{const r=indexedDB.open(DBNAME,1);
    r.onupgradeneeded=()=>{const d=r.result;SYNCED.forEach(n=>d.createObjectStore(n,{keyPath:'id'}));d.createObjectStore('kv')};
    r.onsuccess=()=>{this.db=r.result;res()};r.onerror=()=>rej(r.error)})},
  tx(store,mode,fn){return new Promise((res,rej)=>{const t=this.db.transaction(store,mode);const s=t.objectStore(store);let out;
    try{out=fn(s)}catch(e){rej(e);return}
    t.oncomplete=()=>res(out&&out.result!==undefined?out.result:undefined);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error)})},
  all(store){return this.tx(store,'readonly',s=>s.getAll())},
  put(store,val,key){return this.tx(store,'readwrite',s=>key!==undefined?s.put(val,key):s.put(val))},
  putMany(store,arr){return this.tx(store,'readwrite',s=>{arr.forEach(v=>s.put(v))})},
  get(store,key){return this.tx(store,'readonly',s=>s.get(key))},
  clear(store){return this.tx(store,'readwrite',s=>s.clear())}
};

/* ========== state ========== */
const S={products:new Map(),parties:new Map(),docs:new Map(),money:new Map(),users:new Map(),meta:new Map()};
let ME=null;
let DEV={tag:'',counter:0};
let SYNC={owner:'',repo:'',branch:'main',token:'',sha:{},last:0};
let DIRTY={},dirtyV=0,IDXC=null;
const live=m=>[...S[m].values()].filter(r=>!r.del);
const biz=()=>S.meta.get('biz')||{id:'biz'};
async function loadAll(){
  for(const s of SYNCED){S[s]=new Map((await IDB.all(s)).map(r=>[r.id,r]))}
  DEV=(await IDB.get('kv','device'))||{tag:Math.random().toString(36).slice(2,4).toUpperCase(),counter:0};
  SYNC=Object.assign(SYNC,(await IDB.get('kv','sync'))||{});
  DIRTY=(await IDB.get('kv','dirty'))||{};
  IDXC=null;
}
const saveKV=()=>{IDB.put('kv',DEV,'device');IDB.put('kv',SYNC,'sync');IDB.put('kv',DIRTY,'dirty')};
function shardOf(store,r){
  if(store==='docs'||store==='money')return store+'-'+String(r.date||'0000-00').slice(0,7);
  return store;
}
async function save(store,rec){
  rec.updatedAt=Date.now();if(ME)rec.by=ME.id;
  S[store].set(rec.id,rec);await IDB.put(store,rec);
  DIRTY[shardOf(store,rec)]=++dirtyV;IDB.put('kv',DIRTY,'dirty');IDXC=null;syncSoon();return rec;
}
async function saveMany(store,recs){recs.forEach(r=>{r.updatedAt=Date.now();if(ME)r.by=ME.id;S[store].set(r.id,r);DIRTY[shardOf(store,r)]=++dirtyV});
  await IDB.putMany(store,recs);IDB.put('kv',DIRTY,'dirty');IDXC=null;syncSoon()}
const remove=(store,rec)=>{rec.del=1;return save(store,rec)};
function nextNo(prefix){DEV.counter++;IDB.put('kv',DEV,'device');const d=new Date();return `${prefix}-${String(d.getFullYear()).slice(2)}${pad(d.getMonth()+1)}${pad(d.getDate())}-${DEV.tag}${DEV.counter}`}

/* ========== document types & computed index ========== */
const TYPES={
  sale:{l:'বিক্রয়',pre:'S',stock:-1,cash:+1,price:'sellPrice',party:'customer',money:true},
  purchase:{l:'ক্রয়',pre:'P',stock:+1,cash:-1,price:'buyPrice',party:'supplier',money:true},
  free:{l:'ফ্রি আইটেম',pre:'F',stock:-1,cash:0,price:null,party:'customer',need:true},
  sale_order:{l:'বিক্রয় অর্ডার',pre:'SO',stock:0,cash:0,price:'sellPrice',party:'customer',order:true},
  purchase_order:{l:'ক্রয় অর্ডার',pre:'PO',stock:0,cash:0,price:'buyPrice',party:'supplier',order:true},
  sale_return:{l:'বিক্রয় ফেরত',pre:'SR',stock:+1,cash:-1,price:'sellPrice',party:'customer',money:true},
  purchase_return:{l:'ক্রয় ফেরত',pre:'PR',stock:-1,cash:+1,price:'buyPrice',party:'supplier',money:true}
};
function cashEffect(kind,r){ // returns [cash,bank] delta
  const a=num(r.amount??r.paid),m=r.method==='bank'?1:0,v=[0,0];
  if(r.type){const t=TYPES[r.type];if(!t||!t.money)return v;if(r.payCash!==undefined){v[0]=t.cash*num(r.payCash);v[1]=t.cash*num(r.payBank);return v}v[m]=t.cash*num(r.paid);return v}
  switch(r.kind){
    case 'drawing':v[m]=-a;break;case 'payment_in':v[m]=a;break;case 'payment_out':v[m]=-a;break;case 'expense':v[m]=-a;break;
    case 'cash_in':v[0]=a;break;case 'cash_out':v[0]=-a;break;case 'bank_in':v[1]=a;break;case 'bank_out':v[1]=-a;break;
    case 'c2b':v[0]=-a;v[1]=a;break;case 'b2c':v[0]=a;v[1]=-a;break}
  return v;
}
/* সব সময়ের নীট লাভ (বিক্রয − বিক্রীত পণ্যের ক্রয়মূল্য − খরচ − ফ্রি আইটেম), লভ্যাংশ উত্তোলন ও অবশিষ্ট লাভ */
function profitAll(){
  let rev=0,cogs=0,free=0,ex=0,draw=0;
  S.docs.forEach(d=>{if(d.del)return;
    if(d.type==='sale'||d.type==='sale_return'){const k=d.type==='sale'?1:-1;rev+=k*num(d.total);(d.items||[]).forEach(i=>cogs+=k*num(i.qty)*num(i.cost))}
    if(d.type==='free')(d.items||[]).forEach(i=>free+=num(i.qty)*num(i.cost))});
  S.money.forEach(m=>{if(m.del)return;if(m.kind==='expense')ex+=num(m.amount);if(m.kind==='drawing')draw+=num(m.amount)});
  const net=r2(rev-cogs-ex-free);return{net,draw:r2(draw),avail:r2(net-draw)};
}
function idx(){
  if(IDXC)return IDXC;
  const stock={},net={},X={stock,net,cash:num(biz().openCash),bank:num(biz().openBank)};
  S.products.forEach(p=>{if(!p.del)stock[p.id]=num(p.openQty)});
  S.docs.forEach(d=>{if(d.del)return;const t=TYPES[d.type];if(!t)return;
    if(t.stock)(d.items||[]).forEach(i=>{if(i.pid in stock)stock[i.pid]+=t.stock*num(i.qty)});
    const e=cashEffect(0,d);X.cash+=e[0];X.bank+=e[1];
    if(d.partyId&&!t.order){const due=num(d.total)-num(d.paid);
      const k=d.type==='sale'?1:d.type==='sale_return'?-1:d.type==='purchase'?-1:d.type==='purchase_return'?1:0; // net = they owe us
      net[d.partyId]=(net[d.partyId]||0)+k*due}});
  S.money.forEach(m=>{if(m.del)return;const e=cashEffect(0,m);X.cash+=e[0];X.bank+=e[1];
    if(m.partyId){net[m.partyId]=(net[m.partyId]||0)+(m.kind==='payment_in'?-num(m.amount):m.kind==='payment_out'?num(m.amount):0)}});
  allocPayments(X);
  return IDXC=X;
}
/* পার্টির আদায়/পরিশোধ ইনভয়েসে ভাগ করা: নির্দিষ্ট ইনভয়েস বাছা থাকলে সেখানে, নইলে আগে শুরুর বকেয়া, তারপর সবচেয়ে পুরনো ইনভয়েস থেকে।
   (পার্টির মোট বকেয়ার হিসাব আগের মতোই থাকে — এটি শুধু প্রতিটি ইনভয়েসের নিজস্ব বকেয়া দেখানোর জন্য) */
function allocPayments(X){
  const ex={},exl={},dueDocs={},pays={};
  const cmp=(a,b)=>a.date<b.date?-1:a.date>b.date?1:num(a.createdAt)-num(b.createdAt);
  S.docs.forEach(d=>{if(d.del||!d.partyId||(d.type!=='sale'&&d.type!=='purchase'))return;
    if(num(d.total)-num(d.paid)<=0.001)return;
    const k=d.partyId+'|'+(d.type==='sale'?'payment_in':'payment_out');(dueDocs[k]||(dueDocs[k]=[])).push(d)});
  S.money.forEach(m=>{if(m.del||!m.partyId||(m.kind!=='payment_in'&&m.kind!=='payment_out'))return;
    const k=m.partyId+'|'+m.kind;(pays[k]||(pays[k]=[])).push(m)});
  Object.keys(pays).forEach(k=>{
    const[pid,kind]=k.split('|'),p=S.parties.get(pid),docs=(dueDocs[k]||[]).sort(cmp);
    const rem=new Map(docs.map(d=>[d.id,num(d.total)-num(d.paid)]));
    let open=(p&&!p.del&&((kind==='payment_in'&&p.type!=='supplier')||(kind==='payment_out'&&p.type==='supplier')))?Math.max(0,num(p.opening)):0;
    const give=(d,m,a)=>{ex[d.id]=(ex[d.id]||0)+a;(exl[d.id]||(exl[d.id]=[])).push({date:m.date,amount:a,method:m.method,note:m.note});rem.set(d.id,rem.get(d.id)-a)};
    const list=pays[k].sort(cmp),left=new Map();
    list.forEach(m=>{let a=num(m.amount);if(m.docId&&rem.has(m.docId)){const t=Math.min(a,Math.max(0,rem.get(m.docId)));if(t>0){give(S.docs.get(m.docId),m,t);a-=t}}left.set(m.id,a)});
    list.forEach(m=>{let a=left.get(m.id);if(a<=0.001)return;
      if(open>0){const t=Math.min(a,open);open-=t;a-=t}
      for(const d of docs){if(a<=0.001)break;const r=rem.get(d.id);if(r<=0.001)continue;const t=Math.min(a,r);give(d,m,t);a-=t}});
  });
  X.ex=ex;X.exl=exl;
}
const docLater=d=>r2(idx().ex[d.id]||0);
const docDue=d=>(d.type==='sale'||d.type==='purchase')?Math.max(0,r2(num(d.total)-num(d.paid)-docLater(d))):Math.max(0,r2(num(d.total)-num(d.paid)));
const stockOf=id=>idx().stock[id]||0;
function dueOf(p){const n=idx().net[p.id]||0,o=num(p.opening);return p.type==='supplier'?o-n:o+n}
const isOwner=()=>ME&&ME.role==='owner';

/* ========== GitHub sync (sharded files: data/docs-YYYY-MM.json ...) ========== */
let syncing=false,syncTimer=null,lastErr='';
const syncOn=()=>!!(SYNC.owner&&SYNC.repo&&SYNC.token);
function gh(path,opt={}){return fetch(`https://api.github.com/repos/${SYNC.owner}/${SYNC.repo}/${path}`,{cache:'no-store',...opt,headers:{Authorization:'token '+SYNC.token,Accept:'application/vnd.github+json',...(opt.headers||{})}})}
async function listRemote(){
  const r=await gh(`contents/${ddir()}?ref=${encodeURIComponent(SYNC.branch)}`);
  if(r.status===404)return{};
  if(!r.ok)throw new Error(r.status===401?'টোকেন ভুল বা মেয়াদ শেষ':'GitHub ত্রুটি '+r.status);
  const o={};(await r.json()).forEach(f=>{if(f.name.endsWith('.json'))o[f.name.slice(0,-5)]=f.sha});return o;
}
function mergeRows(store,rows){const ch=[];for(const r of rows){const l=S[store].get(r.id);if(!l||num(r.updatedAt)>num(l.updatedAt)){S[store].set(r.id,r);ch.push(r)}}return ch}
async function pullShard(shard,sha){
  const store=shard.split('-')[0];if(!S[store])return 0;
  const r=await gh(`contents/${ddir()}/${shard}.json?ref=${encodeURIComponent(SYNC.branch)}`,{headers:{Accept:'application/vnd.github.raw+json'}});
  if(!r.ok)throw new Error('ডাউনলোড ত্রুটি '+r.status);
  const j=await r.json();const ch=mergeRows(store,j.rows||[]);
  if(ch.length){await IDB.putMany(store,ch);IDXC=null}
  SYNC.sha[shard]=sha;return ch.length;
}
async function pushShard(shard,remote){
  const store=shard.split('-')[0];
  for(let a=0;a<3;a++){
    const ver=DIRTY[shard];if(!ver)return;
    const rows=[...S[store].values()].filter(r=>shardOf(store,r)===shard);
    if(!rows.length&&!remote[shard]){delete DIRTY[shard];return}
    const body={message:'sync '+shard,content:toB64(JSON.stringify({v:1,store,rows})),branch:SYNC.branch};
    if(remote[shard])body.sha=remote[shard];
    const r=await gh(`contents/${ddir()}/${shard}.json`,{method:'PUT',body:JSON.stringify(body)});
    if(r.ok){const j=await r.json();remote[shard]=SYNC.sha[shard]=j.content.sha;if(DIRTY[shard]===ver)delete DIRTY[shard];return}
    if(r.status===409||r.status===422){const l=await listRemote();remote[shard]=l[shard];if(l[shard])await pullShard(shard,l[shard]);continue}
    throw new Error(r.status===401||r.status===403||r.status===404?'লেখার অনুমতি নেই/repo পাওয়া যায়নি ('+r.status+')':'আপলোড ত্রুটি '+r.status);
  }
  throw new Error('সিঙ্ক দ্বন্দ্ব, আবার চেষ্টা করুন');
}
async function doSync(manual){
  if(!syncOn()||syncing)return;
  if(!navigator.onLine){setStatus();return}
  syncing=true;setStatus();let pulled=0;
  try{
    const remote=await listRemote();
    for(const[shard,sha]of Object.entries(remote)){if(SYNC.sha[shard]!==sha)pulled+=await pullShard(shard,sha)}
    for(const shard of Object.keys(DIRTY))await pushShard(shard,remote);
    SYNC.last=Date.now();lastErr='';saveKV();
    if(pulled&&window.onSynced)window.onSynced(pulled);
    if(manual)toast('সিঙ্ক সম্পন্ন'+(pulled?` (${pulled}টি নতুন তথ্য)`:''),'k');
  }catch(e){lastErr=e.message||String(e);saveKV();if(manual)toast(lastErr,'e')}
  syncing=false;setStatus();
}
function syncSoon(){setStatus();if(!syncOn())return;clearTimeout(syncTimer);syncTimer=setTimeout(()=>doSync(),2500)}
function setStatus(){
  const p=$('#pill');if(!p)return;const n=Object.keys(DIRTY).length;
  p.textContent=!syncOn()?'☁ সিঙ্ক বন্ধ':syncing?'⟳ সিঙ্ক হচ্ছে…':!navigator.onLine?'⚠ অফলাইন'+(n?` (${n})`:''):lastErr?'⚠ সিঙ্ক ত্রুটি':n?`☁ অপেক্ষমান (${n})`:'✓ সিঙ্ক হয়েছে';
  p.title=lastErr||'ট্যাপ করে এখনই সিঙ্ক করুন';
}
async function pushAll(){const set={};SYNCED.forEach(s=>S[s].forEach(r=>{DIRTY[shardOf(s,r)]=++dirtyV}));saveKV();await doSync(true)}
setInterval(()=>{if(syncOn()&&!syncing&&navigator.onLine)doSync()},45000);
addEventListener('online',()=>{setStatus();doSync()});addEventListener('offline',setStatus);

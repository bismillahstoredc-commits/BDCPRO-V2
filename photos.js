'use strict';
/* ========== পণ্যের ছবি: অটো ছোট করা + ক্লাউড সিঙ্ক (imgs-NN শার্ডে, মূল ডেটা থেকে আলাদা) ========== */
const IMG_MAX=320;            // সর্বোচ্চ দৈর্ঘ্য/প্রস্থ (পিক্সেল)
const IMG_TARGET=30*1024;     // লক্ষ্য সাইজ (বাইট) — এর কাছাকাছি রাখা হয়
const imgOf=pid=>{const r=S.imgs.get(pid);return r&&!r.del&&r.d?r.d:''};
const imgTag=(pid,cls)=>{const d=imgOf(pid);return d?`<img class="${cls||'pth'}" src="${d}" alt="" loading="lazy">`:''};
function imgBytes(d){return Math.round((d.length-d.indexOf(',')-1)*3/4)}
async function loadBitmap(file){
  if(window.createImageBitmap){try{return await createImageBitmap(file,{imageOrientation:'from-image'})}catch(e){}}
  return await new Promise((res,rej)=>{const u=URL.createObjectURL(file),im=new Image();im.onload=()=>{URL.revokeObjectURL(u);res(im)};im.onerror=()=>{URL.revokeObjectURL(u);rej(new Error('ছবি পড়া যায়নি'))};im.src=u});
}
async function compressImage(file){
  const bm=await loadBitmap(file);
  const w0=bm.width||bm.naturalWidth,h0=bm.height||bm.naturalHeight;
  if(!w0||!h0)throw new Error('ছবি পড়া যায়নি');
  const sc=Math.min(1,IMG_MAX/Math.max(w0,h0)),w=Math.max(1,Math.round(w0*sc)),h=Math.max(1,Math.round(h0*sc));
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;
  const cx=cv.getContext('2d');cx.fillStyle='#fff';cx.fillRect(0,0,w,h);cx.drawImage(bm,0,0,w,h);
  if(bm.close)try{bm.close()}catch(e){}
  let type='image/webp',out=cv.toDataURL(type,.75);
  if(!out.startsWith('data:image/webp'))type='image/jpeg';
  let q=type==='image/webp'?.75:.7;
  out=cv.toDataURL(type,q);
  for(let i=0;i<6&&imgBytes(out)>IMG_TARGET*1.6&&q>.35;i++){q-=.1;out=cv.toDataURL(type,q)}
  return out;
}
const imgBucket=id=>{let h=0;for(const c of String(id))h=(h*31+c.charCodeAt(0))>>>0;return String(h%32).padStart(2,'0')};
async function imgSave(pid,d){return save('imgs',{id:pid,d})}
async function imgDel(pid){const r=S.imgs.get(pid);if(!r||r.del)return;r.d='';return remove('imgs',r)}

/* ---- পণ্যের ফর্মের ছবি অংশ ---- */
let PHP=undefined; // undefined = অপরিবর্তিত, string = নতুন ছবি, null = মুছতে হবে
const phHint=d=>d?`✓ ছোট করা হয়েছে (${Math.max(1,Math.round(imgBytes(d)/1024))} KB)`:'';
function photoField(p){
  PHP=undefined;
  const d=p?imgOf(p.id):'';
  return `<div class="f"><label>পণ্যের ছবি (ঐচ্ছিক — নিজে থেকে ছোট হয়ে যাবে)</label>
  <div class="row" style="flex-wrap:nowrap;align-items:center;gap:10px">
    <div id="phbox" style="width:76px;height:76px;flex:none;border:1px dashed var(--b);border-radius:10px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:var(--pll);font-size:26px">${d?`<img src="${d}" style="width:100%;height:100%;object-fit:contain">`:'🖼'}</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px"><button class="btn o s" id="phcam" type="button">📷 ছবি তুলুন</button><button class="btn o s" id="phgal" type="button">🖼 গ্যালারি</button><button class="btn o s" id="phdel" type="button" ${d?'':'style="display:none"'}>✕ মুছুন</button></div>
  </div><small id="phinfo" style="color:var(--g)">${phHint(d)}</small>
  <input type="file" id="phf1" accept="image/*" capture="environment" hidden><input type="file" id="phf2" accept="image/*" hidden></div>`;
}
function photoBind(){
  const box=$('#phbox');if(!box)return;
  const show=d=>{box.innerHTML=d?`<img src="${d}" style="width:100%;height:100%;object-fit:contain">`:'🖼';$('#phdel').style.display=d?'':'none';$('#phinfo').textContent=phHint(d)};
  const pick=async f=>{if(!f)return;$('#phinfo').style.color='var(--m)';$('#phinfo').textContent='ছোট করা হচ্ছে…';
    try{const d=await compressImage(f);PHP=d;$('#phinfo').style.color='var(--g)';show(d)}catch(e){$('#phinfo').style.color='var(--r)';$('#phinfo').textContent='⚠ '+e.message}};
  $('#phcam').onclick=()=>$('#phf1').click();$('#phgal').onclick=()=>$('#phf2').click();
  $('#phf1').onchange=e=>{pick(e.target.files[0]);e.target.value=''};$('#phf2').onchange=e=>{pick(e.target.files[0]);e.target.value=''};
  $('#phdel').onclick=()=>{PHP=null;show('')};
}
async function photoApply(pid){
  if(PHP===undefined)return;
  if(PHP===null)await imgDel(pid);else await imgSave(pid,PHP);
  PHP=undefined;
}

/* ---- একসাথে অনেক ছবি ইমপোর্ট (ফাইলের নাম = বারকোড অথবা পণ্যের নাম) ---- */
const normNm=s=>String(s||'').toLowerCase().replace(/\.[a-z0-9]+$/i,'').replace(/[\s_\-]+/g,'').trim();
SCR.photos=()=>{
  const ps=live('products'),withImg=ps.filter(p=>imgOf(p.id)).length;
  let bytes=0;S.imgs.forEach(r=>{if(!r.del&&r.d)bytes+=imgBytes(r.d)});
  view(`<div class="card"><h3 style="margin:0 0 6px">🖼 পণ্যের ছবি ইমপোর্ট</h3>
  <p style="color:var(--m);font-size:13px;margin:0 0 10px">একসাথে অনেক ছবি বাছুন। প্রতিটি ছবির <b>ফাইলের নাম</b> পণ্যের <b>বারকোড</b> অথবা <b>পণ্যের নাম</b> হলে ছবি সেই পণ্যে বসে যাবে (যেমন <code>8710100101218.jpg</code> বা <code>চাল.png</code>)। ছবি নিজে থেকে ছোট হয়ে সেভ হবে এবং ক্লাউড সিঙ্কে অন্য ডিভাইসেও যাবে।</p>
  <div class="row" style="gap:8px"><label class="btn" for="phmany" style="cursor:pointer">📁 ছবি বাছুন (একাধিক)</label><input id="phmany" type="file" accept="image/*" multiple hidden>
  <label style="display:flex;gap:6px;align-items:center;font-size:13px"><input type="checkbox" id="phrep" checked style="width:auto"> আগের ছবি থাকলে বদলে দিন</label></div>
  <div id="phprog" style="margin-top:10px"></div></div>
  <div class="card"><b>অবস্থা:</b> মোট ${ps.length}টি পণ্যের মধ্যে ${withImg}টিতে ছবি আছে · ছবির মোট সাইজ প্রায় ${(bytes/1048576).toFixed(1)} MB</div>`);
  $('#phmany').onchange=async e=>{
    const files=[...e.target.files];e.target.value='';if(!files.length)return;
    const rep=$('#phrep').checked,pr=$('#phprog');
    const byBc=new Map(),byNm=new Map();ps.forEach(p=>{if(p.barcode)byBc.set(normNm(p.barcode),p);byNm.set(normNm(p.name),p)});
    let ok=0,skip=0;const miss=[],fail=[];let batch=[];
    const flush=async()=>{if(batch.length){await saveMany('imgs',batch);batch=[]}};
    for(let i=0;i<files.length;i++){
      const f=files[i];pr.innerHTML=`⏳ ${i+1} / ${files.length} — ${esc(f.name)}<div style="height:6px;background:var(--pl);border-radius:4px;margin-top:6px"><div style="height:6px;width:${Math.round((i+1)/files.length*100)}%;background:var(--p);border-radius:4px"></div></div>`;
      const k=normNm(f.name),p=byBc.get(k)||byNm.get(k);
      if(!p){miss.push(f.name);continue}
      if(!rep&&imgOf(p.id)){skip++;continue}
      try{const d=await compressImage(f);const old=S.imgs.get(p.id);batch.push({...(old||{}),id:p.id,d,del:0});ok++;if(batch.length>=40)await flush()}catch(err){fail.push(f.name)}
    }
    await flush();
    pr.innerHTML=`<div style="color:var(--g);font-weight:700">✓ ${ok}টি ছবি যুক্ত হয়েছে</div>${skip?`<div>${skip}টি আগে থেকে ছিল (বাদ)</div>`:''}${miss.length?`<div style="color:var(--o)">⚠ ${miss.length}টির নামের সাথে কোনো পণ্য মেলেনি: ${esc(miss.slice(0,15).join(', '))}${miss.length>15?' …':''}</div>`:''}${fail.length?`<div style="color:var(--r)">✕ ${fail.length}টি পড়া যায়নি: ${esc(fail.slice(0,10).join(', '))}</div>`:''}`;
    setTimeout(()=>{if(CUR.r==='photos'){const s=pr.innerHTML;SCR.photos();$('#phprog').innerHTML=s}},100);
  };
};

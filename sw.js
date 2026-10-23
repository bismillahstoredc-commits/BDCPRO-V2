// Caches the app shell: opens instantly from cache (even on slow or no internet) and updates in the background.
const V='bdcpro2-v21';
const FILES=['./','index.html','core.js','scan.js','invoice.js','brand.js','screens.js','screens2.js','photos.js','freeitems.js','namefont.js','keys.js','update.js','units.js','damage.js','app.js','manifest.json','icon-192.png','icon-512.png','maskable-192.png','maskable-512.png','apple-touch-icon.png','favicon-32.png','favicon-64.png','favicon.ico','logo-256.png','wordmark.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(FILES.map(f=>fetch(new Request(f,{cache:'reload'})).then(r=>{if(r.ok)return c.put(f,r)}).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith('bdcpro2-')&&x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  const fh=u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com';
  if(e.request.method!=='GET'||(u.origin!==location.origin&&!fh))return; // GitHub API etc. go straight to network
  // দ্রুত চালু: আগে ক্যাশ থেকে সাথে সাথে দেখাও, পেছনে নতুন ভার্সন নামিয়ে রাখো (ধীর/দুর্বল ইন্টারনেটে অ্যাপ আটকে থাকবে না)
  const job=(async()=>{
    const c=await caches.open(V),hit=await c.match(e.request,{ignoreSearch:true});
    const net=fetch(e.request).then(r=>{if(r&&r.ok)c.put(e.request,r.clone());return r}).catch(()=>null);
    if(hit)return{res:hit,net};
    const r=await net;return{res:r||(fh?Response.error():(await c.match('index.html'))||Response.error()),net};
  })();
  e.respondWith(job.then(x=>x.res));e.waitUntil(job.then(x=>x.net).catch(()=>{}));
});

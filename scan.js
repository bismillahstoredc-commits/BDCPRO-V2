'use strict';
/* ========== বারকোড: জেনারেটর, বীপ, ক্যামেরা স্ক্যানার ========== */
function ean13(b){let s=0;for(let i=0;i<12;i++)s+=(+b[i])*(i%2?3:1);return b+((10-s%10)%10)}
function genBarcode(){let c;do{c=ean13('20'+String(Date.now()).slice(-8)+String(Math.floor(Math.random()*100)).padStart(2,'0'))}while(live('products').some(p=>p.barcode===c));return c}
/* একই বারকোড আবার স্ক্যান হতে নূন্যতম সময় (মিলিসেকেন্ড) — ৩০০০ = ৩ সেকেন্ড */
const SCAN_GAP=3000;
let AC=null;
function beep(ok){try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain();o.frequency.value=ok?880:220;g.gain.value=.08;o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+(ok?.08:.25))}catch(e){}}
let ZXP=null;
function loadZX(){if(window.ZXing)return Promise.resolve();return ZXP||(ZXP=new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js';s.onload=res;s.onerror=()=>{ZXP=null;rej(new Error('load'))};document.head.appendChild(s)}))}
/* onCode(code) -> (ঐচ্ছিক) মেসেজ স্ট্রিং। multi=true হলে ক্যামেরা খোলা থাকে (বিক্রয়/ক্রয়ের জন্য) */
async function openScanner(onCode,multi){
  if($('#scanov'))return;
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)return toast('ক্যামেরা চালু করা যাচ্ছে না (HTTPS লিংকে অ্যাপ খুলুন)','e');
  const ov=document.createElement('div');ov.id='scanov';
  ov.style.cssText='position:fixed;inset:0;z-index:300;background:#000;display:flex;flex-direction:column';
  ov.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;padding-top:calc(10px + env(safe-area-inset-top));color:#fff"><b>বারকোড স্ক্যান${multi?' (একাধিক)':''}</b><button class="btn" id="scx">✕ বন্ধ</button></div>
  <div style="flex:1;position:relative;min-height:0;overflow:hidden"><video id="scv" playsinline muted style="width:100%;height:100%;object-fit:cover"></video><div style="position:absolute;left:8%;right:8%;top:32%;height:28%;border:3px solid #4ade80;border-radius:12px;box-shadow:0 0 0 999px rgba(0,0,0,.35)"></div></div>
  <div id="scm" style="color:#fff;text-align:center;padding:12px;padding-bottom:calc(12px + env(safe-area-inset-bottom));min-height:50px">বারকোড ফ্রেমের ভেতরে ধরুন</div>`;
  document.body.appendChild(ov);
  let stream=null,timer=null,closed=false,last='',lt=0,busy=false;
  const close=()=>{closed=true;clearInterval(timer);if(stream)stream.getTracks().forEach(t=>t.stop());ov.remove()};
  $('#scx',ov).onclick=close;
  try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false})}
  catch(e){close();return toast('ক্যামেরার অনুমতি দিন','e')}
  if(closed){stream.getTracks().forEach(t=>t.stop());return}
  const v=$('#scv',ov);v.srcObject=stream;try{await v.play()}catch(e){}
  let detect;
  if('BarcodeDetector' in window){
    let det;try{det=new BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e','code_128','code_39','code_93','itf','codabar','qr_code']})}catch(e){det=new BarcodeDetector()}
    detect=async()=>{const r=await det.detect(v);return r.length?r[0].rawValue:''};
  }else{
    try{await loadZX()}catch(e){close();return toast('এই ব্রাউজারে ক্যামেরা স্ক্যান চলছে না — Chrome ব্যবহার করুন, অথবা স্ক্যানার/টাইপ করুন','e')}
    const cv=document.createElement('canvas'),cx=cv.getContext('2d',{willReadFrequently:true}),rd=new ZXing.MultiFormatReader();
    detect=async()=>{if(!v.videoWidth)return'';cv.width=v.videoWidth;cv.height=v.videoHeight;cx.drawImage(v,0,0);
      try{return rd.decode(new ZXing.BinaryBitmap(new ZXing.HybridBinarizer(new ZXing.HTMLCanvasElementLuminanceSource(cv)))).getText()}catch(e){return''}};
  }
  timer=setInterval(async()=>{
    if(busy||closed)return;busy=true;
    try{const code=await detect();
      if(code){const now=Date.now();
        if(code!==last||now-lt>SCAN_GAP){last=code;lt=now;const msg=await onCode(code);
          if(!multi){close();return}
          const m=$('#scm',ov);if(m&&msg)m.textContent=msg}}}catch(e){}
    busy=false;
  },220);
}

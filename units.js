'use strict';
/* ========== প্রাইমারি ও সাব ইউনিট (যেমন ১ কেস = ১২ পিছ) ==========
   সব পরিমাণ প্রাইমারি ইউনিটে (দশমিকসহ) জমা থাকে; দাম প্রাইমারি ইউনিটের। পিছ বিক্রি করলে দাম নিজে ভাগ হয়। */
const hasSub=p=>!!(p&&num(p.ratio)>1&&p.subUnit);
function splitQty(p,q){q=num(q);const sg=q<0?-1:1;q=Math.abs(q);const R=num(p&&p.ratio)||1;let c=Math.floor(q+1e-9),s=Math.round((q-c)*R);if(s>=R){c++;s=0}return{c:sg*c,s:sg*s}}
function fq(p,q){ // পরিমাণের লেখা, ইউনিটসহ: "২ কেস ৫ পিছ"
  if(!hasSub(p))return (r2(q)+(p&&p.unit?' '+p.unit:'')).trim();
  const{c,s}=splitQty(p,q),a=[];if(c!==0||s===0)a.push(c+' '+p.unit);if(s!==0)a.push(s+' '+p.subUnit);return a.join(' ');
}
/* ফর্মে পরিমাণের ঘর (প্রাইমারি + সাব) */
function qtyHTML(p,q,key){
  const inp=(part,v,w)=>`<input type="number" step="any" min="0" data-qk="${key}" data-part="${part}" value="${v===''?'':v}" style="width:${w}px;padding:6px">`;
  if(!hasSub(p))return `${inp('c',q?r2(q):'',84)} <small>${esc((p&&p.unit)||'')}</small>`;
  const{c,s}=splitQty(p,q);return `${inp('c',q?c:'',60)} <small>${esc(p.unit)}</small> ${inp('s',q?s:'',60)} <small>${esc(p.subUnit)}</small>`;
}
function qtyRead(root,key,p){
  const g=part=>{const e=root.querySelector(`[data-qk="${key}"][data-part="${part}"]`);return e?num(e.value):0};
  return hasSub(p)?g('c')+g('s')/num(p.ratio):g('c');
}
/* প্রতি সাব ইউনিটের দাম (দেখানোর জন্য) */
const perSub=(p,price)=>hasSub(p)?r2(num(price)/num(p.ratio)):null;

/* বিলের তালিকায় (cart) পরিমাণের ঘর: সাব ইউনিট থাকলে দুটি ঘর */
function cartQtyCell(it,i){
  const p=S.products.get(it.pid);
  if(!hasSub(p))return `<input type="number" step="any" data-i="${i}" data-f="qty" value="${it.qty}">`;
  const{c,s}=splitQty(p,it.qty);
  return `<span style="display:flex;flex-direction:column"><span style="display:flex;gap:3px"><input type="number" step="any" data-i="${i}" data-f="qty" value="${c}" style="min-width:0"><input type="number" step="any" data-i="${i}" data-f="sub" value="${s}" style="min-width:0"></span><small style="font-size:10px;color:var(--m);display:flex;justify-content:space-around;white-space:nowrap"><span>${esc(p.unit)}</span><span>${esc(p.subUnit)}</span></small></span>`;
}

"use strict";
(()=>{
const q=new URLSearchParams(location.search),instance=q.get("instance"),P=parent.MultiSynth||{},C=P.ModuleContract;
if(!instance||!C)return;let rt;try{rt=C.getRuntime(instance)}catch(_){}if(!rt)return;
const auto=document.getElementById("auto"),clear=document.getElementById("clear"),slider=document.getElementById("count"),out=document.getElementById("countOut"),status=document.getElementById("status");if(!auto||!slider)return;
let segments=null;slider.min="1";slider.max="32";slider.value="16";slider.step="1";out.textContent="16";slider.oninput=()=>out.textContent=slider.value;
const label=slider.closest("label")?.querySelector("span");if(label)label.textContent="AUTO SENSITIVITY";
auto.textContent="AUTO FIND SAMPLES";
function capture(){return rt?.user?.getCapture?.()||rt?.user?.capture||null}
function envelope(data,sr){const win=Math.max(32,Math.round(sr*.008)),env=[];for(let a=0;a<data.length;a+=win){const b=Math.min(data.length,a+win);let sum=0,peak=0;for(let i=a;i<b;i++){const v=Math.abs(data[i]||0);sum+=v*v;if(v>peak)peak=v}env.push(Math.max(Math.sqrt(sum/Math.max(1,b-a)),peak*.35))}return{env,win}}
function percentile(a,p){if(!a.length)return 0;const b=a.slice().sort((x,y)=>x-y);return b[Math.max(0,Math.min(b.length-1,Math.floor((b.length-1)*p)))]}
function analyze(){const cap=capture();if(!cap?.data?.length)return[];const data=cap.data,sr=cap.sampleRate||48000,{env,win}=envelope(data,sr),noise=percentile(env,.2),peak=percentile(env,.98),sense=Math.max(1,Math.min(32,Number(slider.value)||16)),ratio=.34-(sense-1)/31*.27,high=noise+(peak-noise)*ratio,low=noise+(high-noise)*.42,minSilent=Math.max(2,Math.round(.045*sr/win)),minActive=Math.max(1,Math.round(.025*sr/win)),pad=Math.round(.006*sr);let active=false,start=0,silent=0,raw=[];for(let i=0;i<env.length;i++){const v=env[i];if(!active){if(v>=high){active=true;start=i;silent=0}}else{if(v<=low)silent++;else silent=0;if(silent>=minSilent){const end=i-silent+1;if(end-start>=minActive)raw.push([start,end]);active=false;silent=0}}}if(active&&env.length-start>=minActive)raw.push([start,env.length]);const out=[];for(const [a,b] of raw){let s=Math.max(0,a*win-pad),e=Math.min(data.length,b*win+pad);if(out.length&&s-out[out.length-1][1]<sr*.02)out[out.length-1][1]=e;else out.push([s,e])}return out}
auto.onclick=()=>{segments=analyze();if(!segments.length){status.textContent="AUTO FIND: NO SAMPLE BOUNDARIES DETECTED";return}window.MultiSynthChopper?.applyAutoSegments?.(segments);status.textContent=`AUTO FOUND ${segments.length} SAMPLE${segments.length===1?"":"S"} · HOLD SEGMENTS TO SELECT · NONE SELECTED SAVES ALL`;};
const oldClear=clear?.onclick;if(clear)clear.onclick=e=>{segments=null;window.MultiSynthChopper?.clearSelection?.();oldClear?.call(clear,e)};
})();
"use strict";
/* Whitman always-save persistence. PCM is stored in WebView IndexedDB (app-private storage); working state is restored automatically. */
(function(){
const DB="multisynth-whitman",STORE="pcm",STATE="whitman-working-state-v3";
let restoring=true,dirty=false,saveTimer=null;
function db(){return new Promise((ok,no)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE)};r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}
async function putPCM(i,s){const d=await db(),tx=d.transaction(STORE,"readwrite");if(s&&s.pcm)tx.objectStore(STORE).put({pcm:s.pcm.buffer.slice(0),sampleRate:s.sampleRate,name:s.name},i);else tx.objectStore(STORE).delete(i);return new Promise(r=>tx.oncomplete=r)}
async function getPCM(i){const d=await db(),tx=d.transaction(STORE,"readonly"),q=tx.objectStore(STORE).get(i);return new Promise(r=>{q.onsuccess=()=>r(q.result||null);q.onerror=()=>r(null)})}
function snapshot(){return {version:3,bpm:+bpmInput.value||120,selectedSample,selectedClipMode,samples:samples.map(s=>({name:s.name,start:s.start,end:s.end,pitch:s.pitch||0,level:s.level??1,leftLevel:s.leftLevel,rightLevel:s.rightLevel,lagMs:s.lagMs,spatialLock:s.spatialLock,hasPCM:!!s.pcm})),steps:pattern.map(x=>[...x]),clips:clipPattern.map(x=>[...x.entries()])}}
async function save(){if(restoring)return;dirty=false;try{localStorage.setItem(STATE,JSON.stringify(snapshot()));for(let i=0;i<samples.length;i++)await putPCM(i,samples[i])}catch(e){console.error("Whitman autosave",e)}}
function mark(){if(restoring)return;dirty=true;if(saveTimer)clearTimeout(saveTimer);saveTimer=setTimeout(save,350)}
async function restore(){let state=null;try{state=JSON.parse(localStorage.getItem(STATE)||localStorage.getItem("whitman-working-state-v2")||"null")}catch(_){state=null}if(!state){restoring=false;return}try{
 for(let i=0;i<samples.length;i++){const p=await getPCM(i);if(p&&p.pcm){installPCM(i,new Float32Array(p.pcm),p.sampleRate,p.name);const m=state.samples&&state.samples[i];if(m){Object.assign(samples[i],{name:m.name||samples[i].name,start:Math.max(0,Math.min(m.start||0,samples[i].buffer.duration)),end:Math.max(0,Math.min(m.end||samples[i].buffer.duration,samples[i].buffer.duration)),pitch:m.pitch||0,level:m.level??1,leftLevel:m.leftLevel??1,rightLevel:m.rightLevel??1,lagMs:m.lagMs||0,spatialLock:!!m.spatialLock})}}}
 pattern.forEach(x=>x.clear());clipPattern.forEach(x=>x.clear());(state.steps||[]).forEach((a,i)=>(a||[]).forEach(x=>pattern[i]&&pattern[i].add(x)));(state.clips||[]).forEach((a,i)=>(a||[]).forEach(([x,m])=>clipPattern[i]&&clipPattern[i].set(x,m)));
 bpmInput.value=state.bpm||120;selectedClipMode=state.selectedClipMode||"none";document.querySelectorAll(".clipMode").forEach(b=>b.classList.toggle("active",b.dataset.mode===selectedClipMode));selectedStep=null;selectSample(Math.max(0,Math.min(samples.length-1,state.selectedSample||0)));renderSteps();audioStatus.textContent="RESTORED";
 }catch(e){console.error("Whitman restore",e);audioStatus.textContent="RESTORE ERROR"}finally{restoring=false}}
const originalInstall=window.installPCM;if(typeof originalInstall==="function")window.installPCM=function(){const r=originalInstall.apply(this,arguments);mark();return r};
document.addEventListener("input",mark,true);document.addEventListener("change",mark,true);document.addEventListener("click",()=>setTimeout(mark,0),true);window.addEventListener("pagehide",save);window.WhitmanSaveNow=save;
restore();
})();

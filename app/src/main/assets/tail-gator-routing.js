"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{};
let armed=false,currentSink="";
async function outputs(){try{return (await navigator.mediaDevices?.enumerateDevices?.()||[]).filter(d=>d.kind==="audiooutput");}catch(_){return[];}}
async function phoneSink(){const list=await outputs();const local=list.find(d=>/built.?in|speaker|phone|this device/i.test(d.label||""));return local?.deviceId||"";}
async function setSink(id){const A=MS.NodeAudioGraph;if(!A)return false;const ctx=A.context;if(typeof ctx.setSinkId!=="function")return false;try{await ctx.setSinkId(id||"");currentSink=id||"";return true;}catch(e){console.warn("Tail Gator sink",e);return false;}}
async function returnToPhone(){armed=false;const id=await phoneSink();await setSink(id);global.dispatchEvent(new CustomEvent("multisynth-tail-gator-status",{detail:{armed:false,sinkId:id,mode:"phone"}}));}
async function routeExternal(id){armed=true;const ok=await setSink(id&&id!=="system"?id:"");global.dispatchEvent(new CustomEvent("multisynth-tail-gator-status",{detail:{armed:true,sinkId:id||"system",mode:"external",ok}}));}
global.addEventListener("multisynth-tail-gator",e=>{const d=e.detail||{};if(d.armed)routeExternal(String(d.sinkId||"system"));else returnToPhone();});
global.addEventListener("pointerdown",()=>{if(!armed)returnToPhone();},{once:true,capture:true});
MS.TailGator=Object.freeze({returnToPhone,routeExternal,get armed(){return armed},get sinkId(){return currentSink}});
})(window);
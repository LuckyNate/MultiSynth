"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{},branches=new Map();
let localSinkId="";
async function outputs(){try{return (await navigator.mediaDevices?.enumerateDevices?.()||[]).filter(d=>d.kind==="audiooutput");}catch(_){return[];}}
function labelOf(d){return String(d?.label||"").trim()}
function isCarLabel(label){return /\b(car|auto|automotive|vehicle|uconnect|sync|mylink|entune|hands[ -]?free)\b/i.test(label||"")}
function isBluetoothLabel(label){return /bluetooth|bt\b|headphone|headset|earbud|speaker/i.test(label||"")}
async function phoneSink(){const list=await outputs();const local=list.find(d=>/built.?in|speakerphone|phone speaker|this device|internal speaker/i.test(labelOf(d)));return local?.deviceId||"";}
async function keepLocal(){const A=MS.NodeAudioGraph;if(!A)return false;const ctx=A.context;if(typeof ctx.setSinkId!=="function")return false;const id=await phoneSink();if(!id)return false;if(localSinkId===id)return true;try{await ctx.setSinkId(id);localSinkId=id;return true}catch(e){console.warn("Local output sink",e);return false}}
function remove(id){const b=branches.get(id);if(!b)return;try{b.node.disconnect(b.dest)}catch(_){}try{b.audio.pause()}catch(_){}try{b.audio.srcObject=null}catch(_){}branches.delete(id)}
function ensure(id,node){let b=branches.get(id);if(b&&b.node===node)return b;if(b)remove(id);const ctx=node?.context;if(!ctx?.createMediaStreamDestination||typeof global.Audio!=="function")return null;const dest=ctx.createMediaStreamDestination();node.connect(dest);const audio=new Audio();audio.autoplay=true;audio.playsInline=true;audio.srcObject=dest.stream;b={id,node,dest,audio,sinkId:""};branches.set(id,b);audio.play().catch(()=>{});return b}
async function setBranchSink(b,id){if(!b||!id||typeof b.audio.setSinkId!=="function")return false;try{await b.audio.setSinkId(id);b.sinkId=id;await b.audio.play().catch(()=>{});return true}catch(e){console.warn("External output sink",e);return false}}
async function routeBluetooth(instanceId,node){await keepLocal();const list=await outputs();const target=list.find(d=>!isCarLabel(labelOf(d))&&isBluetoothLabel(labelOf(d))&&d.deviceId);if(!target){remove(instanceId);return false}const b=ensure(instanceId,node);return setBranchSink(b,target.deviceId)}
async function routeTailGator(instanceId,node,sinkId,armed){await keepLocal();if(!armed){remove(instanceId);return false}let id=String(sinkId||"");if(!id||id==="system"){const list=await outputs();const car=list.find(d=>isCarLabel(labelOf(d))&&d.deviceId);id=car?.deviceId||""}if(!id){remove(instanceId);return false}const b=ensure(instanceId,node);return setBranchSink(b,id)}
MS.OutputRouting=Object.freeze({outputs,keepLocal,routeBluetooth,routeTailGator,remove,get localSinkId(){return localSinkId}});
queueMicrotask(()=>keepLocal());
})(window);
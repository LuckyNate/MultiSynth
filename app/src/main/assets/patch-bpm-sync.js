"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{},E=MS.NodeGraphEngine,C=MS.ModuleContract,T=MS.PatchTransport;if(!E||!C||!T)return;
const original=E.setModuleState.bind(E);let initialized=false;
function bpmControlInfo(m){try{const c=C.getSurface(m?.type)?.controls?.find(x=>x?.state==="bpm");return c?{control:c.control||null}:null}catch(_){return null}}
function bpmModules(){return(E.graph().modules||[]).filter(bpmControlInfo)}
function syncBpmFrom(sourceId,bpm,sourceInfo){let knobsAlreadySynced=sourceInfo?.control==="knob";for(const m of bpmModules()){if(m.id===String(sourceId))continue;const target=bpmControlInfo(m);if(!target)continue;if(target.control==="knob"){if(knobsAlreadySynced)continue;original(m.id,{bpm});knobsAlreadySynced=true;continue}original(m.id,{bpm})}}
function setModuleState(mid,patch){const p=patch||{},source=E.getModule(mid),info=bpmControlInfo(source);if(!info||!Object.prototype.hasOwnProperty.call(p,"bpm"))return original(mid,p);const bpm=T.setBpm(p.bpm),next={...p,bpm},result=original(mid,next);syncBpmFrom(mid,bpm,info);return result}
function syncGraph(){const list=bpmModules();if(!list.length){initialized=false;T.setBpm(120);T.resetPhase();return}if(!initialized){T.setBpm(list[0].state?.bpm);initialized=true}const bpm=T.bpm;if(list.some(m=>Number(m.state?.bpm)!==bpm))setModuleState(list[0].id,{bpm})}
E.on("graph-changed",()=>queueMicrotask(syncGraph));queueMicrotask(syncGraph);
MS.NodeGraphEngine=Object.freeze({...E,setModuleState});
})(window);

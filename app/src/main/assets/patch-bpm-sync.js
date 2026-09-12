"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{},E=MS.NodeGraphEngine,C=MS.ModuleContract;if(!E||!C)return;
const original=E.setModuleState.bind(E);
function bpmControlInfo(m){try{const c=C.getSurface(m?.type)?.controls?.find(x=>x?.state==="bpm");return c?{control:c.control||null}:null}catch(_){return null}}
function setModuleState(mid,patch){const p=patch||{},source=E.getModule(mid),info=bpmControlInfo(source);if(!info||!Object.prototype.hasOwnProperty.call(p,"bpm"))return original(mid,p);const bpm=p.bpm,result=original(mid,p),g=E.graph();let knobsAlreadySynced=info.control==="knob";for(const m of g.modules||[]){if(m.id===String(mid))continue;const target=bpmControlInfo(m);if(!target)continue;if(target.control==="knob"){if(knobsAlreadySynced)continue;original(m.id,{bpm});knobsAlreadySynced=true;continue}original(m.id,{bpm})}return result}
MS.NodeGraphEngine=Object.freeze({...E,setModuleState});
})(window);

"use strict";
(function(){
const MS=window.MultiSynth||{},E=MS.RackEngine,btn=document.getElementById("sendToNodeBtn");
const PROJECT="multisynth.rack.project.v1",FOCUS="multisynth.node-plane.focus.v1";
if(!btn||!E)return;
function current(){const g=E.graph?.();for(const r of g?.racks||[]){if((r.modules||[]).length)return{rack:r,module:r.modules[r.modules.length-1]}}return null}
function refresh(){btn.hidden=!current()}
btn.addEventListener("click",()=>{const x=current();if(!x)return;try{localStorage.setItem(PROJECT,E.serialize({nodePlane:true,at:Date.now(),promotedFrom:"module-test",selectedRack:x.rack.id}));localStorage.setItem(FOCUS,JSON.stringify({kind:"module",id:x.module.id,rackId:x.rack.id,at:Date.now()}));location.href="nodebuilder.html"}catch(e){console.error("Node promotion",e)}});
E.on?.("graph-changed",refresh);refresh();
})();

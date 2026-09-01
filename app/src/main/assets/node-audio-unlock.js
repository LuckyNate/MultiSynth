"use strict";
(function(global){
const A=global.MultiSynth?.NodeAudioGraph,viewport=document.getElementById("nodeViewport"),browser=document.getElementById("nodeBrowser");if(!A)return;
function unlock(){try{A.start?.();A.resume?.().catch?.(()=>{})}catch(e){console.error("Node graph audio unlock",e)}}
viewport?.addEventListener("pointerdown",unlock,{capture:true,passive:true});browser?.addEventListener("pointerdown",unlock,{capture:true,passive:true});document.getElementById("nodeModuleEditor")?.addEventListener("pointerdown",unlock,{capture:true,passive:true});
global.MultiSynthNodeAudioUnlock=Object.freeze({resume:unlock});
})(window);

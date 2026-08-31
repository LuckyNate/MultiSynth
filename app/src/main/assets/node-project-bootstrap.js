"use strict";
(function(global){
const MS=global.MultiSynth||{},E=MS.NodeGraphEngine,KEY="multisynth.node.project.v1";if(!E)return;let restoring=true;try{const raw=localStorage.getItem(KEY);if(raw)E.restore(raw)}catch(e){console.error("Node project restore",e)}restoring=false;function save(){if(restoring)return;try{localStorage.setItem(KEY,E.serialize({nodePlane:true,at:Date.now()}))}catch(e){console.error("Node project save",e)}}E.on("graph-changed",save);E.on("module-state",save);global.addEventListener("pagehide",save);global.addEventListener("beforeunload",save);save();
})(window);

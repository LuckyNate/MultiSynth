"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{},E=MS.NodeGraphEngine,T=MS.PatchTransport;if(!E||!T)return;
function apply(payload){const state=payload?.state||E.getPatchState?.()||{};T.setBpm(state.bpm)}
E.on?.("patch-state",apply);
apply();
})(window);

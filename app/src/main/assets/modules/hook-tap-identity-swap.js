"use strict";
(function(global){
const C=global.MultiSynth?.ModuleContract;if(!C)return;
try{
 const hook=C.getDefinition("hookworm"),tap=C.getDefinition("tapeworm");
 C.define({...hook,displayName:"Tapeworm",color:"#f58ab3",selectorClass:"tapeworm",description:"VARIABLE-SPEED CONTINUOUS TAPE LOOP · HOLD MIC TO RECORD"});
 C.define({...tap,displayName:"Hookworm",color:"#e98232",selectorClass:"hookworm",description:"SHEDDING SEGMENT / GRAIN LOOP · HOLD MIC TO RECORD · OPTIONAL TEMPO SYNC"});
}catch(e){console.error("Hookworm/Tapeworm identity swap",e)}
})(window);

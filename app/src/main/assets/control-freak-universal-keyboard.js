"use strict";
(()=>{
  const P=parent.MultiSynth||{},A=P.RackAudioGraph,host=document.getElementById("performanceKeyboard");
  if(!host||!window.MultiSynth?.PerformanceKeyboard?.mount)return;
  const keyboard=window.MultiSynth.PerformanceKeyboard.mount(host,{audio:A});
  const cleanup=()=>{try{keyboard?.destroy?.()}catch(_){}};
  window.addEventListener("pagehide",cleanup,{once:true});
  window.addEventListener("beforeunload",cleanup,{once:true});
})();

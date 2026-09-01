"use strict";
(()=>{
  const P=parent.MultiSynth||{},A=P.NodeAudioGraph,host=document.getElementById("performanceKeyboard");
  if(!host||!window.MultiSynth?.PerformanceKeyboard?.mount)return;
  document.body.classList.add("hasPinnedKeyboard");
  const keyboard=window.MultiSynth.PerformanceKeyboard.mount(host,{audio:A});
  const cleanup=()=>{document.body.classList.remove("hasPinnedKeyboard");try{keyboard?.destroy?.()}catch(_){}};
  window.addEventListener("pagehide",cleanup,{once:true});
  window.addEventListener("beforeunload",cleanup,{once:true});
})();

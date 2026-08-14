"use strict";
(function(){
  const oldButton=document.getElementById("micButton");
  if(!oldButton||!window.MultiSynthNativeMic)return;
  const button=oldButton.cloneNode(true);
  oldButton.replaceWith(button);
  button.textContent="HOLD TO RECORD";
  let held=false,recordingNative=false,chunks=[],sampleRate=48000,unsubscribe=null;

  function cleanup(){
    try{if(unsubscribe)unsubscribe()}catch(_){}
    unsubscribe=null;
    try{MultiSynthNativeMic.stop()}catch(_){}
    recordingNative=false;
    button.classList.remove("active");
    button.textContent="HOLD TO RECORD";
  }

  function start(e){
    e.preventDefault();
    if(e.button!==undefined&&e.button!==0)return;
    if(recordingNative)return;
    held=true;
    try{button.setPointerCapture(e.pointerId)}catch(_){}
    chunks=[];
    sampleRate=48000;
    unsubscribe=MultiSynthNativeMic.subscribe((pcm,sr)=>{
      if(!recordingNative||!pcm.length)return;
      sampleRate=sr||sampleRate;
      chunks.push(new Float32Array(pcm));
    });
    if(!MultiSynthNativeMic.start()){
      cleanup();
      audioStatus.textContent="MIC NATIVE START FAILED";
      return;
    }
    recordingNative=true;
    button.classList.add("active");
    button.textContent="RECORDING — RELEASE";
    audioStatus.textContent="RECORDING";
  }

  function stop(e){
    if(e){
      e.preventDefault();
      try{if(button.hasPointerCapture(e.pointerId))button.releasePointerCapture(e.pointerId)}catch(_){}
    }
    held=false;
    if(!recordingNative)return;
    const captured=chunks.slice();
    cleanup();
    chunks=[];
    let n=0;captured.forEach(c=>n+=c.length);
    if(!n){audioStatus.textContent="MIC EMPTY";return;}
    const pcm=new Float32Array(n);let o=0;
    captured.forEach(c=>{pcm.set(c,o);o+=c.length});
    installPCM(selectedSample,pcm,sampleRate,`MIC ${String(selectedSample+1).padStart(2,"0")}`);
    audioStatus.textContent=`PCM READY ${(n/sampleRate).toFixed(2)}s`;
  }

  button.addEventListener("contextmenu",e=>e.preventDefault());
  button.addEventListener("pointerdown",start);
  button.addEventListener("pointerup",stop);
  button.addEventListener("pointercancel",stop);
  button.addEventListener("lostpointercapture",()=>{if(!held&&recordingNative)stop()});
  window.addEventListener("pagehide",()=>{if(recordingNative)cleanup()});
})();

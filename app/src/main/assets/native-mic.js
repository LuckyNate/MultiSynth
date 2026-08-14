"use strict";
(function(){
  const listeners=new Set();
  let active=false;
  function decodeBase64(s){
    const bin=atob(s), n=bin.length>>1, out=new Float32Array(n);
    for(let i=0,j=0;i<n;i++,j+=2){
      let v=bin.charCodeAt(j)|(bin.charCodeAt(j+1)<<8);
      if(v&0x8000)v-=0x10000;
      out[i]=v/32768;
    }
    return out;
  }
  window.MultiSynthNativeMic={
    receive(base64,sampleRate){
      if(!base64)return;
      const pcm=decodeBase64(base64);
      listeners.forEach(fn=>{try{fn(pcm,Number(sampleRate)||48000)}catch(e){console.error(e)}});
    },
    status(text){
      document.dispatchEvent(new CustomEvent("multisynth-mic-status",{detail:String(text||"")}));
    },
    subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)},
    start(){
      if(active)return true;
      if(!window.AndroidMidi||typeof AndroidMidi.startMic!=="function")return false;
      try{active=!!AndroidMidi.startMic();return active}catch(e){console.error(e);return false}
    },
    stop(){
      if(!active)return;
      active=false;
      try{AndroidMidi.stopMic()}catch(e){console.error(e)}
    },
    get active(){return active}
  };
})();

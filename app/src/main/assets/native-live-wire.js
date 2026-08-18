"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{};
const listeners=new Set();
let statusText="LIVE WIRE IDLE",sampleRate=48000;
function decode(b64){const bin=atob(b64),n=bin.length>>1,out=new Float32Array(n);for(let i=0,j=0;i<n;i++,j+=2){let v=(bin.charCodeAt(j)&255)|((bin.charCodeAt(j+1)&255)<<8);if(v&0x8000)v-=0x10000;out[i]=v/32768}return out}
const api={
 available(){return !!global.AndroidMidi&&typeof global.AndroidMidi.startLiveWire==="function"},
 start(){return this.available()?!!global.AndroidMidi.startLiveWire():false},
 stop(){if(this.available())global.AndroidMidi.stopLiveWire()},
 onChunk(fn){listeners.add(fn);return()=>listeners.delete(fn)},
 get status(){return statusText},get sampleRate(){return sampleRate},
 receive(b64,rate){sampleRate=Number(rate)||48000;const pcm=decode(b64);listeners.forEach(fn=>{try{fn(pcm,sampleRate)}catch(e){console.error(e)}})},
 status(text){statusText=String(text||"");global.dispatchEvent(new CustomEvent("multisynth-live-wire-status",{detail:statusText}))}
};
MS.LiveWireNative=api;
global.MultiSynthLiveWire={receive:(b,r)=>api.receive(b,r),status:t=>api.status(t)};
})(window);
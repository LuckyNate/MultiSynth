"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{};
const listeners=new Set(),searches=new Map();
let statusText="LIVE WIRE IDLE",sampleRate=48000,searchSeq=1;
function bridge(){return global.LiveWireAndroid||global.AndroidMidi||null}
function decode(b64){const bin=atob(b64),n=bin.length>>1,out=new Float32Array(n);for(let i=0,j=0;i<n;i++,j+=2){let v=(bin.charCodeAt(j)&255)|((bin.charCodeAt(j+1)&255)<<8);if(v&0x8000)v-=0x10000;out[i]=v/32768}return out}
const api={
 available(){const b=bridge();return !!b&&typeof b.startLiveWire==="function"},
 start(){const b=bridge();return b&&typeof b.startLiveWire==="function"?!!b.startLiveWire():false},
 stop(){bridge()?.stopLiveWire?.()},
 onChunk(fn){listeners.add(fn);return()=>listeners.delete(fn)},
 get status(){return statusText},get sampleRate(){return sampleRate},
 receive(b64,rate){sampleRate=Number(rate)||48000;const pcm=decode(b64);listeners.forEach(fn=>{try{fn(pcm,sampleRate)}catch(e){console.error(e)}})},
 status(text){statusText=String(text||"");global.dispatchEvent(new CustomEvent("multisynth-live-wire-status",{detail:statusText}))},
 search(query,{random=false,max=12}={}){return new Promise((resolve,reject)=>{const b=bridge();if(!b||typeof b.audioSourceSearch!=="function"){reject(new Error("AUDIO SOURCE SEARCH UNAVAILABLE"));return}const id=searchSeq++;searches.set(id,{resolve,reject});try{b.audioSourceSearch(String(query||""),id,!!random,Math.max(4,Math.min(24,Number(max)||12)))}catch(e){searches.delete(id);reject(e)}})},
 searchResult(id,json){const p=searches.get(Number(id));if(!p)return;searches.delete(Number(id));try{const data=typeof json==="string"?JSON.parse(json):json;if(data&&data.error)throw new Error(data.error);p.resolve(Array.isArray(data?.items)?data.items:[])}catch(e){p.reject(e)}}
};
MS.LiveWireNative=api;
global.MultiSynthLiveWire={receive:(b,r)=>api.receive(b,r),status:t=>api.status(t),searchResult:(id,j)=>api.searchResult(id,j)};
})(window);

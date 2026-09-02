"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{};
const listeners=new Set(),playerListeners=new Set(),searches=new Map();
let statusText="LIVE WIRE IDLE",sampleRate=48000,searchSeq=1,playerState={state:-1,current:0,duration:0};
let queue=[],randomOn=false,refilling=null;
function bridge(){return global.LiveWireAndroid||global.AndroidMidi||null}
function decode(b64){const bin=atob(b64),n=bin.length>>1,out=new Float32Array(n);for(let i=0,j=0;i<n;i++,j+=2){let v=(bin.charCodeAt(j)&255)|((bin.charCodeAt(j+1)&255)<<8);if(v&0x8000)v-=0x10000;out[i]=v/32768}return out}
function valid(items){const out=[],seen=new Set(queue.map(x=>x.id));for(const x of items||[]){const id=String(x?.id||"");if(!/^[A-Za-z0-9_-]{11}$/.test(id)||seen.has(id))continue;seen.add(id);out.push({id,title:String(x.title||id)});if(queue.length+out.length>=5)break}return out}
const api={
 available(){const b=bridge();return !!b&&typeof b.startLiveWire==="function"},
 start(){const b=bridge();return b&&typeof b.startLiveWire==="function"?!!b.startLiveWire():false},
 stop(){const b=bridge();if(b&&typeof b.stopLiveWire==="function")b.stopLiveWire()},
 setValve(open){bridge()?.liveWireValve?.(!!open)},
 setTransportRate(rate){bridge()?.liveWireTransportRate?.(Number(rate)||0)},
 play(id){const b=bridge();if(b&&typeof b.liveWirePlay==="function")b.liveWirePlay(String(id||""))},
 pause(){bridge()?.liveWirePause?.()},resume(){bridge()?.liveWireResume?.()},
 stopPlayer(){bridge()?.liveWireStopPlayer?.();playerState={...playerState,state:-1,current:0};api.emit()},
 setMuted(muted){bridge()?.liveWireMute?.(!!muted)},
 seek(seconds){bridge()?.liveWireSeek?.(Number(seconds)||0)},
 clearQueue(){queue=[];api.emit()},
 get queue(){return queue.slice()},get random(){return randomOn},setRandom(on){randomOn=!!on;try{localStorage.setItem("live-wire-random",randomOn?"1":"0")}catch(_){}if(randomOn)api.refill()},
 setQueue(items,{play=true}={}){queue=[];queue.push(...valid(items));api.emit();if(play&&queue[0])api.play(queue[0].id);if(randomOn)api.refill()},
 async next(){if(queue.length)queue.shift();if(!queue.length)await api.refill(true);else if(randomOn)api.refill();api.emit();if(queue[0])api.play(queue[0].id)},
 async refill(force=false){if(queue.length>=5||(!force&&!randomOn))return queue;if(refilling)return refilling;refilling=(async()=>{try{let tries=0;while(queue.length<5&&tries++<6&&(force||randomOn)){const items=await api.search("",{random:true,max:15});const add=valid(items);queue.push(...add);if(!add.length&&tries>=2)break}api.emit();return queue}finally{refilling=null}})();return refilling},
 onPlayer(fn){playerListeners.add(fn);try{fn({...playerState,queue:queue.slice(),random:randomOn})}catch(_){}return()=>playerListeners.delete(fn)},emit(){const s={...playerState,queue:queue.slice(),random:randomOn};playerListeners.forEach(fn=>{try{fn(s)}catch(e){console.error(e)}});global.dispatchEvent(new CustomEvent("multisynth-live-wire-player",{detail:s}))},
 playerEvent(type,json){let data={};try{data=typeof json==="string"?JSON.parse(json):json||{}}catch(_){}playerState={...playerState,...data,type};if(type==="state"&&Number(data.state)===0){api.next();return}if(type==="error"){api.next();return}api.emit()},
 onChunk(fn){listeners.add(fn);return()=>listeners.delete(fn)},get status(){return statusText},get sampleRate(){return sampleRate},get playerState(){return {...playerState,queue:queue.slice(),random:randomOn}},receive(b64,rate){sampleRate=Number(rate)||48000;const pcm=decode(b64);listeners.forEach(fn=>{try{fn(pcm,sampleRate)}catch(e){console.error(e)}})},status(text){statusText=String(text||"");global.dispatchEvent(new CustomEvent("multisynth-live-wire-status",{detail:statusText}))},
 search(query,{random=false,max=12}={}){return new Promise((resolve,reject)=>{const b=bridge();if(!b||typeof b.youtubeSearch!=="function"){reject(new Error("YOUTUBE SEARCH UNAVAILABLE"));return}const id=searchSeq++;searches.set(id,{resolve,reject});try{b.youtubeSearch(String(query||""),id,!!random,Math.max(5,Math.min(25,Number(max)||12)))}catch(e){searches.delete(id);reject(e)}})},searchResult(id,json){const p=searches.get(Number(id));if(!p)return;searches.delete(Number(id));try{const data=typeof json==="string"?JSON.parse(json):json;if(data&&data.error)throw new Error(data.error);p.resolve(Array.isArray(data?.items)?data.items:[])}catch(e){p.reject(e)}}
};
try{randomOn=localStorage.getItem("live-wire-random")==="1"}catch(_){}
MS.LiveWireNative=api;global.MultiSynthLiveWire={receive:(b,r)=>api.receive(b,r),status:t=>api.status(t),searchResult:(id,j)=>api.searchResult(id,j),playerEvent:(t,j)=>api.playerEvent(t,j)};
})(window);

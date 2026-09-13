"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{};
const tickListeners=new Set(),pulseListeners=new Set();
let bpm=120,lastFrame=null,sampleRate=48000,phase=0,pulse=0,substep=0;
const clampBpm=v=>Math.max(20,Math.min(300,Number(v)||120));
function setBpm(value){bpm=clampBpm(value);return bpm}
function resetPhase(nextSubstep=0){lastFrame=null;phase=0;substep=Math.max(0,Math.floor(Number(nextSubstep)||0));pulse=substep*6;return snapshot()}
function snapshot(){return{bpm,frame:lastFrame,sampleRate,phase,pulse,substep,ppqn:24}}
function setDelivery(active){MS.NodeAudioGraph?.setTimebaseActive?.(active===true)}
function subscribe(set,fn){if(typeof fn!=="function")return()=>{};const wasIdle=tickListeners.size===0&&pulseListeners.size===0;set.add(fn);if(wasIdle){lastFrame=null;setDelivery(true)}let closed=false;return()=>{if(closed)return;closed=true;set.delete(fn);if(tickListeners.size===0&&pulseListeners.size===0){lastFrame=null;setDelivery(false)}}}
function subscribeTick(fn){return subscribe(tickListeners,fn)}
function subscribePulse(fn){return subscribe(pulseListeners,fn)}
function emit(set,value,label){for(const fn of [...set])try{fn(value)}catch(e){console.error(label,e)}}
function ingestTimebase(msg={}){const frame=Number(msg.frame),rate=Number(msg.sampleRate)||sampleRate;if(!Number.isFinite(frame)||!Number.isFinite(rate)||rate<=0)return false;sampleRate=rate;if(lastFrame===null||frame<lastFrame){lastFrame=frame;return true}const startFrame=lastFrame,startPhase=phase,delta=frame-startFrame;lastFrame=frame;if(delta<=0)return true;const framesPerPulse=sampleRate*(60/bpm)/24,total=startPhase+delta/framesPerPulse;if(total<1){phase=total;return true}const crossed=Math.floor(total);phase=total-crossed;for(let i=0;i<crossed;i++){const boundaryFrame=startFrame+(1-startPhase+i)*framesPerPulse;pulse++;const midi={type:"midi-clock",source:"patch-transport",ppqn:24,pulse,pulseInQuarter:(pulse-1)%24,quarter:Math.floor((pulse-1)/24),frame:boundaryFrame,time:boundaryFrame/sampleRate,sampleRate,bpm};emit(pulseListeners,midi,"Patch transport pulse listener");if(pulse%6===0){const tick={type:"clock",source:"patch-transport",frame:boundaryFrame,time:boundaryFrame/sampleRate,sampleRate,bpm,substep,beat:Math.floor(substep/4),pulse,ppqn:24};substep++;emit(tickListeners,tick,"Patch transport tick listener")}}return true}
MS.PatchTransport=Object.freeze({setBpm,resetPhase,subscribeTick,subscribePulse,ingestTimebase,snapshot,get bpm(){return bpm},get phase(){return phase},get pulse(){return pulse},get substep(){return substep},get ppqn(){return 24},get active(){return tickListeners.size>0||pulseListeners.size>0}});
})(window);

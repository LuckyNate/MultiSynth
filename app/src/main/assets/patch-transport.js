"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{};
const tickListeners=new Set(),pulseListeners=new Set(),realtimePulseListeners=new Set();
const LOOKAHEAD_SECONDS=.1;
let bpm=120,lastFrame=null,sampleRate=48000,phase=0,pulse=0,substep=0,scheduledPulse=0;
const clampBpm=v=>Math.max(20,Math.min(300,Number(v)||120));
function setBpm(value){bpm=clampBpm(value);return bpm}
function resetPhase(nextSubstep=0){lastFrame=null;phase=0;substep=Math.max(0,Math.floor(Number(nextSubstep)||0));pulse=substep*6;scheduledPulse=pulse;return snapshot()}
function snapshot(){return{bpm,frame:lastFrame,sampleRate,phase,pulse,substep,scheduledPulse,ppqn:24,lookahead:LOOKAHEAD_SECONDS}}
function setDelivery(active){MS.NodeAudioGraph?.setTimebaseActive?.(active===true)}
function activeCount(){return tickListeners.size+pulseListeners.size+realtimePulseListeners.size}
function subscribe(set,fn){if(typeof fn!=="function")return()=>{};const wasIdle=activeCount()===0;set.add(fn);if(wasIdle){lastFrame=null;scheduledPulse=pulse;setDelivery(true)}let closed=false;return()=>{if(closed)return;closed=true;set.delete(fn);if(activeCount()===0){lastFrame=null;scheduledPulse=pulse;setDelivery(false)}}}
function subscribeTick(fn){return subscribe(tickListeners,fn)}
function subscribePulse(fn){return subscribe(pulseListeners,fn)}
function subscribeRealtimePulse(fn){return subscribe(realtimePulseListeners,fn)}
function emit(set,value,label){for(const fn of [...set])try{fn(value)}catch(e){console.error(label,e)}}
function pulsePacket(p,boundaryFrame,scheduled){return{type:"midi-clock",source:"patch-transport",ppqn:24,pulse:p,pulseInQuarter:(p-1)%24,quarter:Math.floor((p-1)/24),frame:boundaryFrame,time:boundaryFrame/sampleRate,sampleRate,bpm,scheduled:scheduled===true}}
function emitScheduledFrom(frame,framesPerPulse){const limitFrame=frame+sampleRate*LOOKAHEAD_SECONDS;for(let j=1;;j++){const boundaryFrame=frame+(j-phase)*framesPerPulse;if(boundaryFrame>limitFrame)break;const p=pulse+j;if(p<=scheduledPulse)continue;const midi=pulsePacket(p,boundaryFrame,true);emit(pulseListeners,midi,"Patch transport scheduled pulse listener");if(p%6===0){const st=p/6-1,tick={type:"clock",source:"patch-transport",frame:boundaryFrame,time:boundaryFrame/sampleRate,sampleRate,bpm,substep:st,beat:Math.floor(st/4),pulse:p,ppqn:24,scheduled:true};emit(tickListeners,tick,"Patch transport scheduled tick listener")}scheduledPulse=p}}
function ingestTimebase(msg={}){const frame=Number(msg.frame),rate=Number(msg.sampleRate)||sampleRate;if(!Number.isFinite(frame)||!Number.isFinite(rate)||rate<=0)return false;sampleRate=rate;const framesPerPulse=sampleRate*(60/bpm)/24;if(lastFrame===null||frame<lastFrame){lastFrame=frame;scheduledPulse=Math.max(scheduledPulse,pulse);emitScheduledFrom(frame,framesPerPulse);return true}const startFrame=lastFrame,startPhase=phase,delta=frame-startFrame;lastFrame=frame;if(delta>0){const total=startPhase+delta/framesPerPulse,crossed=Math.floor(total);phase=total-crossed;if(crossed>0){for(let i=0;i<crossed;i++){const boundaryFrame=startFrame+(1-startPhase+i)*framesPerPulse;pulse++;emit(realtimePulseListeners,pulsePacket(pulse,boundaryFrame,false),"Patch transport realtime pulse listener")}substep=Math.floor(pulse/6);if(pulse>scheduledPulse)scheduledPulse=pulse}}emitScheduledFrom(frame,framesPerPulse);return true}
MS.PatchTransport=Object.freeze({setBpm,resetPhase,subscribeTick,subscribePulse,subscribeRealtimePulse,ingestTimebase,snapshot,get bpm(){return bpm},get phase(){return phase},get pulse(){return pulse},get substep(){return substep},get ppqn(){return 24},get lookahead(){return LOOKAHEAD_SECONDS},get active(){return activeCount()>0}});
})(window);

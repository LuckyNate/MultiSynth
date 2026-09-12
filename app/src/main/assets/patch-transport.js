"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{};
const listeners=new Set();
let bpm=120,lastFrame=null,sampleRate=48000,phase=0,substep=0;
const clampBpm=v=>Math.max(20,Math.min(300,Number(v)||120));
function setBpm(value){bpm=clampBpm(value);return bpm}
function resetPhase(nextSubstep=0){lastFrame=null;phase=0;substep=Math.max(0,Math.floor(Number(nextSubstep)||0));return snapshot()}
function snapshot(){return{bpm,frame:lastFrame,sampleRate,phase,substep}}
function subscribeTick(fn){if(typeof fn!=="function")return()=>{};listeners.add(fn);return()=>listeners.delete(fn)}
function ingestTimebase(pulse={}){const frame=Number(pulse.frame),rate=Number(pulse.sampleRate)||sampleRate;if(!Number.isFinite(frame)||!Number.isFinite(rate)||rate<=0)return false;sampleRate=rate;if(lastFrame===null||frame<lastFrame){lastFrame=frame;return true}const startFrame=lastFrame,delta=frame-startFrame;lastFrame=frame;if(delta<=0)return true;const framesPerStep=sampleRate*(60/bpm)/4,total=phase+delta/framesPerStep;if(total<1){phase=total;return true}const crossed=Math.max(1,Math.floor(total));phase=total-crossed;substep+=crossed;const tickSubstep=substep-1,boundaryFrame=frame-phase*framesPerStep,tick={type:"clock",source:"patch-transport",frame:boundaryFrame,time:boundaryFrame/sampleRate,sampleRate,bpm,substep:tickSubstep,beat:Math.floor(tickSubstep/4)};for(const fn of [...listeners])try{fn(tick)}catch(e){console.error("Patch transport listener",e)}return true}
MS.PatchTransport=Object.freeze({setBpm,resetPhase,subscribeTick,ingestTimebase,snapshot,get bpm(){return bpm},get phase(){return phase},get substep(){return substep}});
})(window);

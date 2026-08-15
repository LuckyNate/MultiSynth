"use strict";
(function(global){
const host=document.getElementById("rackKeyboard"),keys=document.getElementById("keyboardKeys");
if(!host||!keys)return;
const A=global.MultiSynth?.RackAudioGraph;if(!A)return;
const held=new Map();
function keyAt(x,y){const el=document.elementFromPoint(x,y);const key=el?.closest?.("#keyboardKeys [data-note]");return key&&keys.contains(key)?key:null;}
function setActive(key,on){if(key)key.classList.toggle("active",!!on);host.classList.toggle("ribbon-active",held.size>0||!!on);}
function startNote(pointerId,key){if(!key)return;const note=Number(key.dataset.note);if(!Number.isFinite(note))return;try{A.resume?.();}catch(_){}held.set(pointerId,{note,key});setActive(key,true);try{A.noteOn(note,127);}catch(e){console.error("Rack ribbon noteOn",e);}}
function moveNote(pointerId,key){const h=held.get(pointerId);if(!h||!key)return;const note=Number(key.dataset.note);if(!Number.isFinite(note)||note===h.note)return;try{A.noteOff(h.note);}catch(e){console.error("Rack ribbon noteOff",e);}setActive(h.key,false);held.set(pointerId,{note,key});setActive(key,true);try{A.noteOn(note,127);}catch(e){console.error("Rack ribbon noteOn",e);}}
function endNote(pointerId){const h=held.get(pointerId);if(!h)return;held.delete(pointerId);try{A.noteOff(h.note);}catch(e){console.error("Rack ribbon noteOff",e);}setActive(h.key,false);host.classList.toggle("ribbon-active",held.size>0);}
host.addEventListener("pointerdown",e=>{const key=keyAt(e.clientX,e.clientY)||e.target.closest?.("[data-note]");if(!key)return;e.preventDefault();e.stopImmediatePropagation();try{host.setPointerCapture(e.pointerId);}catch(_){}startNote(e.pointerId,key);},true);
host.addEventListener("pointermove",e=>{if(!held.has(e.pointerId))return;e.preventDefault();e.stopImmediatePropagation();const key=keyAt(e.clientX,e.clientY);if(key)moveNote(e.pointerId,key);},true);
const finish=e=>{if(!held.has(e.pointerId))return;e.preventDefault();e.stopImmediatePropagation();endNote(e.pointerId);try{host.releasePointerCapture(e.pointerId);}catch(_){}};
host.addEventListener("pointerup",finish,true);host.addEventListener("pointercancel",finish,true);host.addEventListener("lostpointercapture",e=>endNote(e.pointerId),true);
})(window);

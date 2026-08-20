"use strict";
(()=>{
 const P=parent.MultiSynth||{},K=P.PerformanceKeyboard||window.MultiSynth?.PerformanceKeyboard,A=P.RackAudioGraph;
 const shell=document.getElementById("nqKeyboard"),scroll=document.getElementById("nqKeyScroll"),keys=document.getElementById("nqKeys"),ribbon=document.getElementById("nqVelocity"),readout=document.getElementById("nqVelocityValue");
 if(!shell||!scroll||!keys||!ribbon||!K||!A)return;
 const state=K.createState(innerWidth>innerHeight?"landscape":"portrait"),held=new Map();
 function drawVelocity(){readout.textContent=String(state.velocity);ribbon.style.setProperty("--velocity-pos",`${100-(state.velocity-K.VELOCITY_MIN)/(K.VELOCITY_MAX-K.VELOCITY_MIN)*100}%`)}
 function drawKeys(){keys.innerHTML="";for(let n=K.MIDI_MIN;n<=K.MIDI_MAX;n++){const b=document.createElement("button");b.type="button";b.className="nqKey "+(K.isBlack(n)?"black":"white");b.dataset.note=n;b.setAttribute("aria-label",K.noteName(n));if(n%12===0){const s=document.createElement("span");s.textContent=K.noteName(n);b.appendChild(s)}keys.appendChild(b)}requestAnimationFrame(()=>{const mid=keys.querySelector('[data-note="60"]');if(mid)scroll.scrollLeft=Math.max(0,mid.offsetLeft-scroll.clientWidth/2)})}
 function keyAt(x,y){const el=document.elementFromPoint(x,y)?.closest?.(".nqKey");return el&&keys.contains(el)?el:null}
 function start(pid,key){if(!key)return;const note=Number(key.dataset.note);held.set(pid,{note,key});key.classList.add("active");try{A.resume?.();A.noteOn(note,state.velocity)}catch(e){console.error(e)}}
 function move(pid,key){const h=held.get(pid);if(!h||!key)return;const note=Number(key.dataset.note);if(note===h.note)return;try{A.noteOff(h.note)}catch(_){}h.key.classList.remove("active");held.set(pid,{note,key});key.classList.add("active");try{A.noteOn(note,state.velocity)}catch(e){console.error(e)}}
 function end(pid){const h=held.get(pid);if(!h)return;held.delete(pid);h.key.classList.remove("active");try{A.noteOff(h.note)}catch(_){}}
 keys.addEventListener("pointerdown",e=>{const key=e.target.closest?.(".nqKey");if(!key)return;e.preventDefault();try{keys.setPointerCapture(e.pointerId)}catch(_){}start(e.pointerId,key)});
 keys.addEventListener("pointermove",e=>{if(!held.has(e.pointerId))return;e.preventDefault();const key=keyAt(e.clientX,e.clientY);if(key)move(e.pointerId,key)});
 const finish=e=>{end(e.pointerId);try{keys.releasePointerCapture(e.pointerId)}catch(_){}};keys.addEventListener("pointerup",finish);keys.addEventListener("pointercancel",finish);keys.addEventListener("lostpointercapture",e=>end(e.pointerId));
 function setRibbon(e){e.preventDefault();K.setVelocityFromY(state,e.clientY,ribbon.getBoundingClientRect());drawVelocity()}
 ribbon.addEventListener("pointerdown",e=>{setRibbon(e);try{ribbon.setPointerCapture(e.pointerId)}catch(_){}});ribbon.addEventListener("pointermove",e=>{if(ribbon.hasPointerCapture?.(e.pointerId))setRibbon(e)});
 drawKeys();drawVelocity();
})();

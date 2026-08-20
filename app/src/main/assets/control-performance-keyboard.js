"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{};
  const MIDI_MIN=21,MIDI_MAX=108,MIDDLE_C=60;
  const PORTRAIT_VISIBLE=25,LANDSCAPE_VISIBLE=49;
  const OCTAVE_CS=Object.freeze([24,36,48,60,72,84,96]);
  const VELOCITY_MIN=8,VELOCITY_MAX=127;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function visibleCount(orientation){return orientation==="landscape"?LANDSCAPE_VISIBLE:PORTRAIT_VISIBLE}
  function maxStart(count){return MIDI_MAX-count+1}
  function clampStart(start,count){return clamp(Math.round(start),MIDI_MIN,maxStart(count))}
  function middleAnchorIndex(count){return Math.floor((count-1)/2)}
  function startForTarget(targetMidi,count){return clampStart(targetMidi-middleAnchorIndex(count),count)}
  function startForOctave(octave,count){const target=OCTAVE_CS[clamp(Math.round(octave),1,7)-1];return startForTarget(target,count)}
  function initialStart(count){return startForTarget(MIDDLE_C,count)}
  function noteName(midi){const names=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];const n=clamp(Math.round(midi),MIDI_MIN,MIDI_MAX);return names[n%12]+(Math.floor(n/12)-1)}
  function isBlack(midi){return [1,3,6,8,10].includes(midi%12)}
  function velocityFromY(clientY,rect){const h=Math.max(1,rect?.height||1),p=clamp((clientY-(rect?.top||0))/h,0,1);return Math.round(VELOCITY_MAX-(VELOCITY_MAX-VELOCITY_MIN)*p)}
  function createState(orientation="portrait"){const count=visibleCount(orientation);return {orientation,count,start:initialStart(count),velocity:VELOCITY_MAX,active:new Map()}}
  function setOrientation(state,orientation){const oldCount=state.count,oldCenter=state.start+middleAnchorIndex(oldCount);state.orientation=orientation;state.count=visibleCount(orientation);state.start=startForTarget(oldCenter,state.count);return state}
  function setVelocity(state,velocity){state.velocity=clamp(Math.round(Number(velocity)||VELOCITY_MIN),VELOCITY_MIN,VELOCITY_MAX);return state.velocity}
  function setVelocityFromY(state,clientY,rect){return setVelocity(state,velocityFromY(clientY,rect))}
  function jumpOctave(state,octave){state.start=startForOctave(octave,state.count);return state.start}
  function panByNotes(state,delta){state.start=clampStart(state.start+delta,state.count);return state.start}
  function visibleNotes(state){return Array.from({length:state.count},(_,i)=>{const midi=state.start+i;return Object.freeze({midi,name:noteName(midi),black:isBlack(midi)})})}
  function noteOn(state,pointerId,midi){const n=clamp(Math.round(midi),MIDI_MIN,MIDI_MAX);state.active.set(pointerId,n);return n}
  function moveTouch(state,pointerId,midi){const next=clamp(Math.round(midi),MIDI_MIN,MIDI_MAX),prev=state.active.get(pointerId);if(prev===next)return{off:null,on:null};state.active.set(pointerId,next);return{off:prev??null,on:next}}
  function noteOff(state,pointerId){const prev=state.active.get(pointerId);state.active.delete(pointerId);return prev??null}
  function mount(host,{audio=global.parent?.MultiSynth?.RackAudioGraph||MS.RackAudioGraph,orientation=innerWidth>innerHeight?"landscape":"portrait"}={}){
    if(!host||!audio)return null;const state=createState(orientation),held=new Map();host.classList.add("ms-performance-keyboard");host.innerHTML='<div class="ms-pk-bezel"><div class="ms-pk-velocity"><div class="ms-pk-velocity-label">VELOCITY</div><div class="ms-pk-velocity-ribbon" role="slider" aria-label="Velocity" aria-valuemin="8" aria-valuemax="127" aria-valuenow="127"><span class="ms-pk-velocity-fill"></span><span class="ms-pk-velocity-thumb"></span></div><output class="ms-pk-velocity-value">127</output></div><div class="ms-pk-viewport"><div class="ms-pk-bed"></div></div></div>';const ribbon=host.querySelector(".ms-pk-velocity-ribbon"),readout=host.querySelector(".ms-pk-velocity-value"),viewport=host.querySelector(".ms-pk-viewport"),bed=host.querySelector(".ms-pk-bed");
    function drawVelocity(){const p=(state.velocity-VELOCITY_MIN)/(VELOCITY_MAX-VELOCITY_MIN);ribbon.style.setProperty("--pk-velocity",String(p));ribbon.setAttribute("aria-valuenow",String(state.velocity));readout.textContent=String(state.velocity)}
    function drawKeys(){bed.innerHTML="";const whiteWidth=42,blackWidth=26;let whiteIndex=0;for(let n=MIDI_MIN;n<=MIDI_MAX;n++){if(!isBlack(n))whiteIndex++}bed.style.width=(whiteIndex*whiteWidth)+"px";whiteIndex=0;for(let n=MIDI_MIN;n<=MIDI_MAX;n++){const black=isBlack(n),key=document.createElement("button");key.type="button";key.className="ms-pk-key "+(black?"ms-pk-black":"ms-pk-white");key.dataset.note=n;key.setAttribute("aria-label",noteName(n));if(black){key.style.left=(whiteIndex*whiteWidth-blackWidth/2)+"px";key.style.width=blackWidth+"px"}else{key.style.left=(whiteIndex*whiteWidth)+"px";key.style.width=whiteWidth+"px";whiteIndex++}bed.appendChild(key)}requestAnimationFrame(()=>{const mid=bed.querySelector('[data-note="60"]');if(mid)viewport.scrollLeft=Math.max(0,mid.offsetLeft-viewport.clientWidth/2)})}
    function keyAt(x,y){const el=document.elementFromPoint(x,y)?.closest?.(".ms-pk-key");return el&&bed.contains(el)?el:null}
    function on(pid,key){if(!key)return;const midi=noteOn(state,pid,Number(key.dataset.note));held.set(pid,{midi,key});key.dataset.active="1";try{audio.resume?.();audio.noteOn(midi,state.velocity)}catch(e){console.error("Performance keyboard noteOn",e)}}
    function move(pid,key){const h=held.get(pid);if(!h||!key)return;const next=Number(key.dataset.note);if(next===h.midi)return;try{audio.noteOff(h.midi)}catch(_){}h.key.dataset.active="0";const result=moveTouch(state,pid,next),midi=result.on;held.set(pid,{midi,key});key.dataset.active="1";try{audio.noteOn(midi,state.velocity)}catch(e){console.error("Performance keyboard noteOn",e)}}
    function off(pid){const h=held.get(pid);if(!h)return;held.delete(pid);noteOff(state,pid);h.key.dataset.active="0";try{audio.noteOff(h.midi)}catch(_){}}
    const down=e=>{const key=e.target.closest?.(".ms-pk-key");if(!key)return;e.preventDefault();try{bed.setPointerCapture(e.pointerId)}catch(_){}on(e.pointerId,key)},moveHandler=e=>{if(!held.has(e.pointerId))return;e.preventDefault();const key=keyAt(e.clientX,e.clientY);if(key)move(e.pointerId,key)},finish=e=>{off(e.pointerId);try{bed.releasePointerCapture(e.pointerId)}catch(_){}};bed.addEventListener("pointerdown",down);bed.addEventListener("pointermove",moveHandler);bed.addEventListener("pointerup",finish);bed.addEventListener("pointercancel",finish);bed.addEventListener("lostpointercapture",finish);
    function setRibbon(e){e.preventDefault();setVelocityFromY(state,e.clientY,ribbon.getBoundingClientRect());drawVelocity()}const ribbonDown=e=>{setRibbon(e);try{ribbon.setPointerCapture(e.pointerId)}catch(_){}},ribbonMove=e=>{if(ribbon.hasPointerCapture?.(e.pointerId))setRibbon(e)};ribbon.addEventListener("pointerdown",ribbonDown);ribbon.addEventListener("pointermove",ribbonMove);drawKeys();drawVelocity();
    function destroy(){for(const pid of [...held.keys()])off(pid);try{audio.panic?.()}catch(_){}bed.removeEventListener("pointerdown",down);bed.removeEventListener("pointermove",moveHandler);bed.removeEventListener("pointerup",finish);bed.removeEventListener("pointercancel",finish);bed.removeEventListener("lostpointercapture",finish);ribbon.removeEventListener("pointerdown",ribbonDown);ribbon.removeEventListener("pointermove",ribbonMove);host.innerHTML="";host.classList.remove("ms-performance-keyboard")}
    return Object.freeze({host,state,setVelocity:v=>{setVelocity(state,v);drawVelocity()},getVelocity:()=>state.velocity,destroy});
  }
  MS.PerformanceKeyboard=Object.freeze({MIDI_MIN,MIDI_MAX,MIDDLE_C,PORTRAIT_VISIBLE,LANDSCAPE_VISIBLE,OCTAVE_CS,VELOCITY_MIN,VELOCITY_MAX,visibleCount,middleAnchorIndex,startForTarget,startForOctave,initialStart,noteName,isBlack,velocityFromY,createState,setOrientation,setVelocity,setVelocityFromY,jumpOctave,panByNotes,visibleNotes,noteOn,moveTouch,noteOff,mount});
})(window);

"use strict";
(()=>{
const host=(window.parent&&window.parent!==window)?window.parent:window;
const instanceId=new URLSearchParams(location.search).get("instance"),seek=document.querySelector("#seekHost .ms-turntable"),platter=seek?.querySelector(".ms-control-face")||seek;
if(!instanceId||!platter)return;
let offset=0,duration=0,playing=false,dragging=false,angle=0,target=0,lastTarget=0,lastMove=0,wasPlaying=false,pointerId=null;
const clamp=v=>Math.max(0,Math.min(duration||Number.MAX_SAFE_INTEGER,Number(v)||0));
const pointerAngle=e=>{const r=platter.getBoundingClientRect();return Math.atan2(e.clientY-(r.top+r.height/2),e.clientX-(r.left+r.width/2))*180/Math.PI};
const deltaAngle=(now,prev)=>{let d=now-prev;if(d>180)d-=360;else if(d<-180)d+=360;return d};
const send=(action,extra={})=>host.dispatchEvent(new CustomEvent("multisynth-live-wire-transport",{detail:{instanceId,action,...extra}}));
const onState=e=>{const d=e?.detail||{};if(String(d.instanceId)!==String(instanceId)||dragging)return;offset=clamp(d.offset);duration=Math.max(0,Number(d.duration)||duration);playing=!!d.playing};
host.addEventListener("multisynth-live-wire-transport-state",onState);
function start(e){if(pointerId!=null||!duration)return;e.preventDefault();e.stopImmediatePropagation();pointerId=e.pointerId;dragging=true;angle=pointerAngle(e);target=lastTarget=offset;wasPlaying=playing;playing=false;lastMove=performance.now();send("scratch-start",{offset:target,playing:false});try{platter.setPointerCapture?.(e.pointerId)}catch(_){} }
function move(e){if(!dragging||e.pointerId!==pointerId)return;e.preventDefault();e.stopImmediatePropagation();const now=performance.now(),a=pointerAngle(e),d=deltaAngle(a,angle);angle=a;lastTarget=target;target=clamp(target+d/180);const dt=Math.max(.008,Math.min(.12,(now-lastMove)/1000||.016));lastMove=now;offset=target;send("scratch",{from:lastTarget,offset:target,dt,playing:false})}
function end(e){if(!dragging||e.pointerId!==pointerId)return;e.preventDefault();e.stopImmediatePropagation();try{platter.releasePointerCapture?.(e.pointerId)}catch(_){}dragging=false;pointerId=null;offset=target;playing=wasPlaying;send("scratch-end",{offset:target,playing:wasPlaying})}
platter.addEventListener("pointerdown",start,true);
platter.addEventListener("pointermove",move,true);
platter.addEventListener("pointerup",end,true);
platter.addEventListener("pointercancel",end,true);
platter.addEventListener("lostpointercapture",end,true);
window.addEventListener("pagehide",()=>host.removeEventListener("multisynth-live-wire-transport-state",onState));
})();
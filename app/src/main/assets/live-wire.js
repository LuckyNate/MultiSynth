"use strict";
(()=>{
const host=(window.parent&&window.parent!==window)?window.parent:window;
const MS=window.MultiSynth||{},N=host.MultiSynth?.LiveWireNative||MS.LiveWireNative,L=MS.PCMLibrary,R=MS.ControlSurfaceRenderer;
if(!R)return;
const $=id=>document.getElementById(id);
const status=$("status"),lamp=$("lamp"),message=$("crtMessage"),player=$("player"),searchForm=$("searchForm"),search=$("search"),recordHost=$("recordHost"),searchHost=$("searchHost"),seekHost=$("seekHost"),transportHost=$("transportHost"),seekReadout=$("seekReadout"),playing=$("playingLabel"),queuedLabel=$("queueLabel"),backup1=$("backup1"),backup2=$("backup2"),backup3=$("backup3");
let currentItem=null,queue=[],seekDragging=false,seekAngle=0,seekTarget=0,seekWasPlaying=false,seekRaf=0;
let captureReady=false,captureRequest=false,recording=false,chunks=[],frames=0,sampleRate=48000;
const mount=(parent,desc,visual={})=>R.mount(parent,{...desc,meta:{...(desc.meta||{}),visual:{...(desc.meta?.visual||{}),...visual}}});
const button=(parent,id,label,fn)=>{const node=mount(parent,{id,control:"button",label},{variant:"rect"});node.onclick=fn;return node};
button(searchHost,"search-go","GO",()=>searchForm?.requestSubmit?.());
const pause=button(transportHost,"pause","PAUSE",pauseResume),stop=button(transportHost,"stop","STOP",stopPlayer),record=button(recordHost,"record","HOLD TO RECORD",()=>{});record.onclick=null;
const seek=mount(seekHost,{id:"seek",control:"turntable",label:"PRECISION SEEK · 30 RPM",value:{default:0,min:0,max:1,step:.001}},{variant:"platter",valueReadout:false}),platter=seek.querySelector(".ms-control-face")||seek;
function setStatus(text){text=String(text||"");status.textContent=text;lamp.classList.toggle("live",/PLAYING|RECORDING|CAPTURE/.test(text))}
function fmt(sec){sec=Math.max(0,Math.floor(Number(sec)||0));return Math.floor(sec/60)+":"+String(sec%60).padStart(2,"0")}
function duration(){return Number.isFinite(player.duration)?player.duration:Number(currentItem?.duration)||0}
function current(){return Number(player.currentTime)||0}
function clampTime(sec){const d=duration();return Math.max(0,Math.min(d>0?d:Number.MAX_SAFE_INTEGER,Number(sec)||0))}
function paintQueue(){const q=queue.slice(0,4);if(queuedLabel)queuedLabel.textContent=q[0]?.title||"—";if(backup1)backup1.textContent=q[1]?.title||"—";if(backup2)backup2.textContent=q[2]?.title||"—";if(backup3)backup3.textContent=q[3]?.title||"—"}
function paint(){const t=seekDragging?seekTarget:current();const d=duration();if(platter)platter.style.transform=`rotate(${t*180}deg)`;if(seekReadout)seekReadout.textContent=`${fmt(t)} / ${fmt(d)}`;if(playing)playing.textContent=currentItem?`${currentItem.provider} · ${currentItem.title}`:"—";if(message){message.innerHTML=currentItem?`${currentItem.provider}<br><small>${String(currentItem.title||"").replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]))}</small>`:"LIVE WIRE<br><small>FREESOUND + JAMENDO</small>"}const label=pause.querySelector(".ms-control-label");if(label)label.textContent=player.paused?"PLAY":"PAUSE";paintQueue()}
function validItem(x){return x&&typeof x.url==="string"&&/^https:\/\//.test(x.url)&&x.id}
function setQueue(items){const seen=new Set(currentItem?[currentItem.id]:[]);queue=[];for(const x of items||[]){if(!validItem(x)||seen.has(x.id))continue;seen.add(x.id);queue.push(x);if(queue.length>=4)break}paint()}
async function refillQueue(seed=""){if(queue.length>=4)return;try{const items=await N.search(seed,{random:!seed,max:12}),seen=new Set([currentItem?.id,...queue.map(x=>x.id)]);for(const x of items||[]){if(!validItem(x)||seen.has(x.id))continue;seen.add(x.id);queue.push(x);if(queue.length>=4)break}paint()}catch(_){} }
function loadItem(item){if(!validItem(item)){setStatus("SOURCE HAS NO PLAYABLE AUDIO");return}currentItem=item;player.pause();player.src=item.url;player.load();paint();const p=player.play();if(p?.catch)p.catch(()=>{setStatus("PRESS PLAY");paint()});setStatus(`LOADING · ${item.provider}`)}
async function nextItem(){let item=queue.shift();if(!item){await refillQueue("");item=queue.shift()}if(!item){setStatus("NO SOURCE AVAILABLE");return}loadItem(item);refillQueue("")}
async function chooseSource(query){const q=String(query||"").trim();setStatus(q?`SEARCHING · ${q.toUpperCase()}`:"TUNING RANDOM SOURCE…");try{const items=await N.search(q,{random:!q,max:12}),first=items?.find(validItem);if(!first){setStatus("NO PLAYABLE RESULTS");return}loadItem(first);setQueue(items.filter(x=>x!==first));if(queue.length<4)refillQueue(q)}catch(e){setStatus(String(e?.message||"SEARCH FAILED").toUpperCase())}}
player.addEventListener("loadedmetadata",()=>{paint()});
player.addEventListener("durationchange",paint);
player.addEventListener("play",()=>{setStatus(`PLAYING · ${currentItem?.provider||"SOURCE"}`);paint()});
player.addEventListener("pause",paint);
player.addEventListener("timeupdate",()=>{if(!seekDragging)paint()});
player.addEventListener("ended",nextItem);
player.addEventListener("error",()=>{setStatus("SOURCE PLAYBACK FAILED");setTimeout(nextItem,0)});
searchForm?.addEventListener("submit",e=>{e.preventDefault();const q=String(search?.value||"").trim();search?.blur?.();try{host.MultiSynthDismissKeyboard?.()}catch(_){}chooseSource(q)});
function pauseResume(){if(!currentItem)return;if(player.paused){player.play().catch(()=>setStatus("PLAYBACK FAILED"))}else player.pause();paint()}
function stopPlayer(){player.pause();try{player.currentTime=0}catch(_){}seekDragging=false;paint();setStatus("STOPPED")}
function pointerAngle(e){const r=platter.getBoundingClientRect();return Math.atan2(e.clientY-(r.top+r.height/2),e.clientX-(r.left+r.width/2))*180/Math.PI}
function deltaAngle(now,prev){let d=now-prev;if(d>180)d-=360;else if(d<-180)d+=360;return d}
function applySeek(){seekRaf=0;if(!seekDragging)return;try{player.currentTime=clampTime(seekTarget)}catch(_){}paint()}
seek.oncontextmenu=e=>e.preventDefault();
seek.onpointerdown=e=>{if(!currentItem||!duration())return;e.preventDefault();seekDragging=true;seekAngle=pointerAngle(e);seekTarget=current();seekWasPlaying=!player.paused;player.pause();seek.setPointerCapture?.(e.pointerId);paint()};
seek.onpointermove=e=>{if(!seekDragging)return;e.preventDefault();const a=pointerAngle(e),d=deltaAngle(a,seekAngle);seekAngle=a;seekTarget=clampTime(seekTarget+d/180);if(!seekRaf)seekRaf=requestAnimationFrame(applySeek);paint()};
function finishSeek(e){if(!seekDragging)return;seekDragging=false;if(seekRaf){cancelAnimationFrame(seekRaf);seekRaf=0}try{seek.releasePointerCapture?.(e.pointerId)}catch(_){}try{player.currentTime=clampTime(seekTarget)}catch(_){}if(seekWasPlaying)player.play().catch(()=>setStatus("PLAYBACK FAILED"));paint()}
seek.onpointerup=finishSeek;seek.onpointercancel=finishSeek;seek.onlostpointercapture=finishSeek;
function requestCapture(){if(captureReady)return true;if(captureRequest)return false;if(!N?.available?.()){setStatus("ANDROID PLAYBACK CAPTURE UNAVAILABLE");return false}captureRequest=true;const started=N.start();if(!started){captureRequest=false;setStatus("CAPTURE PERMISSION REQUIRED");return false}setStatus("ALLOW RECORDING · THEN HOLD AGAIN");return false}
N?.onChunk?.((pcm,sr)=>{captureReady=true;captureRequest=false;sampleRate=sr||sampleRate;if(recording){chunks.push(pcm.slice());frames+=pcm.length}});
window.addEventListener("multisynth-live-wire-status",e=>{const t=String(e.detail||"");if(/CAPTURE LIVE/.test(t)){captureReady=true;captureRequest=false;setStatus("RECORD READY");return}if(/FAILED|STOPPED|CAPTURE OFF/.test(t)){captureReady=false;captureRequest=false}setStatus(t)});
function recordStart(e){e.preventDefault();if(recording)return;if(!captureReady){requestCapture();return}recording=true;chunks=[];frames=0;record.dataset.active="1";const label=record.querySelector(".ms-control-label");if(label)label.textContent="RECORDING — RELEASE";record.setPointerCapture?.(e.pointerId);setStatus("RECORDING SAMPLE")}
async function recordStop(e){e?.preventDefault?.();if(!recording)return;recording=false;record.dataset.active="0";const label=record.querySelector(".ms-control-label");if(label)label.textContent="HOLD TO RECORD";if(!frames){setStatus("NO AUDIO CAPTURED");return}const pcm=new Float32Array(frames);let at=0;for(const c of chunks){pcm.set(c,at);at+=c.length}chunks=[];frames=0;try{const rec=await L.saveCapture({pcm,sampleRate},{name:(currentItem?.title||"LIVE WIRE").slice(0,64),source:"live-wire",tags:[String(currentItem?.provider||"audio").toLowerCase(),"live-wire"]});setStatus("SAVED SAMPLE · "+rec.duration.toFixed(2)+" SEC")}catch(_){setStatus("SAMPLE SAVE FAILED")}}
record.onpointerdown=recordStart;record.onpointerup=recordStop;record.onpointercancel=recordStop;record.onlostpointercapture=recordStop;
paint();chooseSource("");
window.addEventListener("pagehide",()=>{player.pause();player.removeAttribute("src");player.load();try{N?.stop?.()}catch(_){}});
})();

"use strict";
(()=>{
const host=(window.parent&&window.parent!==window)?window.parent:window;
const MS=window.MultiSynth||{};
const N=host.MultiSynth?.LiveWireNative||MS.LiveWireNative;
const L=MS.PCMLibrary;
const R=MS.ControlSurfaceRenderer;
if(!R)return;

const $=id=>document.getElementById(id);
const status=$("status"),lamp=$("lamp"),message=$("crtMessage"),searchForm=$("searchForm"),search=$("search"),recordHost=$("recordHost"),searchHost=$("searchHost"),seekHost=$("seekHost"),transportHost=$("transportHost"),seekReadout=$("seekReadout"),playing=$("playingLabel"),queuedLabel=$("queueLabel"),backup1=$("backup1"),backup2=$("backup2"),backup3=$("backup3");

let player=null,playerReady=false,currentId="",currentTitle="",current=0,duration=0,paused=false,queue=[];
let seekDragging=false,seekAngle=0,seekTarget=0,seekWasPlaying=false;
let captureReady=false,captureRequest=false,recording=false,chunks=[],frames=0,sampleRate=48000;

const mount=(parent,desc,visual={})=>R.mount(parent,{...desc,meta:{...(desc.meta||{}),visual:{...(desc.meta?.visual||{}),...visual}}});
const button=(parent,id,label,fn)=>{const node=mount(parent,{id,control:"button",label},{variant:"rect"});node.onclick=fn;return node};
const go=button(searchHost,"search-go","GO",()=>searchForm?.requestSubmit?.());
const pause=button(transportHost,"pause","PAUSE",pauseResume);
const stop=button(transportHost,"stop","STOP",stopPlayer);
const record=button(recordHost,"record","HOLD TO RECORD",()=>{});record.onclick=null;
const seek=mount(seekHost,{id:"seek",control:"turntable",label:"PRECISION SEEK · 30 RPM",value:{default:0,min:0,max:1,step:.001}},{variant:"platter",valueReadout:false});
const platter=seek.querySelector(".ms-control-face")||seek;

function setStatus(text){text=String(text||"");status.textContent=text;lamp.classList.toggle("live",/PLAYING|RECORDING|CAPTURE/.test(text))}
function fmt(sec){sec=Math.max(0,Math.floor(Number(sec)||0));return Math.floor(sec/60)+":"+String(sec%60).padStart(2,"0")}
function clampTime(sec){const max=duration>0?duration:Number.MAX_SAFE_INTEGER;return Math.max(0,Math.min(max,Number(sec)||0))}
function paintQueue(){const q=queue.slice(0,4);if(queuedLabel)queuedLabel.textContent=q[0]?.title||"—";if(backup1)backup1.textContent=q[1]?.title||"—";if(backup2)backup2.textContent=q[2]?.title||"—";if(backup3)backup3.textContent=q[3]?.title||"—"}
function paint(){message?.classList.toggle("hidden",!!currentId);if(playing)playing.textContent=currentTitle||currentId||"—";const t=seekDragging?seekTarget:current;if(platter)platter.style.transform=`rotate(${t*180}deg)`;if(seekReadout)seekReadout.textContent=`${fmt(t)} / ${fmt(duration)}`;const label=pause.querySelector(".ms-control-label");if(label)label.textContent=paused?"RESUME":"PAUSE";paintQueue()}

function extractVideoId(text){text=String(text||"").trim();if(/^[A-Za-z0-9_-]{11}$/.test(text))return text;try{const u=new URL(text);if(u.hostname==="youtu.be")return u.pathname.split("/").filter(Boolean)[0]||null;if(/(^|\.)youtube\.com$/.test(u.hostname)||/(^|\.)youtube-nocookie\.com$/.test(u.hostname)){const v=u.searchParams.get("v");if(v)return v;const p=u.pathname.split("/").filter(Boolean);const i=p.findIndex(x=>x==="embed"||x==="shorts"||x==="live");if(i>=0&&p[i+1])return p[i+1]}}catch(_){}return null}
function loadVideo(id,title){currentId=String(id||"");currentTitle=String(title||currentId);current=0;duration=0;paused=false;paint();if(!playerReady||!player||!currentId)return;try{player.loadVideoById(currentId);player.unMute();player.playVideo()}catch(_){setStatus("PLAYBACK FAILED")}}
async function refillQueue(seed=""){if(queue.length>=4||!N?.search)return;try{const items=await N.search(seed,{random:!seed,max:12});const seen=new Set([currentId,...queue.map(x=>x.id)]);for(const x of items||[]){const id=String(x?.id||"");if(!/^[A-Za-z0-9_-]{11}$/.test(id)||seen.has(id))continue;seen.add(id);queue.push({id,title:String(x.title||id)});if(queue.length>=4)break}paint()}catch(_){}}
function setQueue(items){queue=[];const seen=new Set([currentId]);for(const x of items||[]){const id=String(x?.id||"");if(!/^[A-Za-z0-9_-]{11}$/.test(id)||seen.has(id))continue;seen.add(id);queue.push({id,title:String(x.title||id)});if(queue.length>=4)break}paint()}
async function nextVideo(){let next=queue.shift();if(!next){await refillQueue("");next=queue.shift()}if(!next){setStatus("NO SOURCE AVAILABLE");return}loadVideo(next.id,next.title);refillQueue("")}
async function chooseVideo(query){const q=String(query||"").trim();const direct=extractVideoId(q);if(direct){loadVideo(direct,"YOUTUBE · "+direct);setQueue([]);refillQueue("");return}setStatus(q?"SEARCHING · "+q.toUpperCase():"TUNING RANDOM SOURCE…");try{const items=await N.search(q,{random:!q,max:12});const first=items?.[0];if(!first){setStatus("NO PLAYABLE RESULTS");return}loadVideo(first.id,first.title);setQueue(items.slice(1));if(queue.length<4)refillQueue(q)}catch(e){setStatus(String(e?.message||"SEARCH FAILED").toUpperCase())}}

window.onYouTubeIframeAPIReady=()=>{
 player=new YT.Player("player",{width:"100%",height:"100%",playerVars:{playsinline:1,controls:0,rel:0,fs:0,autoplay:1,enablejsapi:1},events:{
  onReady(){playerReady=true;if(currentId)loadVideo(currentId,currentTitle)},
  onStateChange(e){paused=e.data===YT.PlayerState.PAUSED;if(e.data===YT.PlayerState.PLAYING)setStatus("PLAYING · "+(currentTitle||"YOUTUBE"));if(e.data===YT.PlayerState.ENDED)nextVideo();paint()},
  onError(){setStatus("VIDEO PLAYBACK FAILED")}
 }});
};

setInterval(()=>{if(!playerReady||!player||seekDragging)return;try{current=Number(player.getCurrentTime())||0;duration=Number(player.getDuration())||0;paint()}catch(_){}},200);

searchForm?.addEventListener("submit",e=>{e.preventDefault();const q=String(search?.value||"").trim();search?.blur?.();try{host.MultiSynthDismissKeyboard?.()}catch(_){}chooseVideo(q)});
function pauseResume(){if(!playerReady||!player)return;try{if(paused){player.playVideo();paused=false}else{player.pauseVideo();paused=true}paint()}catch(_){} }
function stopPlayer(){try{player?.stopVideo?.()}catch(_){}current=0;paused=false;seekDragging=false;paint();setStatus("STOPPED")}

function pointerAngle(e){const r=platter.getBoundingClientRect();return Math.atan2(e.clientY-(r.top+r.height/2),e.clientX-(r.left+r.width/2))*180/Math.PI}
function deltaAngle(now,prev){let d=now-prev;if(d>180)d-=360;else if(d<-180)d+=360;return d}
seek.oncontextmenu=e=>e.preventDefault();
seek.onpointerdown=e=>{if(!playerReady||!player)return;e.preventDefault();seekDragging=true;seekAngle=pointerAngle(e);seekTarget=current;seekWasPlaying=!paused;seek.setPointerCapture?.(e.pointerId);try{player.pauseVideo()}catch(_){}paint()};
seek.onpointermove=e=>{if(!seekDragging)return;e.preventDefault();const a=pointerAngle(e);const d=deltaAngle(a,seekAngle);seekAngle=a;seekTarget=clampTime(seekTarget+d/180);paint()};
function finishSeek(e){if(!seekDragging)return;seekDragging=false;try{seek.releasePointerCapture?.(e.pointerId)}catch(_){}current=clampTime(seekTarget);try{player?.seekTo?.(current,true);if(seekWasPlaying)player?.playVideo?.()}catch(_){}paused=!seekWasPlaying;paint();setStatus(seekWasPlaying?"PLAYING · "+(currentTitle||"YOUTUBE"):"PAUSED")}
seek.onpointerup=finishSeek;seek.onpointercancel=finishSeek;seek.onlostpointercapture=finishSeek;

function requestCapture(){if(captureReady)return true;if(captureRequest)return false;if(!N?.available?.()){setStatus("ANDROID PLAYBACK CAPTURE UNAVAILABLE");return false}captureRequest=true;const started=N.start();if(!started){captureRequest=false;setStatus("CAPTURE PERMISSION REQUIRED");return false}setStatus("ALLOW RECORDING · THEN HOLD AGAIN");return false}
N?.onChunk?.((pcm,sr)=>{captureReady=true;captureRequest=false;sampleRate=sr||sampleRate;if(recording){chunks.push(pcm.slice());frames+=pcm.length}});
window.addEventListener("multisynth-live-wire-status",e=>{const t=String(e.detail||"");if(/CAPTURE LIVE/.test(t)){captureReady=true;captureRequest=false;setStatus("RECORD READY");return}if(/FAILED|STOPPED|CAPTURE OFF/.test(t)){captureReady=false;captureRequest=false}setStatus(t)});
function recordStart(e){e.preventDefault();if(recording)return;if(!captureReady){requestCapture();return}recording=true;chunks=[];frames=0;record.dataset.active="1";const label=record.querySelector(".ms-control-label");if(label)label.textContent="RECORDING — RELEASE";record.setPointerCapture?.(e.pointerId);setStatus("RECORDING SAMPLE")}
async function recordStop(e){e?.preventDefault?.();if(!recording)return;recording=false;record.dataset.active="0";const label=record.querySelector(".ms-control-label");if(label)label.textContent="HOLD TO RECORD";if(!frames){setStatus("NO AUDIO CAPTURED");return}const pcm=new Float32Array(frames);let at=0;for(const c of chunks){pcm.set(c,at);at+=c.length}chunks=[];frames=0;try{const rec=await L.saveCapture({pcm,sampleRate},{name:(currentTitle||"LIVE WIRE").slice(0,64),source:"live-wire",tags:["youtube","live-wire"]});setStatus("SAVED SAMPLE · "+rec.duration.toFixed(2)+" SEC")}catch(_){setStatus("SAMPLE SAVE FAILED")}}
record.onpointerdown=recordStart;record.onpointerup=recordStop;record.onpointercancel=recordStop;record.onlostpointercapture=recordStop;

paint();chooseVideo("");
window.addEventListener("pagehide",()=>{try{player?.stopVideo?.();N?.stopPlayer?.();N?.stop?.()}catch(_){}});
})();
"use strict";
(()=>{
const q=new URLSearchParams(location.search),instance=q.get("instance"),P=parent.MultiSynth||{},E=P.NodeGraphEngine,R=window.MultiSynth?.ControlSurfaceRenderer;
if(!instance||!E||!R)return;
const root=document.getElementById("channels"),status=document.getElementById("status");
const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
function channelCount(){const g=E.graph(),used=(g.connections||[]).map(c=>E.parseNode(c.to)).filter(p=>p?.id===instance&&p.index!=null);return used.length+1}
function state(){return E.getModule(instance)?.state||{channels:{}}}
function channel(i){const channels=state().channels||{};return{level:1,mute:false,solo:false,...(channels[i]||channels[String(i)]||{})}}
function patch(i,p){const channels={...(state().channels||{})},current=channel(i);channels[i]={...current,...p};E.setModuleState(instance,{channels})}
function mount(host,d,v={}){return R.mount(host,{...d,meta:{...(d.meta||{}),visual:{...(d.meta?.visual||{}),...v}}})}
function render(){root.innerHTML="";const count=channelCount();status.textContent=`${count-1} CONNECTED · ${count} INPUTS AVAILABLE`;for(let i=0;i<count;i++){
 const c=channel(i),row=document.createElement("section");row.className="channel";row.innerHTML=`<div class="channelHead"><strong>INPUT ${i+1}</strong><small>${i===count-1?"SPARE":"CONNECTED"}</small></div><div class="levelHost"></div><div class="muteHost"></div><div class="soloHost"></div>`;root.appendChild(row);
 const level=mount(row.querySelector(".levelHost"),{id:`level-${i}`,control:"fader",label:"LEVEL",value:{default:c.level,min:0,max:1,step:.01}},{variant:"vertical",valueReadout:true}),mute=mount(row.querySelector(".muteHost"),{id:`mute-${i}`,control:"switch",label:"MUTE",value:{default:c.mute}},{variant:"rocker"}),solo=mount(row.querySelector(".soloHost"),{id:`solo-${i}`,control:"switch",label:"SOLO",value:{default:c.solo}},{variant:"rocker"});
 let levelValue=clamp(c.level),drag=false,startY=0,startValue=levelValue;const thumb=level.querySelector(".ms-fader-thumb,.ms-control-pointer"),out=level.querySelector(".ms-control-value");function paintLevel(){const pct=levelValue*100;if(thumb)thumb.style.bottom=`${pct}%`;if(out)out.textContent=Math.round(pct)+"%"}paintLevel();
 level.onpointerdown=e=>{drag=true;startY=e.clientY;startValue=levelValue;level.setPointerCapture?.(e.pointerId);e.preventDefault()};level.onpointermove=e=>{if(!drag)return;const next=clamp(startValue+(startY-e.clientY)/150);if(Math.abs(next-levelValue)>.0001){levelValue=next;paintLevel();patch(i,{level:levelValue})}};level.onpointerup=level.onpointercancel=e=>{drag=false;try{level.releasePointerCapture?.(e.pointerId)}catch(_){}};
 function paintSwitch(node,on){node.dataset.on=on?"1":"0";node.dataset.active=on?"1":"0"}let muted=!!c.mute,soloed=!!c.solo;paintSwitch(mute,muted);paintSwitch(solo,soloed);mute.onclick=()=>{muted=!muted;patch(i,{mute:muted});paintSwitch(mute,muted)};solo.onclick=()=>{soloed=!soloed;patch(i,{solo:soloed});paintSwitch(solo,soloed)};
 }}
render();E.on?.("graph-changed",render);window.addEventListener("multisynth-state-sync",render);
})();
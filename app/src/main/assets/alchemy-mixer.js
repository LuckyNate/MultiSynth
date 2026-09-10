"use strict";
(()=>{
const q=new URLSearchParams(location.search),instance=q.get("instance"),P=parent.MultiSynth||{},E=P.NodeGraphEngine,MC=P.ModuleContract,MS=window.MultiSynth||{},R=MS.ControlSurfaceRenderer,C=MS.ControlSurface?.CONTROL;
if(!instance||!E||!MC||!R||!C)return;
const root=document.getElementById("channels"),status=document.getElementById("status"),meters=[];
const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
function channelCount(){const g=E.graph(),used=(g.connections||[]).map(c=>E.parseNode(c.to)).filter(p=>p?.id===instance&&p.index!=null);return used.length+1}
function state(){return E.getModule(instance)?.state||{channels:{}}}
function channel(i){const channels=state().channels||{};return{level:1,mute:false,solo:false,...(channels[i]||channels[String(i)]||{})}}
function patch(i,p){const channels={...(state().channels||{})},current=channel(i);channels[i]={...current,...p};E.setModuleState(instance,{channels})}
function mount(host,d,v={}){return R.mount(host,{...d,meta:{...(d.meta||{}),visual:{...(d.meta?.visual||{}),...v}}})}
function render(){root.innerHTML="";meters.length=0;const count=channelCount();status.textContent=`${count-1} CONNECTED · ${count} INPUTS AVAILABLE`;for(let i=0;i<count;i++){
 const c=channel(i),row=document.createElement("section");row.className="channel";row.innerHTML=`<div class="channelHead"><strong>INPUT ${i+1}</strong><small>${i===count-1?"SPARE":"CONNECTED"}</small></div><div class="levelHost"></div><div class="meterHost"></div><div class="muteHost"></div><div class="soloHost"></div>`;root.appendChild(row);
 const level=mount(row.querySelector(".levelHost"),{id:`level-${i}`,control:C.FADER,label:"LEVEL",value:{default:c.level,min:0,max:1,step:.01}},{variant:"vertical",valueReadout:true}),meter=mount(row.querySelector(".meterHost"),{id:`meter-${i}`,control:C.METER,label:"LEVEL",value:{default:0,min:0,max:1}},{variant:"bar"}),mute=mount(row.querySelector(".muteHost"),{id:`mute-${i}`,control:C.BUTTON,label:"MUTE"},{variant:"rect"}),solo=mount(row.querySelector(".soloHost"),{id:`solo-${i}`,control:C.BUTTON,label:"SOLO"},{variant:"rect"});
 const levelState={value:clamp(c.level)},muteState={on:!!c.mute},soloState={on:!!c.solo};R.bindFader(level,levelState);R.bindButton(mute,muteState);R.bindButton(solo,soloState);level.addEventListener("multisynth-control-value-change",e=>patch(i,{level:clamp(e.detail?.value)}));mute.addEventListener("multisynth-control-button-change",e=>patch(i,{mute:!!e.detail?.on}));solo.addEventListener("multisynth-control-button-change",e=>patch(i,{solo:!!e.detail?.on}));meters.push({index:i,node:meter});
 }}
function paintMeters(){let rt=null;try{rt=MC.getRuntime(instance)}catch(_){}for(const m of meters)R.setValue(m.node,rt?.user?.meterLevel?.(m.index)??0);requestAnimationFrame(paintMeters)}
render();requestAnimationFrame(paintMeters);E.on?.("graph-changed",render);window.addEventListener("multisynth-state-sync",render);
})();
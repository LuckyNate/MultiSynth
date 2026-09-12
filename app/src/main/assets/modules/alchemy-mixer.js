"use strict";
(function(global){
const MS=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds;if(!C||!I)return;
const defaults={channels:{}};
const channelState=(state,index)=>state?.channels?.[index]||state?.channels?.[String(index)]||{level:1,mute:false,solo:false};
function apply(u,state){const solo=Object.values(state?.channels||{}).some(c=>c?.solo);for(const[index,gain]of u.inputs){const c=channelState(state,index),level=Math.max(0,Math.min(1,Number(c.level??1))),muted=!!c.mute||(solo&&!c.solo);gain.gain.value=muted?0:level}}
function create(api){const ctx=api.context,output=ctx.createGain(),inputs=new Map(),meters=new Map(),meterData=new Map();const u={inputs,meters,output,input(index){index=Math.max(0,index|0);let g=inputs.get(index);if(!g){g=ctx.createGain();const analyser=ctx.createAnalyser();analyser.fftSize=256;analyser.smoothingTimeConstant=.72;g.connect(output);g.connect(analyser);inputs.set(index,g);meters.set(index,analyser);meterData.set(index,new Float32Array(analyser.fftSize));apply(u,api.state)}return g},meterLevel(index){index=Math.max(0,index|0);const analyser=meters.get(index),data=meterData.get(index);if(!analyser||!data)return 0;analyser.getFloatTimeDomainData(data);let sum=0;for(let i=0;i<data.length;i++)sum+=data[i]*data[i];return Math.min(1,Math.sqrt(sum/data.length)*2.5)},sync(state){apply(u,state)}};api.setInput(u.input(0));api.setOutput(output);return u}
C.define({type:I.ALCHEMY_MIXER,version:"module-1",description:"DYNAMIC OUTPUT MIXER",dynamicPorts:{carrierIn:"used-plus-one"},defaults,create,setState({runtime,state}){runtime.user?.sync(state)},destroy({runtime}){for(const g of runtime.user?.inputs?.values?.()||[])try{g.disconnect()}catch(_){}for(const a of runtime.user?.meters?.values?.()||[])try{a.disconnect()}catch(_){}try{runtime.user?.output?.disconnect()}catch(_){}},serialize:({state})=>({channels:{...(state.channels||{})}}),restore:({saved})=>({channels:{...(saved?.channels||{})}})});
C.defineSurface(I.ALCHEMY_MIXER,{family:"SIGNAL PROCESSORS",version:1,package:{id:I.ALCHEMY_MIXER,version:1,behavior:{role:"dynamic-output-mixer",inputs:"used-plus-one",channelControls:"level-mute-solo",stateOwnership:"module"}},faceplate:{livery:"wood-console",primary:"#4b2d17",secondary:"#9a6734",tertiary:"#d6aa68"},defaults,controls:[],sources:[{id:"source.inputs",type:"audioInput",mode:"dynamic-used-plus-one"}],actions:[{id:"action.mix",type:"level-mute-solo"}],nodes:{connections:[["source.inputs","action.mix"]]}});
})(window);

(function(global){
if(global.parent===global)return;
const q=new URLSearchParams(global.location.search),instance=q.get("instance"),P=global.parent.MultiSynth||{},E=P.NodeGraphEngine,MC=P.ModuleContract,MS=global.MultiSynth||{},R=MS.ControlSurfaceRenderer,C=MS.ControlSurface?.CONTROL;
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
 const level=mount(row.querySelector(".levelHost"),{id:`level-${i}`,control:C.FADER,label:"LEVEL",value:{default:c.level,min:0,max:1,step:.01}},{variant:"vertical",width:46,height:160,valueReadout:true}),meter=mount(row.querySelector(".meterHost"),{id:`meter-${i}`,control:C.METER,label:"LEVEL",value:{default:0,min:0,max:1}},{variant:"vertical",width:46,height:160}),mute=mount(row.querySelector(".muteHost"),{id:`mute-${i}`,control:C.BUTTON,label:"M"},{variant:"rect",width:52,height:38,touchWidth:58,touchHeight:44}),solo=mount(row.querySelector(".soloHost"),{id:`solo-${i}`,control:C.BUTTON,label:"S"},{variant:"rect",width:52,height:38,touchWidth:58,touchHeight:44});
 const levelState={value:clamp(c.level)},muteState={on:!!c.mute},soloState={on:!!c.solo};R.bindFader(level,levelState);R.bindButton(mute,muteState);R.bindButton(solo,soloState);level.addEventListener("multisynth-control-value-change",e=>patch(i,{level:clamp(e.detail?.value)}));mute.addEventListener("multisynth-control-button-change",e=>patch(i,{mute:!!e.detail?.on}));solo.addEventListener("multisynth-control-button-change",e=>patch(i,{solo:!!e.detail?.on}));meters.push({index:i,node:meter});
 }}
function paintMeters(){let rt=null;try{rt=MC.getRuntime(instance)}catch(_){}for(const m of meters)R.setValue(m.node,rt?.user?.meterLevel?.(m.index)??0);requestAnimationFrame(paintMeters)}
render();requestAnimationFrame(paintMeters);E.on?.("graph-changed",render);global.addEventListener("multisynth-state-sync",render);
})(window);

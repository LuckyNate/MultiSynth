"use strict";
(function(global){
const MS=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds;if(!C||!I)return;
const defaults={levels:{}};
const clamp=v=>{const n=Number(v);return Number.isFinite(n)?Math.max(0,Math.min(1,n)):1};
const levelFor=(state,index)=>clamp(state?.levels?.[index]??state?.levels?.[String(index)]??1);
function apply(u,state){for(const[index,gain]of u.outputs)gain.gain.value=levelFor(state,index)}
function create(api){const input=api.context.createGain(),outputs=new Map();const u={input,outputs,output(index){index=Math.max(0,index|0);let g=outputs.get(index);if(!g){g=api.context.createGain();input.connect(g);outputs.set(index,g);apply(u,api.state)}return g},sync(state){apply(u,state)}};api.setInput(input);api.setOutput(u.output(0));return u}
function destroy({runtime}){const u=runtime.user;if(!u)return;try{u.input?.disconnect()}catch(_){}for(const g of u.outputs?.values?.()||[])try{g.disconnect()}catch(_){}}
C.define({type:I.PLUS_ONE_SPLITTER,version:"carrier-level-1",description:"USED +1 CARRIER SPLITTER · LEVEL PER OUTPUT",dynamicPorts:{carrierOut:"used-plus-one"},defaults,create,setState({runtime,state}){runtime.user?.sync(state)},destroy,serialize:({state})=>({levels:{...(state.levels||{})}}),restore:({saved})=>({levels:{...(saved?.levels||{})}})});
C.defineSurface(I.PLUS_ONE_SPLITTER,{family:"ROUTING",version:4,package:{id:I.PLUS_ONE_SPLITTER,version:4,behavior:{role:"used-plus-one-carrier-splitter",signals:["carrier"],outputs:"used-plus-one",outputControls:"level",stateOwnership:"module"}},faceplate:{livery:"routing",primary:"#102733",secondary:"#6ec7ff",tertiary:"#dff6ff"},defaults,controls:[],sources:[{id:"source.carrier",type:"audioInput"}],actions:[{id:"action.split",type:"carrierSplitWithOutputLevel"}],nodes:{connections:[["source.carrier","action.split"]]}});
})(window);

(function(global){
if(global.parent===global)return;const q=new URLSearchParams(global.location.search),instance=q.get("instance"),P=global.parent.MultiSynth||{},E=P.NodeGraphEngine,MS=global.MultiSynth||{},R=MS.ControlSurfaceRenderer,C=MS.ControlSurface?.CONTROL,out=document.getElementById("ratio"),detail=document.getElementById("detail"),levels=document.getElementById("levels");if(!instance||!E||!out||!levels||!R||!C)return;
const clamp=v=>{const n=Number(v);return Number.isFinite(n)?Math.max(0,Math.min(1,n)):0};
function state(){return E.getModule(instance)?.state||{levels:{}}}
function usedOutputs(){return(E.graph().connections||[]).map(c=>E.parseNode(c.from)).filter(p=>p?.id===instance&&p.signal==="carrier"&&p.index!=null).sort((a,b)=>a.index-b.index)}
function level(i){return clamp(state().levels?.[i]??state().levels?.[String(i)]??1)}
function patch(i,value){const next={...(state().levels||{})};next[i]=clamp(value);E.setModuleState(instance,{levels:next})}
function render(){const used=usedOutputs(),count=used.length;out.textContent=`1/${Math.max(1,count)}`;detail.textContent=`${count} OUTPUT${count===1?"":"S"} CONNECTED · +1 READY · CARRIER`;levels.innerHTML="";for(let i=0;i<=count;i++){const row=document.createElement("div");row.className="plusOneLevel";row.innerHTML=`<strong>OUT ${i+1}</strong><div class="levelHost"></div><small>${i<count?"CONNECTED":"SPARE"}</small>`;levels.appendChild(row);const node=R.mount(row.querySelector(".levelHost"),{id:`level-${i}`,control:C.FADER,label:"LEVEL",value:{default:level(i),min:0,max:1,step:.01}},{variant:"vertical",width:46,height:140,valueReadout:true}),s={value:level(i)};R.bindFader(node,s);node.addEventListener("multisynth-control-value-change",e=>patch(i,e.detail?.value))}}
render();E.on?.("graph-changed",render);global.addEventListener("multisynth-state-sync",render);
})(window);

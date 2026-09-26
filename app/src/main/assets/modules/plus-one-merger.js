"use strict";
(function(global){
const MS=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds;if(!C||!I)return;
const defaults={levels:{}};
const clamp=v=>Math.max(0,Math.min(1,Number(v)??1));
const levelFor=(state,index)=>clamp(state?.levels?.[index]??state?.levels?.[String(index)]??1);
function apply(u,state){for(const[index,gain]of u.inputs)gain.gain.value=levelFor(state,index)}
function create(api){const output=api.context.createGain(),inputs=new Map();const u={output,inputs,input(index){index=Math.max(0,index|0);let g=inputs.get(index);if(!g){g=api.context.createGain();g.connect(output);inputs.set(index,g);apply(u,api.state)}return g},sync(state){apply(u,state)}};api.setInput(u.input(0));api.setOutput(output);return u}
function destroy({runtime}){const u=runtime.user;if(!u)return;for(const g of u.inputs?.values?.()||[])try{g.disconnect()}catch(_){}try{u.output?.disconnect()}catch(_){}}
C.define({type:I.PLUS_ONE_MERGER,version:"carrier-level-1",description:"USED +1 CARRIER MERGER · LEVEL PER INPUT",dynamicPorts:{carrierIn:"used-plus-one"},defaults,create,setState({runtime,state}){runtime.user?.sync(state)},destroy,serialize:({state})=>({levels:{...(state.levels||{})}}),restore:({saved})=>({levels:{...(saved?.levels||{})}})});
C.defineSurface(I.PLUS_ONE_MERGER,{family:"ROUTING",version:3,package:{id:I.PLUS_ONE_MERGER,version:3,behavior:{role:"used-plus-one-carrier-merger",signals:["carrier"],inputs:"used-plus-one",inputControls:"level",stateOwnership:"module"}},faceplate:{livery:"routing",primary:"#332410",secondary:"#ffb86e",tertiary:"#fff0df"},defaults,controls:[],sources:[{id:"source.carrier",type:"audioInput",mode:"dynamic-used-plus-one"}],actions:[{id:"action.merge",type:"carrierMergeWithInputLevel"}],nodes:{connections:[["source.carrier","action.merge"]]}});
})(window);

(function(global){
if(global.parent===global)return;const q=new URLSearchParams(global.location.search),instance=q.get("instance"),P=global.parent.MultiSynth||{},E=P.NodeGraphEngine,MS=global.MultiSynth||{},R=MS.ControlSurfaceRenderer,C=MS.ControlSurface?.CONTROL,out=document.getElementById("ratio"),detail=document.getElementById("detail"),levels=document.getElementById("levels");if(!instance||!E||!out||!levels||!R||!C)return;
const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
function state(){return E.getModule(instance)?.state||{levels:{}}}
function usedInputs(){return(E.graph().connections||[]).map(c=>E.parseNode(c.to)).filter(p=>p?.id===instance&&p.signal==="carrier"&&p.index!=null).sort((a,b)=>a.index-b.index)}
function level(i){return clamp(state().levels?.[i]??state().levels?.[String(i)]??1)}
function patch(i,value){const next={...(state().levels||{})};next[i]=clamp(value);E.setModuleState(instance,{levels:next})}
function render(){const used=usedInputs(),count=used.length;out.textContent=`${Math.max(1,count)}/1`;detail.textContent=`${count} INPUT${count===1?"":"S"} CONNECTED · +1 READY · CARRIER`;levels.innerHTML="";for(let i=0;i<=count;i++){const row=document.createElement("div");row.className="plusOneLevel";row.innerHTML=`<strong>IN ${i+1}</strong><div class="levelHost"></div><small>${i<count?"CONNECTED":"SPARE"}</small>`;levels.appendChild(row);const node=R.mount(row.querySelector(".levelHost"),{id:`level-${i}`,control:C.FADER,label:"LEVEL",value:{default:level(i),min:0,max:1,step:.01}},{variant:"vertical",width:46,height:140,valueReadout:true}),s={value:level(i)};R.bindFader(node,s);node.addEventListener("multisynth-control-value-change",e=>patch(i,e.detail?.value))}}
render();E.on?.("graph-changed",render);global.addEventListener("multisynth-state-sync",render);
})(window);

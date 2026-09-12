"use strict";
(function(global){
const MS=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds;
if(!C||!I)return;
const defaults=()=>({channel:1,octave:0,velocity:127,pitch:0,mod:0,ribbon:0.5,xyX:0.5,xyY:0.5,knobs:Array(8).fill(0.5),faders:Array(8).fill(0.75),pads:Array(16).fill(0),mappings:{},padMappings:{}});
function create(api){const c=api.context,input=c.createGain(),output=c.createGain(),analyser=c.createAnalyser();analyser.fftSize=1024;analyser.smoothingTimeConstant=.7;input.connect(output);input.connect(analyser);api.setInput(input);api.setOutput(output);return{id:api.instanceId,input,output,analyser,state:api.state}}
function setState({runtime,state,patch}){const u=runtime.user;if(!u)return;u.state=state;if("mod" in patch)MS.CvBus?.send(u.id,{kind:"cv",control:"mod",value:Number(state.mod)||0});if("xyX" in patch||"xyY" in patch)MS.CvBus?.send(u.id,{kind:"cv",control:"xy",x:Number(state.xyX)||0,y:Number(state.xyY)||0,value:Number(state.xyY)||0})}
function destroy({runtime}){for(const n of [runtime.user?.input,runtime.user?.output,runtime.user?.analyser])try{n?.disconnect()}catch(_){}}
C.define({type:I.CONTROL_FREAK,version:"module-builder-3-canonical-controls",description:"PERFORMANCE CONTROLLER · SHARED KEYBOARD · PADS · MOD · XY · ASSIGNABLE CONTROLS",defaults:defaults(),resources:["midi"],create,setState,destroy,serialize:({state})=>({...state,pitch:0}),restore:({saved})=>Object.assign(defaults(),saved||{},{pitch:0})});
const controls=[
  ...Array.from({length:16},(_,i)=>({id:`pad-${i}`,control:"pad",state:"pads",label:String(i+1).padStart(2,"0"),node:`controller.pad${i}`})),
  {id:"mod",control:"ribbon",state:"mod",label:"MOD",value:{default:0,min:-1,max:1,step:0},meta:{orientation:"vertical"},node:"controller.mod"},
  {id:"xy",control:"xy",label:"XY",meta:{stateX:"xyX",stateY:"xyY"},node:"controller.xy"},
  ...Array.from({length:8},(_,i)=>({id:`knob${i}`,control:"knob",state:"knobs",label:`K${i+1}`,value:{default:.5,min:0,max:1,step:.001},node:`controller.knob${i}`})),
  ...Array.from({length:8},(_,i)=>({id:`fader${i}`,control:"fader",state:"faders",label:`F${i+1}`,value:{default:.75,min:0,max:1,step:.001},node:`controller.fader${i}`})),
  {id:"channel",control:"encoder",state:"channel",label:"MIDI CHANNEL",value:{default:1,min:1,max:16,step:1},node:"controller.channel"},
  {id:"mapping",control:"screen",state:"mappings",label:"ASSIGNMENTS",node:"controller.mapping"}
];
C.defineSurface(I.CONTROL_FREAK,{version:3,package:{id:I.CONTROL_FREAK,version:3,behavior:{role:"performance-controller",outputs:["note","midi","cv"],performanceSurface:"control-keyboard.js",stateOwnership:"module"}},faceplate:{livery:"controller-blue",primary:"#071527",secondary:"#75b7ff",tertiary:"#e1f1ff"},defaults:defaults(),controls,sources:[{id:"source.touch",type:"performanceInput"},{id:"source.midi",type:"midiInput"}],actions:[{id:"action.note",type:"noteOutput"},{id:"action.cv",type:"cvOutput"},{id:"action.map",type:"controlMapping"}],nodes:{connections:[["controller.mod","action.cv"],["controller.xy","action.cv"],...Array.from({length:8},(_,i)=>[`controller.knob${i}`,"action.map"]),...Array.from({length:8},(_,i)=>[`controller.fader${i}`,"action.map"])]}});
})(window);

(function(global){
if(global.parent===global)return;
const q=new URLSearchParams(location.search),instance=q.get("instance"),P=parent.MultiSynth||{},E=P.NodeGraphEngine,A=P.NodeAudioGraph,R=global.MultiSynth?.ControlSurfaceRenderer,PK=global.MultiSynth?.PerformanceKeyboard,root=document.getElementById("controls"),screen=document.getElementById("screen");
if(!instance||!E||!R||!root)return;
const module=E.getModule(instance);if(!module)return;
let state={channel:1,octave:0,velocity:127,pitch:0,mod:0,ribbon:.5,xyX:.5,xyY:.5,knobs:Array(8).fill(.5),faders:Array(8).fill(.75),pads:Array(16).fill(0),mappings:{},padMappings:{},...(module.state||{})};
root.innerHTML="";root.classList.add("ms-module-surface");
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)||0)),patch=p=>{state={...state,...p};try{E.setModuleState(instance,p)}catch(e){console.error(e)}},mount=(p,d,v={})=>R.mount(p,{...d,meta:{...(d.meta||{}),visual:v}}),show=t=>screen.textContent=String(t||"");
function bank(title,layout){const s=document.createElement("section"),h=document.createElement("div"),g=document.createElement("div");s.className="ms-module-bank";h.className="ms-module-bank-title";h.textContent=title;g.className=`ms-control-grid ${layout}`;s.append(h,g);root.appendChild(s);return g}
function getPath(obj,path){return path.reduce((v,k)=>v?.[k],obj)}
function setPathClone(obj,path,value){if(path.length===1)return{[path[0]]:value};const top=path[0],base=Array.isArray(obj?.[top])?[...(obj[top]||[])]:{...(obj?.[top]||{})};let cur=base;for(let i=1;i<path.length-1;i++){const k=path[i],next=cur[k];cur[k]=Array.isArray(next)?[...next]:{...(next||{})};cur=cur[k]}cur[path[path.length-1]]=value;return{[top]:base}}
function labelPath(path){return path.map(x=>String(x).replace(/([A-Z])/g," $1").toUpperCase()).join(" › ")}
function collectLeaves(value,path=[],out=[]){const skip=new Set(["stepsData","pattern","clips","mappings","data","pcm","knobs","faders","pads"]),last=String(path[path.length-1]??"");if(skip.has(last))return out;if(typeof value==="number"||typeof value==="boolean"){out.push({path:[...path],value});return out}if(!value||typeof value!=="object"||path.length>4)return out;if(Array.isArray(value)&&value.length>24)return out;for(const [k,v] of Object.entries(value))collectLeaves(v,[...path,k],out);return out}
function inferRange(path,value){const last=String(path.at(-1)||"").toLowerCase();if(typeof value==="boolean")return{min:0,max:1,bool:true};if(last.includes("phase"))return{min:0,max:360};if(last==="bpm")return{min:30,max:300};if(last.includes("pitch"))return{min:-24,max:24};if(last.includes("level")||last.includes("mix")||last.includes("gain")||last.includes("amount"))return{min:0,max:Number(value)>1?100:1};if(Math.abs(Number(value))<=1)return{min:0,max:1};return{min:0,max:Math.max(1,Math.abs(Number(value))*2)}}
function targets(){return(E.graph()?.modules||[]).filter(m=>m.id!==instance&&m.enabled!==false).map(m=>({module:m,leaves:collectLeaves(m.state||{})})).filter(x=>x.leaves.length)}
function applyMapping(key,norm){const m=state.mappings?.[key];if(!m)return;const tm=E.getModule?.(m.moduleId);if(!tm)return;let value=m.bool?norm>=.5:m.min+clamp(norm)*(m.max-m.min);if(!m.bool&&Number.isInteger(getPath(tm.state,m.path)))value=Math.round(value);try{E.setModuleState(tm.id,setPathClone(tm.state,m.path,value));show(`${key.toUpperCase()} → ${m.moduleName} · ${labelPath(m.path)} = ${m.bool?(value?"ON":"OFF"):Number(value).toFixed(2)}`)}catch(e){console.error(e)}}
function applyPadMapping(key,on){const m=state.padMappings?.[key];if(!m)return;const tm=E.getModule?.(m.moduleId);if(!tm)return;let value=m.bool?!!on:(on?m.max:m.min);if(!m.bool&&Number.isInteger(getPath(tm.state,m.path)))value=Math.round(value);try{E.setModuleState(tm.id,setPathClone(tm.state,m.path,value));show(`${key.toUpperCase()} → ${m.moduleName} · ${labelPath(m.path)} = ${m.bool?(value?"ON":"OFF"):Number(value).toFixed(2)}`)}catch(e){console.error(e)}}
function bindMapHold(node,key){let timer=null,sx=0,sy=0;node.addEventListener("pointerdown",e=>{sx=e.clientX;sy=e.clientY;timer=setTimeout(()=>{node.__msResetKnobTap?.();openMapper(key)},600)});node.addEventListener("pointermove",e=>{if(timer&&Math.hypot(e.clientX-sx,e.clientY-sy)>8){clearTimeout(timer);timer=null}});const end=()=>{if(timer)clearTimeout(timer);timer=null};node.addEventListener("pointerup",end);node.addEventListener("pointercancel",end)}
function sharedButton(parent,id,label,fn,active=false){const n=mount(parent,{id,control:"button",label},{variant:"rect"});n.dataset.active=active?"1":"0";n.addEventListener("click",fn);return n}
let mapKey=null,mapList=null;
function openMapper(key,store="mappings"){mapKey=key;mapList.innerHTML="";const current=state[store]?.[key],title=document.createElement("strong");title.className="cfMapTitle";title.textContent=`MAP ${key.toUpperCase()}${current?` · CURRENT ${current.moduleName} / ${labelPath(current.path)}`:""}`;mapList.appendChild(title);if(current)sharedButton(mapList,"clear-map","CLEAR MAPPING",()=>{const m={...(state[store]||{})};delete m[key];patch({[store]:m});openMapper(key,store)});for(const t of targets()){const heading=document.createElement("div");heading.className="cfMapModule";heading.textContent=t.module.displayName||t.module.type;mapList.appendChild(heading);for(const leaf of t.leaves){const meta=inferRange(leaf.path,leaf.value),active=current?.moduleId===t.module.id&&JSON.stringify(current.path)===JSON.stringify(leaf.path);sharedButton(mapList,`map-${t.module.id}-${leaf.path.join("-")}`,`${labelPath(leaf.path)} · ${leaf.value}`,()=>{const m={...(state[store]||{}),[key]:{moduleId:t.module.id,moduleName:t.module.displayName||t.module.type,path:leaf.path,min:meta.min,max:meta.max,bool:!!meta.bool}};patch({[store]:m});show(`${key.toUpperCase()} MAPPED`);openMapper(key,store)},active)}}}

const perf=bank("PERFORMANCE","ms-layout-pads"),pads=[],padBindings=[];
for(let i=0;i<16;i++){
 const key=`pad${i}`,n=mount(perf,{id:`pad-${i}`,control:"pad",label:String(i+1).padStart(2,"0")},{variant:"square"}),note=36+i,binding={active:!!state.pads?.[i],held:false};pads.push(n);padBindings.push(binding);R.bindPad(n,binding);
 const setPad=active=>{const arr=[...(state.pads||Array(16).fill(0))];arr[i]=active?1:0;patch({pads:arr})};
 n.addEventListener("multisynth-control-pad-tap",()=>{A?.resume?.();A?.noteOn?.(note,state.velocity||127);setPad(true);applyPadMapping(key,true);A?.noteOff?.(note);setPad(false);applyPadMapping(key,false)});
 n.addEventListener("multisynth-control-pad-press",()=>{A?.resume?.();A?.noteOn?.(note,state.velocity||127);setPad(true);applyPadMapping(key,true)});
 n.addEventListener("multisynth-control-pad-hold",()=>openMapper(key,"padMappings"));
 n.addEventListener("multisynth-control-pad-release",()=>{A?.noteOff?.(note);setPad(false);applyPadMapping(key,false)});
}

const expression=bank("EXPRESSION","ms-layout-params");
const mod=mount(expression,{id:"mod",control:"ribbon",state:"mod",label:"MOD",value:{default:(state.mod*2)-1,min:-1,max:1,step:0}},{variant:"vertical"});
bindMapHold(mod,"mod");
const xy=mount(expression,{id:"xy",control:"xy",label:"XY"},{variant:"pad",width:150,height:150});bindMapHold(xy,"xyX");

const knobsBank=bank("ASSIGNABLE KNOBS","ms-layout-knobs"),fadersBank=bank("ASSIGNABLE FADERS","ms-layout-knobs"),knobNodes=[],faderNodes=[];
for(let i=0;i<8;i++){
 const key=`knob${i}`,n=mount(knobsBank,{id:key,control:"knob",label:`K${i+1}`,value:{default:state.knobs?.[i]??.5,min:0,max:1,step:.001}},{variant:"cap"});knobNodes.push(n);bindMapHold(n,key);
 n.addEventListener("multisynth-control-knob-delta",e=>{const arr=[...(state.knobs||Array(8).fill(.5))],next=clamp((arr[i]??.5)+Number(e.detail?.delta||0));arr[i]=next;R.setValue(n,next,next.toFixed(3));patch({knobs:arr});applyMapping(key,next)});
 const fkey=`fader${i}`,f=mount(fadersBank,{id:fkey,control:"fader",label:`F${i+1}`,value:{default:state.faders?.[i]??.75,min:0,max:1,step:.001}},{variant:"vertical"});faderNodes.push(f);bindMapHold(f,fkey);
 f.addEventListener("multisynth-control-value-change",e=>{const arr=[...(state.faders||Array(8).fill(.75))],next=clamp(e.detail?.value);arr[i]=next;patch({faders:arr});applyMapping(fkey,next)});
}

const midi=bank("MIDI","ms-layout-params"),channel=mount(midi,{id:"channel",control:"encoder",state:"channel",label:"CHANNEL",value:{default:state.channel||1,min:1,max:16,step:1}},{variant:"indexed",valueReadout:true});let ch=clamp(Math.round(state.channel||1),1,16),channelDegrees=0;
R.setValue(channel,ch,String(ch));
channel.addEventListener("multisynth-control-circular-drag",e=>{if(!e.detail?.active)return;channelDegrees+=Number(e.detail.deltaDegrees)||0;let steps=0;while(channelDegrees>=15){steps++;channelDegrees-=15}while(channelDegrees<=-15){steps--;channelDegrees+=15}if(!steps)return;ch=clamp(ch+steps,1,16);R.setValue(channel,ch,String(ch));patch({channel:ch})});

const mapBank=bank("ASSIGNMENTS","ms-layout-list"),mapScreen=mount(mapBank,{id:"mapping",control:"screen",label:"LONG-PRESS A CONTROL TO MAP"},{variant:"screen",height:280}),mapFace=mapScreen.querySelector(".ms-control-face");mapList=document.createElement("div");mapList.className="cfMapList";mapFace.appendChild(mapList);

const keyboardHost=document.getElementById("performanceKeyboard");PK?.mount?.(keyboardHost,{audio:A,onExpression:v=>{const n=clamp((v+1)/2);patch({mod:n});applyMapping("mod",n)},onPitch:v=>show(`PITCH ${Number(v).toFixed(2)}`)});

let lastMod=NaN,lastX=NaN,lastY=NaN;
function consumeSurfaces(){const rawMod=clamp(Number(mod.dataset.value),-1,1),normMod=(rawMod+1)/2;if(Math.abs(normMod-lastMod)>.0005){lastMod=normMod;patch({mod:normMod});applyMapping("mod",normMod)}const rx=clamp(Number(xy.dataset.x),-1,1),ry=clamp(Number(xy.dataset.y),-1,1),nx=(rx+1)/2,ny=1-(ry+1)/2;if(Math.abs(nx-lastX)>.0005||Math.abs(ny-lastY)>.0005){lastX=nx;lastY=ny;patch({xyX:nx,xyY:ny});applyMapping("xyX",nx);applyMapping("xyY",ny)}requestAnimationFrame(consumeSurfaces)}
requestAnimationFrame(consumeSurfaces);show("READY");
window.addEventListener("multisynth-state-sync",e=>{state={...state,...(e.detail||{})};ch=clamp(Math.round(state.channel||1),1,16);R.setValue(channel,ch,String(ch));for(let i=0;i<8;i++){R.setValue(knobNodes[i],state.knobs?.[i]??.5,Number(state.knobs?.[i]??.5).toFixed(3));faderNodes[i]?.commitFaderValue?.(state.faders?.[i]??.75,{silent:true})}});
})(window);

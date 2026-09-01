"use strict";
(()=>{
const query=new URLSearchParams(location.search);
const instance=query.get("instance");
const Host=parent.MultiSynth;
const Renderer=window.MultiSynth?.ControlSurfaceRenderer;
const root=document.getElementById("controls");
if(!instance)throw new Error("WHITMAN INSTANCE ID MISSING");
if(!Host?.NodeGraphEngine)throw new Error("WHITMAN NODE GRAPH UNAVAILABLE");
if(!Renderer)throw new Error("WHITMAN CONTROL LIBRARY UNAVAILABLE");
if(!root)throw new Error("WHITMAN CONTROL ROOT MISSING");
const Engine=Host.NodeGraphEngine;
const Library=Host.PCMLibrary||Host.UnifiedLibrary;
const module=Engine.getModule(instance);
if(!module)throw new Error("WHITMAN MODULE INSTANCE NOT FOUND");
let state=module.state||{};
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const copy=v=>JSON.parse(JSON.stringify(v));
const patch=p=>{state={...state,...p};Engine.setModuleState(instance,p)};
root.innerHTML="";
const shell=document.createElement("div");shell.className="ws-shell";root.appendChild(shell);
function bank(title,cls=""){
  const section=document.createElement("section");
  section.className=`ws-bank ${cls}`.trim();
  const heading=document.createElement("div");heading.className="ws-bank-head";heading.textContent=title;
  section.appendChild(heading);
  shell.appendChild(section);
  return section;
}
function row(parent,cls){const node=document.createElement("div");node.className=`ws-row ${cls}`;parent.appendChild(node);return node}
function mount(parent,spec,visual={}){return Renderer.mount(parent,{...spec,meta:{...(spec.meta||{}),visual}})}
function setActive(node,on){node.dataset.active=on?"1":"0"}
function button(parent,id,label,press,active=false,visual={}){const node=mount(parent,{id,control:"button",label},{variant:"rect",width:100,height:48,...visual});setActive(node,active);node.onclick=()=>press?.(node);return node}
function holdButton(parent,id,label,start,end){const node=mount(parent,{id,control:"button",label},{variant:"rect",width:100,height:48});let held=false;node.onpointerdown=e=>{held=true;setActive(node,true);node.setPointerCapture?.(e.pointerId);start?.();e.preventDefault()};const finish=e=>{if(!held)return;held=false;setActive(node,false);end?.();try{node.releasePointerCapture?.(e.pointerId)}catch(_){}};node.onpointerup=finish;node.onpointercancel=finish;return node}
function toggle(parent,id,key,label,initial){let value=!!initial;const node=mount(parent,{id,control:"switch",state:key,label,value:{default:value}},{variant:"rocker"});const paint=()=>node.dataset.on=value?"1":"0";node.setModuleValue=v=>{value=!!v;paint()};node.onclick=()=>{value=!value;paint();patch({[key]:value})};paint();return node}
function rotary(parent,{id,key,label,value,min,max,step=1,unit="",dial=false,change}){let current=Number(value);const control=dial?"dial":"knob";const node=mount(parent,{id,control,state:key,label,value:{default:current,min,max,step},meta:{unit}},{variant:dial?"rotary":"cap",size:dial?72:68,valueReadout:true});const pointer=node.querySelector(".ms-control-pointer"),output=node.querySelector(".ms-control-value"),decimals=step<1?Math.max(0,(String(step).split(".")[1]||"").length):0,quantize=v=>clamp(Math.round((v-min)/step)*step+min,min,max),paint=()=>{const n=clamp((current-min)/(max-min||1),0,1);if(pointer)pointer.style.transform=`translateX(-50%) rotate(${-135+n*270}deg)`;if(output)output.textContent=`${decimals?current.toFixed(decimals):Math.round(current)}${unit}`};node.setModuleValue=v=>{current=quantize(Number(v));paint()};let dragging=false,startY=0,startValue=current;node.onpointerdown=e=>{dragging=true;startY=e.clientY;startValue=current;node.setPointerCapture?.(e.pointerId);e.preventDefault()};node.onpointermove=e=>{if(!dragging)return;const raw=startValue+(startY-e.clientY)*(max-min)/180,next=quantize(raw);if(next!==current){current=next;paint();change?.(current)}e.preventDefault()};const finish=e=>{dragging=false;try{node.releasePointerCapture?.(e.pointerId)}catch(_){}};node.onpointerup=finish;node.onpointercancel=finish;paint();return node}
const selected=()=>clamp(Number(state.selectedSample)||0,0,15);
function sampleAt(i){return (state.samples||[])[i]||{}}
function updateSample(i,key,value){const samples=copy(state.samples||[]);while(samples.length<=i)samples.push({});samples[i]={...samples[i],[key]:value};patch({samples})}
const samplerBank=bank("SAMPLER","ws-sampler-bank");
const transport=row(samplerBank,"ws-transport");
holdButton(transport,"record","RECORD",()=>patch({recording:true}),()=>patch({recording:false}));
toggle(transport,"play","previewPlaying","PLAY",state.previewPlaying);
toggle(transport,"run","running","RUN",state.running);
toggle(transport,"cv","cvTrigger","CV",state.cvTrigger!==false);
const tempo=row(samplerBank,"ws-tempo");
rotary(tempo,{id:"bpm",key:"bpm",label:"BPM",value:state.bpm??120,min:30,max:300,step:1,unit:" BPM",change:v=>patch({bpm:v})});
rotary(tempo,{id:"swing",key:"swing",label:"SWING",value:state.swing??0,min:0,max:100,step:1,unit:"%",change:v=>patch({swing:v})});
rotary(tempo,{id:"length",key:"steps",label:"LENGTH",value:state.steps??32,min:1,max:32,step:1,change:v=>patch({steps:v})});
const paramsBank=bank("SELECTED SAMPLE","ws-params-bank");
const params=row(paramsBank,"ws-params");
const padsBank=bank("16 SAMPLE PADS","ws-pads-bank");
const pads=row(padsBank,"ws-pads");
const stepsBank=bank("32 STEPS","ws-steps-bank");
const steps=row(stepsBank,"ws-steps");
const libraryBank=bank("PCM LIBRARY","ws-library-bank");
const libraryScreen=mount(libraryBank,{id:"pcm-library",control:"screen",label:"SAVED SAMPLES"},{variant:"screen",width:520,height:260});
const libraryFace=libraryScreen.querySelector(".ms-control-face");
const libraryList=document.createElement("div");libraryList.className="ws-library-list";libraryFace.appendChild(libraryList);
function drawParams(){params.innerHTML="";const i=selected(),s=sampleAt(i);rotary(params,{id:"pitch",key:`samples.${i}.pitch`,label:"PITCH",value:s.pitch??0,min:-24,max:24,step:1,unit:" st",dial:true,change:v=>updateSample(i,"pitch",v)});rotary(params,{id:"level",key:`samples.${i}.level`,label:"LEVEL",value:s.level??1,min:0,max:1,step:.01,change:v=>updateSample(i,"level",v)});rotary(params,{id:"left",key:`samples.${i}.leftLevel`,label:"LEFT",value:s.leftLevel??1,min:0,max:1,step:.01,change:v=>updateSample(i,"leftLevel",v)});rotary(params,{id:"right",key:`samples.${i}.rightLevel`,label:"RIGHT",value:s.rightLevel??1,min:0,max:1,step:.01,change:v=>updateSample(i,"rightLevel",v)});rotary(params,{id:"lag",key:`samples.${i}.lagMs`,label:"L/R LAG",value:s.lagMs??0,min:-.05,max:.05,step:.001,unit:" s",dial:true,change:v=>updateSample(i,"lagMs",v)})}
function drawPads(){pads.innerHTML="";const active=selected();for(let i=0;i<16;i++){const s=sampleAt(i),name=s.name||`SAMPLE ${String(i+1).padStart(2,"0")}`,node=mount(pads,{id:`sample-${i}`,control:"pad",label:`${String(i+1).padStart(2,"0")} · ${name}`},{variant:"square",width:90,height:68});setActive(node,i===active);node.dataset.loaded=s.pcmKey?"1":"0";node.onclick=()=>{patch({selectedSample:i,recordSlot:i});drawPads();drawParams();drawSteps()}}}
function drawSteps(){steps.innerHTML="";const sample=selected();for(let n=0;n<32;n++){const on=(state.stepsData?.[n]||[]).map(Number).includes(sample);button(steps,`step-${n}`,String(n+1),()=>{const data=copy(state.stepsData||[]);while(data.length<32)data.push([]);const values=(data[n]||[]).map(Number),at=values.indexOf(sample);if(at>=0)values.splice(at,1);else values.push(sample);data[n]=values;patch({stepsData:data});drawSteps()},on,{width:58,height:42})}}
async function installPCM(id){if(!Library?.get)return;const full=await Library.get(id);if(!full)return;const i=selected(),samples=copy(state.samples||[]);while(samples.length<=i)samples.push({});samples[i]={...samples[i],name:full.name,pcmKey:full.id,start:0,end:full.duration,pitch:samples[i]?.pitch??0,level:samples[i]?.level??1,leftLevel:samples[i]?.leftLevel??1,rightLevel:samples[i]?.rightLevel??1,lagMs:samples[i]?.lagMs??0};patch({samples,pcmInstall:{index:i,data:full.data,sampleRate:full.sampleRate,name:full.name,pcmKey:full.id}});drawPads();drawParams();await drawLibrary()}
async function removePCM(id){if(!Library?.remove)return;await Library.remove(id);const samples=copy(state.samples||[]);let changed=false;for(let i=0;i<samples.length;i++)if(samples[i]?.pcmKey===id){samples[i]={...samples[i],name:`SAMPLE ${String(i+1).padStart(2,"0")}`,pcmKey:null,start:0,end:0};changed=true}if(changed)patch({samples});drawPads();drawParams();await drawLibrary()}
async function drawLibrary(){const scroll=libraryList.scrollTop;libraryList.innerHTML="";const items=Library?.list?await Library.list():[];if(!items.length){const empty=document.createElement("div");empty.className="ws-empty";empty.textContent="NO SAVED SAMPLES";libraryList.appendChild(empty);return}for(const item of items){const line=document.createElement("div");line.className="ws-library-row";libraryList.appendChild(line);const use=button(line,`use-${item.id}`,`${item.name} · ${(item.duration||0).toFixed(2)}s`,()=>installPCM(item.id).catch(console.error),false,{width:220,height:48});use.classList.add("ws-library-use");const del=button(line,`delete-${item.id}`,"×",()=>removePCM(item.id).catch(console.error),false,{width:50,height:48});del.classList.add("ws-library-delete")}libraryList.scrollTop=scroll}
function pathValue(obj,path){return String(path||"").split(".").reduce((v,k)=>v==null?undefined:v[k],obj)}
function drawAll(){drawParams();drawPads();drawSteps();drawLibrary().catch(console.error)}
drawAll();
window.addEventListener("multisynth-state-sync",event=>{const previous=state;state=event.detail||state;root.querySelectorAll("[data-state-key]").forEach(node=>{const key=node.dataset.stateKey,next=pathValue(state,key),old=pathValue(previous,key);if(next!==undefined&&next!==old)node.setModuleValue?.(next)});if(selected()!==clamp(Number(previous.selectedSample)||0,0,15)||JSON.stringify(state.samples||[])!==JSON.stringify(previous.samples||[])){drawPads();drawParams()}if(JSON.stringify(state.stepsData||[])!==JSON.stringify(previous.stepsData||[]))drawSteps()});
})();

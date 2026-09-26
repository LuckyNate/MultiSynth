import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const source=fs.readFileSync(path.join(repo,"app/src/main/assets/modules/garage-band.js"),"utf8");
let def=null,surface=null;
class Param{constructor(v=0){this.value=v}setTargetAtTime(v){this.value=v}}
class Node{constructor(){this.frequency=new Param();this.Q=new Param();this.type=""}connect(n){return n}disconnect(){}}
class AudioContext{constructor(){this.currentTime=0}createGain(){return new Node()}createBiquadFilter(){return new Node()}}
const ids={GARAGE_BAND:"garage-band"};
const contract={define:d=>{def=d},defineSurface:(_t,s)=>{surface=s}};
const context={console,Math,Number,String,Object,Array,Map,Set,window:null,parent:null,MultiSynth:{ModuleIds:ids,ModuleContract:contract}};
context.window=context;context.parent=context;vm.createContext(context);vm.runInContext(source,context,{filename:"garage-band.js"});
if(!def||!surface)throw new Error("Garage Band contract missing");
if(typeof def.midiMessage!=="function")throw new Error("Garage Band MIDI receiver missing");
if(!def.resources?.includes("midi"))throw new Error("Garage Band MIDI resource missing");
if(surface.sources?.find(x=>x.id==="source.midi")?.type!=="midiInput")throw new Error("Garage Band surface MIDI input missing");
const expected={lowFrequency:16,lowWidth:17,midFrequency:18,midWidth:19,highFrequency:20,highWidth:21};
for(const [id,cc] of Object.entries(expected)){const control=surface.controls.find(x=>x.id===id);if(control?.meta?.midi?.cc!==cc)throw new Error(`${id} missing CC${cc}`)}
const ctx=new AudioContext(),state={...def.defaults};let input=null,output=null;
const user=def.create({context:ctx,state,setInput:n=>input=n,setOutput:n=>output=n});const runtime={user};
if(!input||!output)throw new Error("Garage Band endpoints missing");
const midi=(cc,value)=>def.midiMessage({runtime,state},{status:0xb0,data1:cc,data2:value});
for(const cc of [16,17,18,19,20,21])if(!midi(cc,127))throw new Error(`CC${cc} not consumed`);
if(state.lowFrequency!==10000||state.midFrequency!==15000||state.highFrequency!==20000)throw new Error("frequency maxima incorrect");
if(Math.abs(state.lowWidth-20)>1e-9||Math.abs(state.midWidth-20)>1e-9||Math.abs(state.highWidth-20)>1e-9)throw new Error("Q maxima incorrect");
if(user.low.frequency.value!==state.lowFrequency||user.mid.frequency.value!==state.midFrequency||user.high.frequency.value!==state.highFrequency)throw new Error("MIDI frequency state not applied to filters");
if(user.low.Q.value!==state.lowWidth||user.mid.Q.value!==state.midWidth||user.high.Q.value!==state.highWidth)throw new Error("MIDI Q state not applied to filters");
if(def.midiMessage({runtime,state},{status:0x90,data1:60,data2:127})!==false)throw new Error("Garage Band consumed Note On");
console.log("Garage Band MIDI smoke passed — CC16-21 control the six live band-pass parameters");
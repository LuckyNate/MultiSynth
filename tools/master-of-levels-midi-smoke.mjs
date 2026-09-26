import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const source=fs.readFileSync(path.join(repo,"app/src/main/assets/modules/master-of-levels.js"),"utf8");
let def=null,surface=null;

class Param{constructor(v=0){this.value=v}setTargetAtTime(v){this.value=v}}
class Node{constructor(){this.gain=new Param(1);this.curve=null;this.oversample="none"}connect(n){return n}disconnect(){}}
class AudioContext{constructor(){this.currentTime=0}createGain(){return new Node()}createWaveShaper(){return new Node()}}

const ids={MASTER_OF_LEVELS:"master-of-levels"};
const contract={define:d=>{def=d},defineSurface:(_type,s)=>{surface=s}};
const context={console,Math,Number,String,Boolean,Array,Object,Float32Array,window:null,parent:null,MultiSynth:{ModuleIds:ids,ModuleContract:contract}};
context.window=context;context.parent=context;
vm.createContext(context);
vm.runInContext(source,context,{filename:"modules/master-of-levels.js"});
if(!def||!surface)throw new Error("Master of Levels contract missing");
if(def.version!=="real-midi-2-drive-processor")throw new Error(`unexpected version ${def.version}`);
if(typeof def.midiMessage!=="function")throw new Error("MIDI receiver missing");
if(surface.package?.behavior?.role!=="carrier-drive-overdrive-processor")throw new Error("wrong module role");
if(surface.sources?.find(x=>x.id==="source.midi")?.type!=="midiInput")throw new Error("MIDI input source missing");
const cc={pre:16,gain:17,overdrive:18,level:7};
for(const [id,num] of Object.entries(cc)){const c=surface.controls.find(x=>x.id===id);if(c?.meta?.midi?.cc!==num)throw new Error(`${id} missing CC${num}`)}

const ctx=new AudioContext(),state={...def.defaults};let input=null,output=null;
const user=def.create({context:ctx,state,setInput:n=>input=n,setOutput:n=>output=n});
const runtime={user};
if(!input||!output)throw new Error("audio endpoints missing");
const midi=(cc,value)=>def.midiMessage({runtime,state},{status:0xb0,data1:cc,data2:value});
const near=(a,b,label)=>{if(Math.abs(a-b)>1e-9)throw new Error(`${label}: ${a} != ${b}`)};

midi(16,127); near(state.pre,2,"pre state"); near(user.pre.gain.value,2,"pre gain");
midi(17,127); near(state.gain,4,"gain state"); near(user.gain.gain.value,4,"gain node");
midi(18,127); near(state.overdrive,1,"overdrive state"); if(!user.drive.curve?.length)throw new Error("overdrive curve not updated");
midi(7,64); near(state.level,64/127*2,"level state"); near(user.level.gain.value,64/127*2,"level node");
if(def.midiMessage({runtime,state},{status:0x90,data1:60,data2:127})!==false)throw new Error("Note On should be ignored");
if(surface.package?.behavior?.signalPath!=="pre-gain-waveshaper-level")throw new Error("signal path contract changed");

console.log("Master of Levels MIDI smoke passed");

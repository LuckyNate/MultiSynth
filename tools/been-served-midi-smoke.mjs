import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const source=fs.readFileSync(path.join(repo,"app/src/main/assets/modules/been-served.js"),"utf8");
const audioGraphSource=fs.readFileSync(path.join(repo,"app/src/main/assets/node-audio-graph.js"),"utf8");
let def=null,surface=null;

class Param{
  constructor(v=0){this.value=v}
  cancelScheduledValues(){}
  setValueAtTime(v){this.value=v}
  setTargetAtTime(v){this.value=v}
  linearRampToValueAtTime(v){this.value=v}
  exponentialRampToValueAtTime(v){this.value=v}
}
class Node{
  constructor(){this.gain=new Param(1);this.frequency=new Param(0);this.threshold=new Param();this.ratio=new Param();this.knee=new Param();this.attack=new Param();this.release=new Param();this.fftSize=0}
  connect(n){return n}
  disconnect(){}
}
class AudioContext{
  constructor(){this.currentTime=0;this.state="running";this.destination=new Node()}
  createGain(){return new Node()}
  createDynamicsCompressor(){return new Node()}
  createAnalyser(){return new Node()}
  resume(){return Promise.resolve()}
}

const ids={BEEN_SERVED:"been-served"};
const contract={define:d=>{def=d},defineSurface:(_type,s)=>{surface=s}};
const context={console,Math,Number,String,Boolean,Array,Object,Map,Set,URLSearchParams,window:null,parent:null,MultiSynth:{ModuleIds:ids,ModuleContract:contract}};
context.window=context;context.parent=context;
vm.createContext(context);
vm.runInContext(source,context,{filename:"modules/been-served.js"});

if(!def)throw new Error("Been Served definition missing");
if(!surface)throw new Error("Been Served surface missing");
if(def.version!=="real-midi-3-envelope-generator")throw new Error(`unexpected Been Served version ${def.version}`);
if(!def.resources?.includes("midi"))throw new Error("Been Served does not declare MIDI resource");
if(typeof def.midiMessage!=="function")throw new Error("Been Served MIDI receiver missing");
if(surface.package?.behavior?.role!=="carrier-envelope-generator")throw new Error("Been Served is not declared as Carrier envelope generator");
if(surface.sources?.find(x=>x.id==="source.midi")?.type!=="midiInput")throw new Error("Been Served surface is missing real MIDI input");
if(surface.sources?.find(x=>x.id==="source.audio")?.mode!=="required-carrier")throw new Error("Been Served Carrier input is not required");

const ccByControl={attack:73,decay:75,sustain:16,release:72};
for(const [id,cc] of Object.entries(ccByControl)){
  const control=surface.controls.find(x=>x?.id===id);
  if(control?.meta?.midi?.cc!==cc)throw new Error(`${id} control missing CC${cc} mapping`);
}
if(source.includes("d1===70"))throw new Error("Been Served incorrectly hijacks standard CC70 Sound Variation for sustain level");

const ctx=new AudioContext(),state={...def.defaults};let input=null,output=null;
const user=def.create({context:ctx,state,setInput:n=>input=n,setOutput:n=>output=n});
const runtime={user};
if(!input||!output)throw new Error("Been Served runtime endpoints missing");
if(!user.expression)throw new Error("Been Served expression stage missing");
const midi=(status,data1,data2=0)=>def.midiMessage({runtime,state},{status,data1,data2});
const near=(actual,expected,tolerance,label)=>{if(Math.abs(actual-expected)>tolerance)throw new Error(`${label}: expected ${expected}, got ${actual}`)};
const timeFromMidi=v=>.001*Math.pow(10000,v/127);

if(!midi(0x90,60,100))throw new Error("Note On was not consumed");
if(!user.held.has("60"))throw new Error("Note On did not register held note");
if(!(user.gate.gain.value>0))throw new Error("Note On did not open envelope");

midi(0xb0,64,127);
if(!state.sustainPedal)throw new Error("CC64 did not engage sustain pedal");
midi(0x80,60,0);
if(user.held.size!==0||!user.sustained.has("60"))throw new Error("sustain pedal did not retain released note");
midi(0xb0,64,0);
if(state.sustainPedal||user.sustained.size)throw new Error("CC64 pedal-up did not clear sustain");

midi(0xb0,11,32);near(state.expression,32/127,1e-12,"CC11 expression");near(user.expression.gain.value,32/127,1e-12,"CC11 gain");
midi(0xb0,16,64);near(state.sustain,64/127,1e-12,"CC16 sustain level");
midi(0xb0,72,127);near(state.release,10,1e-10,"CC72 release");
midi(0xb0,73,127);near(state.attack,10,1e-10,"CC73 attack");
midi(0xb0,75,63);near(state.decay,timeFromMidi(63),1e-10,"CC75 decay");

midi(0x90,61,127);midi(0xb0,64,127);midi(0x80,61,0);
if(!user.sustained.size)throw new Error("pre-panic sustain setup failed");
midi(0xb0,123,0);
if(user.held.size||user.sustained.size||state.sustainPedal)throw new Error("All Notes Off did not clear held/sustained state");
if(user.gate.gain.value!==0)throw new Error("All Notes Off did not close envelope");

const saved=def.serialize({state}),restored=def.restore({saved});
near(restored.expression,state.expression,1e-12,"expression persistence");near(restored.attack,state.attack,1e-12,"attack persistence");

const routedCtx=new AudioContext();
const makeBeenServedRuntime=()=>{const routedState={...def.defaults};const routedUser=def.create({context:routedCtx,state:routedState,setInput(){},setOutput(){}});return{state:routedState,runtime:{user:routedUser}}};
const routedA=makeBeenServedRuntime(),routedB=makeBeenServedRuntime();
const modules=[{id:"cf",type:"control-freak",enabled:true},{id:"adsr-a",type:"been-served",enabled:true},{id:"adsr-b",type:"been-served",enabled:true}];
const connections=[{id:"midi-edge",type:"midi",from:"module:cf:midi-out",to:"module:adsr-a:midi-in"}];
const runtimes=new Map([["adsr-a",routedA.runtime],["adsr-b",routedB.runtime],["cf",{}]]),states=new Map([["adsr-a",routedA.state],["adsr-b",routedB.state]]);
const parseNode=value=>{const m=/^module:(.+):(midi-in|midi-out)$/.exec(String(value||""));return m?{id:m[1],signal:"midi",direction:m[2].endsWith("out")?"out":"in"}:null};
const routeMS={NodeGraphEngine:{graph:()=>({modules,connections}),getModule:id=>modules.find(m=>m.id===id),on(){},createModuleRuntime:id=>runtimes.get(id),parseNode},ModuleContract:{getRuntime:id=>runtimes.get(id),midi:(id,packet)=>states.has(id)?def.midiMessage({runtime:runtimes.get(id),state:states.get(id)},packet):false,panic:()=>true,update:()=>true},ModuleManifest:{get:()=>({capabilities:[]})},ModuleIds:{CONTROL_FREAK:"control-freak",ALCHEMY_MIXER:"alchemy-mixer",PURE_SYNTH:"puresynth"}};
const routeContext={console,Math,Promise,Map,Set,WeakMap,URL,queueMicrotask,AudioContext,webkitAudioContext:AudioContext,location:{href:"file:///index.html"},MultiSynth:routeMS};routeContext.window=routeContext;
vm.createContext(routeContext);vm.runInContext(audioGraphSource,routeContext,{filename:"node-audio-graph.js"});
const A=routeContext.MultiSynth.NodeAudioGraph;
if(A.noteOnFrom("cf",64,111)!==1)throw new Error("Control Freak routed Note On did not reach exactly one patched envelope");
if(!routedA.runtime.user.held.has("64"))throw new Error("patched Been Served did not receive routed Note On");
if(routedB.runtime.user.held.size)throw new Error("unpatched Been Served received routed Note On");
A.noteOffFrom("cf",64);if(routedA.runtime.user.held.size)throw new Error("patched Been Served did not receive routed Note Off");

console.log("Been Served MIDI smoke passed — Carrier envelope generator follows real MIDI rules and patched routing");

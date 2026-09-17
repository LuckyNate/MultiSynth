import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const source=fs.readFileSync(path.join(repo,"app/src/main/assets/modules/carrier-engine.js"),"utf8");
const I={PURE_SYNTH:"pure",QUAD_SYNTH:"quad",PULSYNTH:"pulsynth",SIN_LADDER:"sinladder",RAZORBACK:"razorback",STINGER:"stinger",NO_QUARTER:"no-quarter",themeFor:x=>x};
const definitions=new Map();
const context={console,Math,Number,String,Boolean,Array,Object,Map,Set,Float32Array,setTimeout,clearTimeout,MultiSynth:{ModuleIds:I,ModuleContract:{define:d=>definitions.set(d.type,d)},DspSources:{}}};
context.window=context;context.globalThis=context;
vm.createContext(context);
vm.runInContext(source,context,{filename:"carrier-engine.js"});

const ladders=[
  [I.PULSYNTH,"duty1",99],
  [I.SIN_LADDER,"harmonic1",8],
  [I.RAZORBACK,"peak1",100],
  [I.STINGER,"acceleration1",100]
];

function runtime(type){
  const state={level:.8,carrier:1,attack:.005,decay:.08,sustain:1,release:.08,amount1:.35,amount2:.25,amount3:.20,phase1:0,phase2:120,phase3:240,octave1:0,octave2:0,octave3:0,detune1:0,detune2:0,detune3:0,direction1:"up",direction2:"up",direction3:"up",modulation:0,expression:1,sustainPedal:false,pitchBend:0,program:0};
  if(type===I.PULSYNTH)Object.assign(state,{duty1:50,duty2:50,duty3:50});
  if(type===I.SIN_LADDER)Object.assign(state,{harmonic1:1,harmonic2:2,harmonic3:3});
  if(type===I.RAZORBACK)Object.assign(state,{peak1:25,peak2:50,peak3:75});
  if(type===I.STINGER)Object.assign(state,{acceleration1:88,acceleration2:92,acceleration3:96});
  const user={ctx:{currentTime:0},type,carrier:{gain:{setTargetAtTime(){}}},voices:new Map(),sustained:new Set(),sustainPedal:false};
  return{type,state,user};
}

function midi(def,rt,status,data1,data2=0){
  if(def.midiMessage({runtime:rt,state:rt.state},{status,data1,data2})===false)throw new Error(`${rt.type} rejected MIDI ${status.toString(16)} ${data1}`);
}

for(const [type,shapeKey,shapeMax] of ladders){
  const def=definitions.get(type);if(!def)throw new Error(`${type} definition missing`);
  const rt=runtime(type);
  midi(def,rt,0xb0,1,96);if(Math.abs(rt.state.modulation-96/127)>.0001)throw new Error(`${type} CC1 modulation failed`);
  midi(def,rt,0xb0,20,127);if(Math.abs(rt.state.amount1-.85)>.0001)throw new Error(`${type} stage 1 amount failed`);
  midi(def,rt,0xb0,21,127);if(Math.abs(rt.state[shapeKey]-shapeMax)>.0001)throw new Error(`${type} stage 1 shape failed`);
  midi(def,rt,0xb0,22,64);if(Math.abs(rt.state.phase1-(64/127*360))>.0001)throw new Error(`${type} stage 1 phase failed`);
  midi(def,rt,0xb0,23,0);if(rt.state.detune1!==-100)throw new Error(`${type} stage 1 detune failed`);
  midi(def,rt,0xb0,24,127);if(rt.state.octave1!==4)throw new Error(`${type} stage 1 octave failed`);
  midi(def,rt,0xb0,25,127);if(rt.state.direction1!=="down")throw new Error(`${type} stage 1 direction failed`);
  midi(def,rt,0xb0,26,0);if(rt.state.amount2!==0)throw new Error(`${type} stage 2 amount failed`);
  midi(def,rt,0xb0,32,64);if(Math.abs(rt.state.amount3-(64/127*.85))>.0001)throw new Error(`${type} stage 3 amount failed`);
  midi(def,rt,0xc0,11);if(rt.state.program!==11)throw new Error(`${type} Program Change failed`);
}

const nq=runtime(I.NO_QUARTER),nqDef=definitions.get(I.NO_QUARTER),before=JSON.stringify(nq.state);
if(nqDef.midiMessage({runtime:nq,state:nq.state},{status:0xb0,data1:20,data2:127})!==false)throw new Error("No Quarter must not accept ladder CC20");
if(JSON.stringify(nq.state)!==before)throw new Error("No Quarter state changed under ladder CC smoke");

console.log("ladder MIDI: Pulsynth, SinLadder, Razorback, Stinger passed shared real-MIDI stage mappings; No Quarter excluded");

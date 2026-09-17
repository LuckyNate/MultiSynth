import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const source=fs.readFileSync(path.join(repo,"app/src/main/assets/modules/laddersynth.js"),"utf8");
const I={LADDERSYNTH:"laddersynth",themeFor:x=>x};
const definitions=new Map(),surfaces=new Map();
const P={performanceKeyboard:()=>({}),adsr:()=>({}),selector:x=>x};
const context={console,Math,Number,String,Boolean,Array,Object,Map,Set,Float32Array,setTimeout,clearTimeout,MultiSynth:{ModuleIds:I,ModuleContract:{define:d=>definitions.set(d.type,d),defineSurface:(id,s)=>surfaces.set(id,s)},DspSources:{},ControlPrefabs:P}};
context.window=context;context.globalThis=context;
vm.createContext(context);
vm.runInContext(source,context,{filename:"laddersynth.js"});

const def=definitions.get(I.LADDERSYNTH);if(!def)throw new Error("LadderSynth definition missing");
const surface=surfaces.get(I.LADDERSYNTH);if(!surface)throw new Error("LadderSynth surface missing");
const state={...def.defaults};
const rt={type:I.LADDERSYNTH,state,user:{ctx:{currentTime:0},carrier:{gain:{setTargetAtTime(){}}},voices:new Map(),sustained:new Set(),sustainPedal:false}};
function midi(status,data1,data2=0){if(def.midiMessage({runtime:rt,state},{status,data1,data2})===false)throw new Error(`LadderSynth rejected MIDI ${status.toString(16)} ${data1}`)}

midi(0xb0,1,96);if(Math.abs(state.modulation-96/127)>.0001)throw new Error("CC1 modulation failed");
midi(0xb0,7,48);if(Math.abs(state.level-48/127)>.0001)throw new Error("CC7 level failed");
midi(0xb0,11,80);if(Math.abs(state.expression-80/127)>.0001)throw new Error("CC11 expression failed");
midi(0xb0,73,64);if(Math.abs(state.attack-(64/127*4))>.0001)throw new Error("CC73 attack failed");
midi(0xb0,75,32);if(Math.abs(state.decay-(32/127*4))>.0001)throw new Error("CC75 decay failed");
midi(0xb0,70,100);if(Math.abs(state.sustain-100/127)>.0001)throw new Error("CC70 sustain failed");
midi(0xb0,72,40);if(Math.abs(state.release-(40/127*4))>.0001)throw new Error("CC72 release failed");

for(let n=1;n<=4;n++){
  const cc=20+(n-1)*7;
  midi(0xb0,cc,127);if(state[`voice${n}`]!=="stinger")throw new Error(`rung ${n} voice failed`);
  midi(0xb0,cc+1,127);if(state[`bypass${n}`]!==true)throw new Error(`rung ${n} bypass failed`);
  midi(0xb0,cc+2,127);if(Math.abs(state[`amount${n}`]-.85)>.0001)throw new Error(`rung ${n} amount failed`);
  midi(0xb0,cc+3,64);if(Math.abs(state[`shape${n}`]-(64/127*100))>.0001)throw new Error(`rung ${n} shape failed`);
  midi(0xb0,cc+4,64);if(Math.abs(state[`phase${n}`]-(64/127*360))>.0001)throw new Error(`rung ${n} phase failed`);
  midi(0xb0,cc+5,0);if(state[`detune${n}`]!==-100)throw new Error(`rung ${n} detune failed`);
  midi(0xb0,cc+6,127);if(state[`octave${n}`]!==4)throw new Error(`rung ${n} octave failed`);
}

midi(0xe0,127,127);if(state.pitchBend<1.9||state.pitchBend>2.01)throw new Error("Pitch Bend failed");
midi(0xc0,11);if(state.program!==11)throw new Error("Program Change failed");
if(def.version!=="real-midi-1")throw new Error(`unexpected LadderSynth runtime version ${def.version}`);
if(surface.package?.behavior?.rungMidi!=="voice-bypass-octave-detune-amount-shape-phase")throw new Error("LadderSynth rung MIDI surface contract missing");
if(Object.keys(def.defaults).some(k=>k.startsWith("direction")))throw new Error("LadderSynth still exposes direction state");

console.log("LadderSynth MIDI smoke passed: four rung voice/bypass/octave/detune/amount/shape/phase mappings plus standard performance MIDI");
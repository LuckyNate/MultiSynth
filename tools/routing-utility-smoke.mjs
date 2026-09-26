import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const engineSource=fs.readFileSync(path.join(repo,"app/src/main/assets/node-graph-engine.js"),"utf8");
const manifestSource=fs.readFileSync(path.join(repo,"app/src/main/assets/module-manifest.js"),"utf8");
const splitterSource=fs.readFileSync(path.join(repo,"app/src/main/assets/modules/plus-one-splitter.js"),"utf8");
const mergerSource=fs.readFileSync(path.join(repo,"app/src/main/assets/modules/plus-one-merger.js"),"utf8");
const planeSource=fs.readFileSync(path.join(repo,"app/src/main/assets/node-plane.js"),"utf8");

for(const signal of ["audioInput","audioOutput","midiInput","midiOutput","clockFollower","clockSource"]){
  if(!manifestSource.includes(`["audioInput","audioOutput","midiInput","midiOutput","clockFollower","clockSource"]`))throw new Error("routing utilities missing full signal-domain capabilities");
}
if(!splitterSource.includes('midiMessage')||!splitterSource.includes('emit?.("midi"'))throw new Error("splitter does not forward MIDI");
if(!mergerSource.includes('midiMessage')||!mergerSource.includes('emit?.("midi"'))throw new Error("merger does not forward MIDI");
for(const ref of ["moduleMidiIn","moduleMidiOut","moduleClockIn","moduleClockOut"]){if(!planeSource.includes(`E.${ref}(m.id)`))throw new Error(`routing cards missing ${ref}`)}

const defs=new Map();
const ids={PLUS_ONE_SPLITTER:"plus-one-splitter",PLUS_ONE_MERGER:"plus-one-merger",canonicalId:v=>String(v||"")};
const contract={
  getDefinition(type){if(type===ids.PLUS_ONE_SPLITTER)return{displayName:type,defaults:{},dynamicPorts:{carrierOut:"used-plus-one"}};if(type===ids.PLUS_ONE_MERGER)return{displayName:type,defaults:{},dynamicPorts:{carrierIn:"used-plus-one"}};return{displayName:type,defaults:{},dynamicPorts:{}}},
  getSurface(){return null},update(){},destroy(){},createRuntime(){return{}},getRuntime(){return{}},
};
const context={console,JSON,Date,Math,Map,Set,structuredClone,MultiSynth:{ModuleContract:contract,ModuleIds:ids,StateKeys:{normalizePatch:(v)=>v}}};
context.window=context;context.globalThis=context;
vm.createContext(context);
vm.runInContext(engineSource,context,{filename:"node-graph-engine.js"});
const E=context.MultiSynth.NodeGraphEngine;
const add=t=>E.addModule(t);
const expectThrow=(fn,text)=>{let ok=false;try{fn()}catch(e){ok=String(e.message||e).includes(text)}if(!ok)throw new Error(`expected rejection containing ${text}`)};

// Ordinary outputs and inputs are one-cable jacks.
{
  const source=add("source"),a=add("a"),b=add("b");
  E.connectNodes(E.moduleMidiOut(source),E.moduleMidiIn(a));
  expectThrow(()=>E.connectNodes(E.moduleMidiOut(source),E.moduleMidiIn(b)),"+1 Splitter");
}
E.clear();
{
  const a=add("a"),b=add("b"),target=add("target");
  E.connectNodes(E.moduleMidiOut(a),E.moduleMidiIn(target));
  expectThrow(()=>E.connectNodes(E.moduleMidiOut(b),E.moduleMidiIn(target)),"+1 Merger");
}
E.clear();

// Splitter is the explicit fan-out exception on MIDI and Clock.
{
  const source=add("source"),split=add(ids.PLUS_ONE_SPLITTER),a=add("a"),b=add("b");
  E.connectNodes(E.moduleMidiOut(source),E.moduleMidiIn(split));
  E.connectNodes(E.moduleMidiOut(split),E.moduleMidiIn(a));
  E.connectNodes(E.moduleMidiOut(split),E.moduleMidiIn(b));
}
E.clear();
{
  const source=add("source"),split=add(ids.PLUS_ONE_SPLITTER),a=add("a"),b=add("b");
  E.connectNodes(E.moduleClockOut(source),E.moduleClockIn(split));
  E.connectNodes(E.moduleClockOut(split),E.moduleClockIn(a));
  E.connectNodes(E.moduleClockOut(split),E.moduleClockIn(b));
}
E.clear();

// Merger is the explicit fan-in exception on MIDI and Clock.
{
  const a=add("a"),b=add("b"),merge=add(ids.PLUS_ONE_MERGER),target=add("target");
  E.connectNodes(E.moduleMidiOut(a),E.moduleMidiIn(merge));
  E.connectNodes(E.moduleMidiOut(b),E.moduleMidiIn(merge));
  E.connectNodes(E.moduleMidiOut(merge),E.moduleMidiIn(target));
}
E.clear();
{
  const a=add("a"),b=add("b"),merge=add(ids.PLUS_ONE_MERGER),target=add("target");
  E.connectNodes(E.moduleClockOut(a),E.moduleClockIn(merge));
  E.connectNodes(E.moduleClockOut(b),E.moduleClockIn(merge));
  E.connectNodes(E.moduleClockOut(merge),E.moduleClockIn(target));
}
E.clear();

// Carrier keeps the existing used-plus-one dynamic routing behavior.
{
  const source=add("source"),split=add(ids.PLUS_ONE_SPLITTER),a=add("a"),b=add("b");
  E.connectNodes(E.moduleOut(source),E.moduleIn(split));
  E.connectNodes(E.moduleOutput(split,0),E.moduleIn(a));
  E.connectNodes(E.moduleOutput(split,1),E.moduleIn(b));
}
E.clear();
{
  const a=add("a"),b=add("b"),merge=add(ids.PLUS_ONE_MERGER),target=add("target");
  E.connectNodes(E.moduleOut(a),E.moduleInput(merge,0));
  E.connectNodes(E.moduleOut(b),E.moduleInput(merge,1));
  E.connectNodes(E.moduleOut(merge),E.moduleIn(target));
}
E.clear();

// Signal domains remain isolated.
{
  const a=add("a"),b=add("b");
  expectThrow(()=>E.connectNodes(E.moduleMidiOut(a),E.moduleIn(b)),"cannot be crossed");
}

console.log("routing utility smoke passed — ordinary jacks are single-cable; +1 Splitter/Merger own Carrier, MIDI and Clock fan-out/fan-in");

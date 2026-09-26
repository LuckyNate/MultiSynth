import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const engineSource=fs.readFileSync(path.join(repo,"app/src/main/assets/node-graph-engine.js"),"utf8");
const manifestSource=fs.readFileSync(path.join(repo,"app/src/main/assets/module-manifest.js"),"utf8");
const splitterSource=fs.readFileSync(path.join(repo,"app/src/main/assets/modules/plus-one-splitter.js"),"utf8");
const mergerSource=fs.readFileSync(path.join(repo,"app/src/main/assets/modules/plus-one-merger.js"),"utf8");
const visualSource=fs.readFileSync(path.join(repo,"app/src/main/assets/node-card-visuals.js"),"utf8");

if(!manifestSource.includes('[I.PLUS_ONE_SPLITTER]:row(I.PLUS_ONE_SPLITTER,"routing","#6ec7ff",["audioInput","audioOutput","clockFollower","clockSource"]'))throw new Error("splitter manifest still exposes MIDI");
if(splitterSource.includes('midiMessage')||splitterSource.includes('source.midi'))throw new Error("splitter still implements MIDI");
if(!mergerSource.includes('midiMessage')||!mergerSource.includes('emit?.("midi"'))throw new Error("merger does not forward MIDI");
if(!visualSource.includes('nodePort.midi')||!visualSource.includes('I.PLUS_ONE_SPLITTER'))throw new Error("splitter MIDI jack removal missing from node visuals");

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

// MIDI OUT deliberately supports direct fan-out.
{
  const source=add("source"),a=add("a"),b=add("b");
  E.connectNodes(E.moduleMidiOut(source),E.moduleMidiIn(a));
  E.connectNodes(E.moduleMidiOut(source),E.moduleMidiIn(b));
  const edges=E.graph().connections.filter(e=>e.type==="midi"&&e.from===E.moduleMidiOut(source));
  if(edges.length!==2)throw new Error("ordinary MIDI OUT did not retain two direct cables");
}
E.clear();

// MIDI IN remains one cable; merger owns explicit fan-in.
{
  const a=add("a"),b=add("b"),target=add("target");
  E.connectNodes(E.moduleMidiOut(a),E.moduleMidiIn(target));
  expectThrow(()=>E.connectNodes(E.moduleMidiOut(b),E.moduleMidiIn(target)),"+1 Merger");
}
E.clear();

// Splitter remains the explicit fan-out utility for Clock.
{
  const source=add("source"),split=add(ids.PLUS_ONE_SPLITTER),a=add("a"),b=add("b");
  E.connectNodes(E.moduleClockOut(source),E.moduleClockIn(split));
  E.connectNodes(E.moduleClockOut(split),E.moduleClockIn(a));
  E.connectNodes(E.moduleClockOut(split),E.moduleClockIn(b));
}
E.clear();

// Merger remains the explicit fan-in exception on MIDI and Clock.
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

console.log("routing utility smoke passed — MIDI OUT fans out directly; +1 Splitter is Carrier/Clock only; merger still owns fan-in");

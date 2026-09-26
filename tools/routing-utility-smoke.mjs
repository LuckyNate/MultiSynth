import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const engineSource=fs.readFileSync(path.join(repo,"app/src/main/assets/node-graph-engine.js"),"utf8");
const manifestSource=fs.readFileSync(path.join(repo,"app/src/main/assets/module-manifest.js"),"utf8");
const audioGraphSource=fs.readFileSync(path.join(repo,"app/src/main/assets/node-audio-graph.js"),"utf8");
const alchemySource=fs.readFileSync(path.join(repo,"app/src/main/assets/modules/alchemy-mixer.js"),"utf8");
const splitterSource=fs.readFileSync(path.join(repo,"app/src/main/assets/modules/plus-one-splitter.js"),"utf8");
const mergerSource=fs.readFileSync(path.join(repo,"app/src/main/assets/modules/plus-one-merger.js"),"utf8");

if(!manifestSource.includes('[I.PLUS_ONE_SPLITTER]:row(I.PLUS_ONE_SPLITTER,"routing","#6ec7ff",["audioInput","audioOutput"]'))throw new Error("splitter manifest is not Carrier-only");
if(!manifestSource.includes('[I.PLUS_ONE_MERGER]:row(I.PLUS_ONE_MERGER,"routing","#ffb86e",["audioInput","audioOutput"]'))throw new Error("merger manifest is not Carrier-only");
if(splitterSource.includes('midiMessage')||splitterSource.includes('source.midi')||splitterSource.includes('source.clock'))throw new Error("splitter still exposes non-Carrier routing");
if(mergerSource.includes('midiMessage')||mergerSource.includes('source.midi')||mergerSource.includes('source.clock'))throw new Error("merger still exposes non-Carrier routing");
if(!splitterSource.includes('LEVEL PER OUTPUT')||!splitterSource.includes('levels:{}'))throw new Error("splitter per-output level contract missing");
if(!mergerSource.includes('LEVEL PER INPUT')||!mergerSource.includes('levels:{}'))throw new Error("merger per-input level contract missing");
if(!audioGraphSource.includes('d.a.index!=null?ra?.user?.output?.(d.a.index):ra?.output'))throw new Error("audio graph does not resolve indexed splitter outputs");

// Alchemy Mixer is the local-speaker output path, while keeping a normal Carrier output
// available for explicit chaining to Bluetooth/car-audio/other destination gates.
if(!manifestSource.includes('destination:"local-speaker",chainableOutput:true'))throw new Error("Alchemy manifest does not declare local-speaker + chainable output routing");
if(!alchemySource.includes('physicalOutput:"local-speaker-only"')||!alchemySource.includes('carrierOutput:"chainable-for-additional-output-gates"'))throw new Error("Alchemy surface output contract missing");
if(!audioGraphSource.includes('g.modules.filter(m=>m.type===I()?.ALCHEMY_MIXER)'))throw new Error("Alchemy is not the explicit local collector source");
if(audioGraphSource.includes('g.modules.filter(m=>m.type===I()?.BLUETOOTH_OUTPUT)'))throw new Error("Bluetooth Output was incorrectly auto-connected to local speaker collector");

const ids={PLUS_ONE_SPLITTER:"plus-one-splitter",PLUS_ONE_MERGER:"plus-one-merger",canonicalId:v=>String(v||"")};
const contract={
  getDefinition(type){if(type===ids.PLUS_ONE_SPLITTER)return{displayName:type,defaults:{levels:{}},dynamicPorts:{carrierOut:"used-plus-one"}};if(type===ids.PLUS_ONE_MERGER)return{displayName:type,defaults:{levels:{}},dynamicPorts:{carrierIn:"used-plus-one"}};return{displayName:type,defaults:{},dynamicPorts:{}}},
  getSurface(){return null},update(){},destroy(){},createRuntime(){return{}},getRuntime(){return{}},
};
const context={console,JSON,Date,Math,Map,Set,structuredClone,MultiSynth:{ModuleContract:contract,ModuleIds:ids,StateKeys:{normalizePatch:(v)=>v}}};
context.window=context;context.globalThis=context;
vm.createContext(context);
vm.runInContext(engineSource,context,{filename:"node-graph-engine.js"});
const E=context.MultiSynth.NodeGraphEngine;
const add=t=>E.addModule(t);
const expectThrow=(fn,text)=>{let ok=false;try{fn()}catch(e){ok=String(e.message||e).includes(text)}if(!ok)throw new Error(`expected rejection containing ${text}`)};

// Ordinary MIDI remains direct fan-out and is not a +1 routing-module responsibility.
{
  const source=add("source"),a=add("a"),b=add("b");
  E.connectNodes(E.moduleMidiOut(source),E.moduleMidiIn(a));
  E.connectNodes(E.moduleMidiOut(source),E.moduleMidiIn(b));
  const edges=E.graph().connections.filter(e=>e.type==="midi"&&e.from===E.moduleMidiOut(source));
  if(edges.length!==2)throw new Error("ordinary MIDI OUT did not retain direct fan-out");
}
E.clear();

// +1 Splitter: one Carrier input, used-plus-one Carrier outputs, one persistent level per output.
{
  const source=add("source"),split=add(ids.PLUS_ONE_SPLITTER),a=add("a"),b=add("b");
  E.connectNodes(E.moduleOut(source),E.moduleIn(split));
  const e0=E.connectNodes(E.moduleOutput(split,0),E.moduleIn(a));
  E.connectNodes(E.moduleOutput(split,1),E.moduleIn(b));
  E.setModuleState(split,{levels:{0:.25,1:.75}});
  let s=E.getModule(split).state;
  if(s.levels[0]!==.25||s.levels[1]!==.75)throw new Error("splitter levels did not persist");
  E.disconnectNodes(e0);
  s=E.getModule(split).state;
  if(s.levels[0]!==.75||Object.keys(s.levels).length!==1)throw new Error("splitter level did not follow compacted output");
}
E.clear();

// +1 Merger: used-plus-one Carrier inputs, one Carrier output, one persistent level per input.
{
  const a=add("a"),b=add("b"),merge=add(ids.PLUS_ONE_MERGER),target=add("target");
  const e0=E.connectNodes(E.moduleOut(a),E.moduleInput(merge,0));
  E.connectNodes(E.moduleOut(b),E.moduleInput(merge,1));
  E.connectNodes(E.moduleOut(merge),E.moduleIn(target));
  E.setModuleState(merge,{levels:{0:.2,1:.8}});
  let s=E.getModule(merge).state;
  if(s.levels[0]!==.2||s.levels[1]!==.8)throw new Error("merger levels did not persist");
  E.disconnectNodes(e0);
  s=E.getModule(merge).state;
  if(s.levels[0]!==.8||Object.keys(s.levels).length!==1)throw new Error("merger level did not follow compacted input");
}
E.clear();

// Signal domains remain isolated at the graph level.
{
  const a=add("a"),b=add("b");
  expectThrow(()=>E.connectNodes(E.moduleMidiOut(a),E.moduleIn(b)),"cannot be crossed");
}

console.log("routing utility smoke passed — +1 Splitter/Merger are symmetric Carrier-only level routers; Alchemy local output contract retained");

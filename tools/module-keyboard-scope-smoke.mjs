import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const source=fs.readFileSync(path.join(repo,"app/src/main/assets/node-audio-graph.js"),"utf8");

class Param{constructor(v=0){this.value=v}setTargetAtTime(v){this.value=v}}
class Node{constructor(freq=0){this.frequency=new Param(freq);this.gain=new Param(1);this.threshold=new Param();this.ratio=new Param();this.knee=new Param();this.attack=new Param();this.release=new Param();this.fftSize=0}connect(n){return n}disconnect(){}}
class AudioContext{constructor(){this.state="running";this.currentTime=0;this.destination=new Node()}createGain(){return new Node()}createDynamicsCompressor(){return new Node()}createAnalyser(){return new Node()}resume(){return Promise.resolve()}}

const modules=[{id:"quad",type:"quadsynth",enabled:true},{id:"sampler",type:"whitman-sampler",enabled:true}];
const calls=[];
const panics=[];
const quadOsc=new Node(440),sampleOsc=new Node(220);
let clickRetuneHz=null;
const clickRepeater={frequency:440,source:new Node(),setFrequency(hz){clickRetuneHz=hz;this.frequency=hz;this.source=new Node();return this}};
const clickVoice={sources:[clickRepeater.source],mods:[],clickRepeater};
const runtimes=new Map([
  ["quad",{context:{currentTime:0},user:{voices:new Map([["60",{sources:[quadOsc],mods:[]}],["62",clickVoice]])}}],
  ["sampler",{context:{currentTime:0},user:{voices:new Map([["60",{sources:[sampleOsc],mods:[]} ]])}}]
]);
const MS={
  NodeGraphEngine:{graph:()=>({modules,connections:[]}),getModule:id=>modules.find(m=>m.id===id),on(){},createModuleRuntime:id=>runtimes.get(id),parseNode(){return null}},
  ModuleContract:{getRuntime:id=>runtimes.get(id),midi:(id,packet)=>{calls.push({id,packet});return true},panic:id=>{panics.push(id);return true},update(){return true}},
  ModuleManifest:{get:()=>({capabilities:["noteInput"]})},
  ModuleIds:{ALCHEMY_MIXER:"alchemy-mixer",PURE_SYNTH:"puresynth"}
};
const context={console,Math,Promise,Map,Set,WeakMap,URL,queueMicrotask,AudioContext,webkitAudioContext:AudioContext,location:{href:"file:///index.html"},MultiSynth:MS};
context.window=context;
vm.createContext(context);
vm.runInContext(source,context,{filename:"node-audio-graph.js"});
const A=context.MultiSynth.NodeAudioGraph;

A.noteOnTo("quad",60,101);
if(calls.length!==1||calls[0].id!=="quad"||calls[0].packet.status!==0x90)throw new Error("module-scoped Note On escaped its owning module");
calls.length=0;
A.noteOffTo("quad",60);
if(calls.length!==1||calls[0].id!=="quad"||calls[0].packet.status!==0x80)throw new Error("module-scoped Note Off escaped its owning module");
A.panicModule("quad");
if(panics.join(",")!=="quad")throw new Error("module-scoped panic escaped its owning module");
const sampleBefore=sampleOsc.frequency.value;
A.retuneModuleNote("quad",60,72);
if(quadOsc.frequency.value<=440)throw new Error("module-scoped retune did not reach owning module");
if(sampleOsc.frequency.value!==sampleBefore)throw new Error("module-scoped retune reached another instrument");
const oldClickSource=clickVoice.sources[0];
A.retuneModuleNote("quad",62,74);
if(Math.abs(clickRetuneHz-880)>.001)throw new Error("performance ribbon did not retune finite CLICK repeater by musical pitch ratio");
if(clickVoice.sources[0]===oldClickSource||clickVoice.sources[0]!==clickRepeater.source)throw new Error("performance ribbon did not adopt regenerated CLICK sample source");
calls.length=0;
A.noteOn(61,99);
if(calls.map(x=>x.id).sort().join(",")!=="quad,sampler")throw new Error("global MIDI Note On no longer broadcasts to enabled modules");

const scopedFiles=[
  "app/src/main/assets/quadsynth.html",
  "app/src/main/assets/puresynth.html",
  "app/src/main/assets/no-quarter.html",
  "app/src/main/assets/hook-and-ladder.html",
  "app/src/main/assets/grain-liqour-editor.js",
  "app/src/main/assets/modules/control-freak.js",
  "app/src/main/assets/rearranger-ui.js"
];
for(const rel of scopedFiles){
  const text=fs.readFileSync(path.join(repo,rel),"utf8");
  for(const required of ["noteOnTo?.(instance","noteOffTo?.(instance","retuneModuleNote?.(instance","panicModule?.(instance)"]){
    if(!text.includes(required))throw new Error(`${rel} keyboard missing scoped adapter: ${required}`);
  }
  if(/(?:PerformanceKeyboard|PK)\??\.mount\??\([^\n;]*\{audio:A\}/.test(text)||text.includes("K.mount(host,{audio:A})"))throw new Error(`${rel} keyboard still mounts the global broadcast audio API`);
}
const assets=path.join(repo,"app/src/main/assets");
for(const rel of fs.readdirSync(assets)){
  if(!/\.(?:html|js)$/.test(rel))continue;
  const text=fs.readFileSync(path.join(assets,rel),"utf8");
  if(text.includes("K.mount(host,{audio:A})")||text.includes("PerformanceKeyboard.mount(keyboardHost,{audio:A})")||text.includes("PK?.mount?.(keyboardHost,{audio:A})"))throw new Error(`${rel} contains an unscoped onboard performance keyboard`);
}
console.log("module keyboard scope: every onboard performance keyboard stays local to its owning module; global MIDI broadcast remains available only through explicit global APIs");

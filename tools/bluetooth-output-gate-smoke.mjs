import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const source=fs.readFileSync(path.join(repo,"app/src/main/assets/node-audio-graph.js"),"utf8");

class Param{constructor(v=0){this.value=v}setTargetAtTime(v){this.value=v}setValueAtTime(v){this.value=v}}
class Node{constructor(ctx){this.context=ctx;this.gain=new Param(1);this.threshold=new Param();this.ratio=new Param();this.fftSize=0}connect(n){return n}disconnect(){}}
class AudioContext{
  constructor(){this.state="running";this.currentTime=0;this.destination=new Node(this);this.gains=[]}
  createGain(){const n=new Node(this);this.gains.push(n);return n}
  createDynamicsCompressor(){return new Node(this)}
  createAnalyser(){return new Node(this)}
  resume(){return Promise.resolve()}
}

let route="local";
const src={id:"src",type:"quadsynth",enabled:true,state:{}};
const bt={id:"bt",type:"bluetooth-output",enabled:true,state:{}};
const car={id:"car",type:"tail-gator",enabled:true,state:{armed:false}};
let modules=[src];
let connections=[];
const runtimes=new Map([["src",{input:new Node(),output:new Node(),node:{}}],["bt",{input:new Node(),output:new Node(),node:{}}],["car",{input:new Node(),output:new Node(),node:{}}]]);
const listeners=[];
const MS={
  NodeGraphEngine:{
    graph:()=>({modules,connections}),
    getModule:id=>modules.find(m=>m.id===id),
    on:(name,fn)=>{if(name==="graph-changed")listeners.push(fn)},
    createModuleRuntime:id=>runtimes.get(id),
    parseNode:s=>{const [id,signal]=String(s).split(":");return{id,signal}}
  },
  ModuleContract:{getRuntime:id=>runtimes.get(id),update(){return true},midi(){return true},panic(){return true}},
  ModuleManifest:{get:()=>({capabilities:[]})},
  ModuleIds:{ALCHEMY_MIXER:"alchemy-mixer",PURE_SYNTH:"puresynth",BLUETOOTH_OUTPUT:"bluetooth-output",TAIL_GATOR:"tail-gator"}
};
const context={console,Math,Promise,Map,Set,WeakMap,URL,queueMicrotask,setInterval:()=>1,clearInterval(){},AudioContext,webkitAudioContext:AudioContext,location:{href:"file:///index.html"},LiveWireAndroid:{audioRouteKind:()=>route},MultiSynth:MS};
context.window=context;
vm.createContext(context);
vm.runInContext(source,context,{filename:"node-audio-graph.js"});
const A=context.MultiSynth.NodeAudioGraph;
A.start();
await Promise.resolve();
await Promise.resolve();
const master=A.context.gains[1];
const refresh=async()=>{A.rebuild();await Promise.resolve();await Promise.resolve()};
const expect=(value,label)=>{if(Math.abs(master.gain.value-value)>.000001)throw new Error(`${label}: expected master ${value}, got ${master.gain.value}`)};

route="local";await refresh();expect(1,"local route must play normally");
route="bluetooth";await refresh();expect(0,"Bluetooth leaked without Bluetooth Output module");
modules=[src,bt];connections=[{id:"a",type:"audio",from:"src:carrier",to:"bt:carrier"}];await refresh();expect(1,"connected Bluetooth Output module did not authorize Bluetooth");
route="bluetooth-car";await refresh();expect(0,"Bluetooth Output module incorrectly authorized a car");
modules=[src,car];connections=[{id:"b",type:"audio",from:"src:carrier",to:"car:carrier"}];car.state.armed=false;await refresh();expect(0,"disarmed Tail Gator authorized car output");
car.state.armed=true;await refresh();expect(1,"armed connected Tail Gator did not authorize car output");
route="bluetooth-unknown";await refresh();expect(1,"unknown Bluetooth route was not conservatively Tail Gator gated");
car.state.armed=false;await refresh();expect(0,"unknown Bluetooth route bypassed Tail Gator arm state");
modules=[src,bt];connections=[];route="bluetooth";await refresh();expect(0,"unpatched Bluetooth Output module authorized system Bluetooth");

console.log("bluetooth output gate: local is normal; general Bluetooth requires a connected Bluetooth Output module; cars and unknown Bluetooth require an armed connected Tail Gator");

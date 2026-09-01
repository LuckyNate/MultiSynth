import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const assets=path.join(repo,"app/src/main/assets");
const failures=[];
const fail=(scope,error)=>failures.push(`${scope}: ${error?.stack||error}`);

class Param{constructor(v=0){this.value=v}setTargetAtTime(v){this.value=v}setValueAtTime(v){this.value=v}linearRampToValueAtTime(v){this.value=v}exponentialRampToValueAtTime(v){this.value=v}cancelScheduledValues(){}cancelAndHoldAtTime(){}}
class AudioNode{constructor(){for(const k of ["gain","frequency","detune","delayTime","Q","playbackRate","pan","threshold","knee","ratio","attack","release","offset"])this[k]=new Param(k==="gain"||k==="playbackRate"?1:0);this.fftSize=1024;this.smoothingTimeConstant=0;this.type="sine";this.loop=false;this.buffer=null;this.curve=null;this.onended=null}connect(n){return n}disconnect(){}start(){}stop(){this.onended?.()}setPeriodicWave(){}getFloatTimeDomainData(a){a.fill(0)}}
class AudioBuffer{constructor(channels,length,sampleRate){this.numberOfChannels=channels;this.length=length;this.sampleRate=sampleRate;this.duration=length/sampleRate;this.data=Array.from({length:channels},()=>new Float32Array(length))}getChannelData(i){return this.data[i]}}
class AudioContext{constructor(){this.currentTime=0;this.sampleRate=48000;this.state="running";this.destination=new AudioNode()}createGain(){return new AudioNode()}createOscillator(){return new AudioNode()}createBiquadFilter(){return new AudioNode()}createDelay(){return new AudioNode()}createDynamicsCompressor(){return new AudioNode()}createAnalyser(){return new AudioNode()}createBuffer(c,l,r){return new AudioBuffer(c,l,r)}createBufferSource(){return new AudioNode()}createChannelMerger(){return new AudioNode()}createChannelSplitter(){return new AudioNode()}createWaveShaper(){return new AudioNode()}createStereoPanner(){return new AudioNode()}createConvolver(){return new AudioNode()}createConstantSource(){return new AudioNode()}createScriptProcessor(){const n=new AudioNode();n.onaudioprocess=null;return n}createPeriodicWave(){return {}}resume(){this.state="running";return Promise.resolve()}close(){return Promise.resolve()}}
class ClassList{constructor(){this.s=new Set()}add(...x){x.forEach(v=>this.s.add(v))}remove(...x){x.forEach(v=>this.s.delete(v))}toggle(v,on){if(on===undefined)on=!this.s.has(v);on?this.s.add(v):this.s.delete(v);return on}contains(v){return this.s.has(v)}}
class Style{setProperty(k,v){this[k]=v}}
class Element{constructor(tag="div"){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.style=new Style();this.classList=new ClassList();this.attributes={};this.textContent="";this.innerHTML="";this.value="";this.width=640;this.height=160;this.parentElement=null}append(...xs){xs.forEach(x=>this.appendChild(x))}appendChild(x){if(x){x.parentElement=this;this.children.push(x)}return x}prepend(x){if(x){x.parentElement=this;this.children.unshift(x)}return x}replaceChildren(...xs){this.children=[];this.append(...xs)}remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(x=>x!==this)}setAttribute(k,v){this.attributes[k]=String(v)}getAttribute(k){return this.attributes[k]}addEventListener(){}removeEventListener(){}setPointerCapture(){}releasePointerCapture(){}querySelector(){return null}querySelectorAll(){return []}closest(){return null}getBoundingClientRect(){return {left:0,top:0,width:160,height:80}}getContext(){return {fillStyle:"",strokeStyle:"",lineWidth:1,globalAlpha:1,shadowColor:"",shadowBlur:0,clearRect(){},fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){}}}}
const ids=new Map();
const document={head:new Element("head"),body:new Element("body"),documentElement:new Element("html"),hidden:false,styleSheets:[],createElement:t=>new Element(t),getElementById:id=>ids.get(id)||null,querySelector:()=>null,querySelectorAll:()=>[],write(){}};
const listeners=new Map();
const context={console,Math,JSON,Date,Number,String,Boolean,Array,Object,Map,Set,WeakMap,Promise,Float32Array,Uint8Array,Int32Array,URLSearchParams,AudioContext,webkitAudioContext:AudioContext,document,navigator:{vibrate(){}},location:{search:""},performance:{now:()=>0},devicePixelRatio:1,queueMicrotask,requestAnimationFrame:fn=>setTimeout(()=>fn(0),0),cancelAnimationFrame:clearTimeout,setTimeout,clearTimeout,setInterval,clearInterval,CustomEvent:class{constructor(type,o={}){this.type=type;this.detail=o.detail}},addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn)},removeEventListener(type,fn){listeners.get(type)?.delete(fn)},dispatchEvent(e){listeners.get(e.type)?.forEach(fn=>fn(e));return true},getComputedStyle:()=>({getPropertyValue:()=>"#9fe7ff"}),localStorage:{getItem(){return null},setItem(){},removeItem(){}},indexedDB:{open(){throw new Error("IndexedDB should not be touched during construction smoke")}}};
context.window=context;context.globalThis=context;context.parent=context;
vm.createContext(context);
function load(rel){const p=path.join(assets,rel);if(!fs.existsSync(p))throw new Error(`missing ${rel}`);vm.runInContext(fs.readFileSync(p,"utf8"),context,{filename:rel})}
const core=["module-ids.js","module-capabilities.js","module-boilerplate.js","state-keys.js","event-registry.js","control-descriptors.js","control-surface-library.js","control-surface-spec.js","module-builder-definitions.js","state-schema.js","module-manifest.js","module-builder-catalog.js","module-contract.js","native-mic.js","native-live-wire.js","clean-mic.js","pcm-library.js","grain-library.js","dsp-source-family.js"];
for(const f of core)try{load(f)}catch(e){fail(`load ${f}`,e)}
const MS=context.MultiSynth||{};
const catalog=Object.values(MS.ModuleIds?.CATALOG||{});
for(const rel of [...new Set(catalog.map(x=>x.moduleScript))])try{load(rel)}catch(e){fail(`load ${rel}`,e)}
for(const f of ["module-standards-audit.js","node-graph-engine.js","node-audio-graph.js","cv-bus.js","module-ui-primitives.js"])try{load(f)}catch(e){fail(`load ${f}`,e)}

try{if(!MS.ModuleStandards?.report?.ok)throw new Error(JSON.stringify(MS.ModuleStandards?.report?.errors||["standards audit unavailable"]));console.log(`standards: ${MS.ModuleStandards.report.checked} modules`)}catch(e){fail("module standards",e)}

const E=MS.NodeGraphEngine,C=MS.ModuleContract,A=MS.NodeAudioGraph,M=MS.ModuleManifest,B=MS.ModuleBuilderDefinitions;
const ctx=new AudioContext();
const native={mic:{},liveWire:{},midi:{},audio:{}};
const moduleIds=[];
for(const meta of M?.all||[]){try{const id=E.addModule(meta.id);moduleIds.push(id);const rt=E.createModuleRuntime(id,{audioContext:ctx,native,node:{hasUpstream:false}});C.update(id,{});const saved=C.serialize(id);C.restore(id,saved);if(meta.capabilities.includes("noteInput")){C.noteOn(id,60,100);C.noteOff(id,60);C.panic(id)}if(meta.capabilities.includes("clockSource")||meta.capabilities.includes("clockFollower")){C.clockStart(id,{time:0});C.clockTick(id,{time:0,substep:0});C.clockStop(id,{time:0})}if(meta.capabilities.includes("cvInput"))C.cv(id,{kind:"continuous",value:.5,time:0});if(meta.capabilities.includes("audioInput")&&!rt.input)throw new Error("audioInput module did not create input");if(meta.capabilities.includes("audioOutput")&&!rt.output)throw new Error("audioOutput module did not create output")}catch(e){fail(`module ${meta.id}`,e)}}
console.log(`runtime: ${moduleIds.length}/${M?.all?.length||0} modules constructed`);

try{const source=moduleIds.find(id=>M.get(E.getModule(id).type).capabilities.includes("audioOutput")),processor=moduleIds.find(id=>{const c=M.get(E.getModule(id).type).capabilities;return c.includes("audioInput")&&c.includes("audioOutput")&&id!==source});if(!source||!processor)throw new Error("missing graph smoke endpoints");const e1=E.connectNodes(E.moduleOut(source),E.moduleIn(processor));const e2=E.connectNodes(E.moduleOut(processor),E.mixerIn(0));E.setMixerChannel(0,{level:.75,mute:false,solo:false});const saved=E.serialize({smoke:true});E.disconnectNodes(e1);E.disconnectNodes(e2);E.restore(saved);if(E.graph().connections.length<2)throw new Error("graph restore lost connections");console.log("node graph: connect/disconnect/serialize/restore passed")}catch(e){fail("node graph",e)}

try{A.start();await Promise.resolve();await Promise.resolve();A.noteOn(60,100);A.noteOff(60);A.panic();A.setMaster(.8);if(!A.context||!A.collector||!A.masterAnalyser)throw new Error("audio graph outputs unavailable");console.log("sound engine: rebuild/note/master passed")}catch(e){fail("sound engine",e)}

try{MS.PerformanceKeyboard={mount:host=>({host})};const host=new Element("section"),ui=context.ModuleUI;if(!ui)throw new Error("ModuleUI unavailable");let count=0;for(const meta of M.all){const def=B.require(meta.id);for(const control of def.controls||[]){ui.renderControl(host,control,{state:{...C.getDefinition(meta.id).defaults},defaults:C.getDefinition(meta.id).defaults,patch(){},audio:A});count++}}for(const name of Object.keys(ui))if(typeof ui[name]!=="function")throw new Error(`control export ${name} is not callable`);console.log(`controls: ${count} declared controls rendered`)}catch(e){fail("controls",e)}

try{E.clear()}catch(e){fail("cleanup",e)}
if(failures.length){console.error("\nRUNTIME SMOKE FAILURES");for(const f of failures)console.error("- "+f);process.exit(1)}
console.log("runtime smoke passed");

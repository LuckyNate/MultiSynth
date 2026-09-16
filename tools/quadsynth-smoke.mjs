import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const assets=path.join(repo,"app/src/main/assets");
const defs=new Map();
let surface=null;

class Param{
  constructor(v=0){this.value=v}
  setTargetAtTime(v){this.value=v}
  setValueAtTime(v){this.value=v}
  linearRampToValueAtTime(v){this.value=v}
  exponentialRampToValueAtTime(v){this.value=v}
  cancelScheduledValues(){}
}
class Node{
  constructor(ctx){this.context=ctx;this.frequency=new Param(440);this.gain=new Param(1);this.Q=new Param();this.delayTime=new Param();this.threshold=new Param();this.knee=new Param();this.ratio=new Param();this.attack=new Param();this.release=new Param();this.stoppedAt=null;this.periodicWaveCount=0;this.buffer=null}
  connect(n){return n}
  disconnect(){}
  start(){}
  stop(t=0){this.stoppedAt=t}
  setPeriodicWave(){this.periodicWaveCount++}
}
class AudioContext{
  constructor(){this.currentTime=0;this.sampleRate=48000}
  createGain(){return new Node(this)}
  createOscillator(){return new Node(this)}
  createDynamicsCompressor(){return new Node(this)}
  createWaveShaper(){return new Node(this)}
  createBiquadFilter(){return new Node(this)}
  createDelay(){return new Node(this)}
  createPeriodicWave(){return {}}
  createBuffer(){return {getChannelData:()=>new Float32Array(128)}}
  createBufferSource(){return new Node(this)}
}
const ids={PURE_SYNTH:"puresynth",QUAD_SYNTH:"quadsynth",PULSYNTH:"pulsynth",SIN_LADDER:"sinladder",RAZORBACK:"razorback",STINGER:"stinger",NO_QUARTER:"no-quarter",themeFor:x=>x};
const prefabs={ADSR_DEFAULTS:{attack:.005,decay:.08,sustain:1,release:.08},adsr:()=>({kind:"prefab",id:"adsr",controls:[]}),performanceKeyboard:()=>({kind:"prefab",id:"keyboard",controls:[]})};
const S={
  oscillator:(ctx,type="sine",frequency=null)=>{const n=new Node(ctx);n.type=type;if(Number.isFinite(Number(frequency)))n.frequency.value=Number(frequency);return n},
  voiceEnvelope:(ctx,state)=>{const node=new Node(ctx);return{node,gateOn(){},gateOff(t=ctx.currentTime){node.gain.value=0;return t+Math.max(.001,Number(state.release)||.08)+.002},forceOff(t=ctx.currentTime){node.gain.value=0;return t},setState(next){state={...state,...next}}}},
  noise:(ctx)=>new Node(ctx),bufferSource:(ctx,buffer=null)=>{const n=new Node(ctx);n.buffer=buffer;return n},shapedBuffer:(_ctx,length,shape)=>({length,samples:Array.from({length},(_,i)=>shape(i,length))})
};
const contract={define:def=>defs.set(def.type,def),getDefinition:()=>({}),defineSurface:(_type,s)=>{surface=s}};
const context={console,Math,Number,String,Boolean,Array,Object,Map,Set,Float32Array,setTimeout,clearTimeout,window:null,MultiSynth:{ModuleIds:ids,ModuleContract:contract,ControlPrefabs:prefabs,DspSources:S}};
context.window=context;
vm.createContext(context);
const load=rel=>vm.runInContext(fs.readFileSync(path.join(assets,rel),"utf8"),context,{filename:rel});
load("modules/carrier-engine.js");
load("modules/quadsynth.js");

const def=defs.get(ids.QUAD_SYNTH);
if(!def)throw new Error("QuadSynth runtime definition missing");
if(!surface)throw new Error("QuadSynth surface missing");
if(surface.version!==5)throw new Error(`unexpected QuadSynth surface version ${surface.version}`);
const buttons=surface.controls.filter(x=>x?.control==="button"&&x?.state==="selectedEngine");
if(buttons.length!==4)throw new Error(`expected 4 engine selectors, got ${buttons.length}`);
const engineValues=buttons.map(x=>x.value?.value).join(",");
if(engineValues!=="click,sine,triangle,square")throw new Error(`wrong engine set: ${engineValues}`);
const shape=surface.controls.find(x=>x?.id==="shape");
if(!shape||shape.meta?.contextState!=="selectedEngine")throw new Error("SHAPE is not bound to selectedEngine context");
const expected={click:"clickAcceleration",sine:"sinePhase",triangle:"trianglePeak",square:"squareDuty"};
for(const [engine,state] of Object.entries(expected))if(shape.meta?.contexts?.[engine]?.state!==state)throw new Error(`${engine} SHAPE binding is not ${state}`);
for(const forbidden of ["carrier","level","clickLevel","sineLevel","sawLevel","squareLevel","clickOctave","clickTune","clickPhase","clickMute","clickSolo"]){if(surface.controls.some(x=>x?.id===forbidden))throw new Error(`obsolete QuadSynth control remains: ${forbidden}`)}

const ctx=new AudioContext();
const state={...def.defaults,selectedEngine:"triangle"};
let input=null,output=null;
const user=def.create({context:ctx,state,setInput:n=>input=n,setOutput:n=>output=n});
const runtime={type:ids.QUAD_SYNTH,user,node:{hasUpstream:false}};
if(!input||!output)throw new Error("QuadSynth runtime endpoints missing");
def.noteOn({runtime,state},60,100);
const voice=user.voices.get("60");
if(!voice)throw new Error("QuadSynth Note On did not create a voice");
if(voice.sources.length!==1)throw new Error(`QuadSynth must create exactly one selected engine, got ${voice.sources.length}`);
if(voice.quadEngine!=="triangle"||voice.sources[0].__msQuadEngine!=="triangle")throw new Error("selected TRIANGLE engine was not used");
const source=voice.sources[0];
def.noteOff({runtime,state},60);
if(user.voices.has("60"))throw new Error("QuadSynth Note Off left the voice registered");
if(source.stoppedAt==null)throw new Error("QuadSynth Note Off did not stop the oscillator source");

state.selectedEngine="square";
def.noteOn({runtime,state},61,100);
const square=user.voices.get("61");
if(square?.quadEngine!=="square")throw new Error("SQUARE context did not select square engine");
const waveUpdates=square.sources[0].periodicWaveCount;
state.squareDuty=23;
def.setState({runtime,state});
if(square.sources[0].periodicWaveCount<=waveUpdates)throw new Error("SQUARE duty SHAPE did not update the active waveform");
def.noteOff({runtime,state},61);

state.selectedEngine="click";
state.clickAcceleration=88;
def.noteOn({runtime,state},62,100);
const click=user.voices.get("62");
if(click?.quadEngine!=="click")throw new Error("CLICK context did not select click engine");
const clickSource=click.sources[0],clickRepeater=click.clickRepeater;
if(!clickRepeater)throw new Error("CLICK engine did not create a finite-click repeater");
if(clickSource.periodicWaveCount!==0)throw new Error("CLICK engine still uses a PeriodicWave shortcut");
if(clickSource.__msQuadClickModel!=="finite-click-delay-repeater")throw new Error("CLICK engine is not literal finite repeated samples");
if(!clickSource.buffer||!(clickSource.buffer.length>0))throw new Error("CLICK source does not contain a finite sample buffer");
if("__msQuadClickOverlapCount" in clickSource)throw new Error("CLICK engine still contains artificial overlap-count logic");
if(clickSource.__msQuadClickAcceleration!==88)throw new Error("CLICK acceleration was not applied to the finite click sample");
const expectedHz=440*Math.pow(2,(62-69)/12),period=1/expectedHz,step=.05*period,maxDuration=2.5*period;
if(Math.abs(clickSource.__msQuadClickRateHz-expectedHz)>.001)throw new Error("CLICK trigger rate is not the played note frequency in Hz");
if(Math.abs(clickRepeater.delay.delayTime.value-period)>.000001)throw new Error("CLICK repeat interval is not 1 / note Hz");
if(clickRepeater.feedback.gain.value!==1)throw new Error("CLICK finite sample repeater is not sustaining literal delayed copies");
const highAccelerationDuration=clickSource.__msQuadClickDuration;
if(highAccelerationDuration>maxDuration+.000001)throw new Error("CLICK finite ramp exceeded the 2.50-period maximum");
if(Math.abs(highAccelerationDuration/step-Math.round(highAccelerationDuration/step))>.000001)throw new Error("CLICK finite ramp is not quantized in 0.05-period increments");
state.clickAcceleration=35;
def.setState({runtime,state});
const reshapedSource=click.sources[0],reshapedRepeater=click.clickRepeater;
if(reshapedSource===clickSource)throw new Error("CLICK SHAPE did not replace the finite click sample");
if(clickRepeater.feedback.gain.value!==0)throw new Error("CLICK SHAPE left the old finite click train running");
if(reshapedSource.periodicWaveCount!==0)throw new Error("CLICK SHAPE regressed to PeriodicWave");
if(reshapedSource.__msQuadClickAcceleration!==35)throw new Error("CLICK finite sample did not retain the new acceleration value");
if(reshapedSource.__msQuadClickModel!=="finite-click-delay-repeater")throw new Error("CLICK SHAPE changed the finite sample trigger model");
if(reshapedSource.__msQuadClickDuration<highAccelerationDuration-.000001)throw new Error("CLICK lower acceleration unexpectedly shortened the finite ramp");
if(reshapedSource.__msQuadClickDuration>maxDuration+.000001)throw new Error("CLICK lower acceleration exceeded the 2.50-period maximum");
if(Math.abs(reshapedSource.__msQuadClickDuration/step-Math.round(reshapedSource.__msQuadClickDuration/step))>.000001)throw new Error("CLICK reshaped ramp is not quantized in 0.05-period increments");
if(Math.abs(reshapedSource.__msQuadClickRateHz-expectedHz)>.001)throw new Error("CLICK SHAPE changed trigger Hz instead of only shaping the click");
if(Math.abs(reshapedRepeater.delay.delayTime.value-period)>.000001)throw new Error("CLICK SHAPE changed the repeat interval");
def.noteOff({runtime,state},62);
if(reshapedRepeater.feedback.gain.value!==0)throw new Error("CLICK Note Off did not stop the finite click repeater");
if(reshapedSource.stoppedAt==null)throw new Error("CLICK Note Off did not stop the finite click source");

console.log("quadsynth: four engines, contextual SHAPE, literal finite bipolar click samples using 0.05-period duration steps capped at 2.50 periods, repeated at note Hz with natural overlap, active shape update, and Note Off release passed");

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
  constructor(ctx){this.context=ctx;this.frequency=new Param(440);this.gain=new Param(1);this.playbackRate=new Param(1);this.Q=new Param();this.delayTime=new Param();this.threshold=new Param();this.knee=new Param();this.ratio=new Param();this.attack=new Param();this.release=new Param();this.stoppedAt=null;this.periodicWaveCount=0;this.periodicWave=null;this.buffer=null}
  connect(n){return n}
  disconnect(){}
  start(){}
  stop(t=0){this.stoppedAt=t}
  setPeriodicWave(w){this.periodicWaveCount++;this.periodicWave=w}
}
class AudioContext{
  constructor(){this.currentTime=0;this.sampleRate=48000}
  createGain(){return new Node(this)}
  createOscillator(){return new Node(this)}
  createDynamicsCompressor(){return new Node(this)}
  createWaveShaper(){return new Node(this)}
  createBiquadFilter(){return new Node(this)}
  createDelay(){return new Node(this)}
  createPeriodicWave(real,imag,options){return {real:Array.from(real||[]),imag:Array.from(imag||[]),options}}
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
const carrierRel="modules/carrier-engine.js";
const carrierSource=fs.readFileSync(path.join(assets,carrierRel),"utf8").replace(/\}\)\(window\);\s*$/,`window.__quadShapeTest={quadTickRamp,quadClickAmplitude,quadClickZeroCrossing,quadTwinAmplitude,quadClickSamplePhase,quadTwinSamplePhase};})(window);`);
vm.runInContext(carrierSource,context,{filename:carrierRel});
load("modules/quadsynth.js");
const quad=context.__quadShapeTest;
if(!quad)throw new Error("QuadSynth source shape test hooks unavailable");

const def=defs.get(ids.QUAD_SYNTH);
if(!def)throw new Error("QuadSynth runtime definition missing");
if(!surface)throw new Error("QuadSynth surface missing");
if(surface.version!==5)throw new Error(`unexpected QuadSynth surface version ${surface.version}`);
const buttons=surface.controls.filter(x=>x?.control==="button"&&x?.state==="selectedEngine");
if(buttons.length!==5)throw new Error(`expected 5 engine selectors including TWIN, got ${buttons.length}`);
const engineValues=buttons.map(x=>x.value?.value).join(",");
if(engineValues!=="click,twin,sine,triangle,square")throw new Error(`wrong engine set: ${engineValues}`);
const shape=surface.controls.find(x=>x?.id==="shape");
if(!shape||shape.meta?.contextState!=="selectedEngine")throw new Error("SHAPE is not bound to selectedEngine context");
const expected={click:"clickAcceleration",twin:"clickAcceleration",sine:"sinePhase",triangle:"trianglePeak",square:"squareDuty"};
for(const [engine,state] of Object.entries(expected))if(shape.meta?.contexts?.[engine]?.state!==state)throw new Error(`${engine} SHAPE binding is not ${state}`);
for(const forbidden of ["carrier","level","clickLevel","sineLevel","sawLevel","squareLevel","clickOctave","clickTune","clickPhase","clickMute","clickSolo"]){if(surface.controls.some(x=>x?.id===forbidden))throw new Error(`obsolete QuadSynth control remains: ${forbidden}`)}

const reconstruct=(wave,t)=>{let y=0;for(let n=1;n<wave.real.length;n++){const a=t*Math.PI*2*n;y+=(wave.real[n]||0)*Math.cos(a)+(wave.imag[n]||0)*Math.sin(a)}return y};
const waveArea=wave=>{const samples=1024;let sum=0;for(let i=0;i<samples;i++)sum+=Math.abs(reconstruct(wave,(i+.5)/samples));return sum/samples};
const sourceArea=(sample,shape)=>{const samples=4096;let sum=0;for(let i=0;i<samples;i++)sum+=Math.abs(sample((i+.5)/samples,shape));return sum/samples};
const near=(actual,expected,tolerance,label)=>{if(Math.abs(actual-expected)>tolerance)throw new Error(`${label}: expected ${expected}, got ${actual}`)};

near(quad.quadTickRamp(0,0),0,1e-12,"base ramp shape0 start");
near(quad.quadTickRamp(2,0),2,1e-12,"base ramp shape0 end");
near(quad.quadClickAmplitude(0,0),-1,1e-12,"CLICK ramp shape0 start");
near(quad.quadClickAmplitude(2,0),1,1e-12,"CLICK ramp shape0 end");
near(quad.quadClickAmplitude(quad.quadClickZeroCrossing(0),0),0,1e-12,"CLICK shape0 actual split crossing");
near(quad.quadClickSamplePhase(.25,0),-1,1e-12,"CLICK shape0 negative endpoint");
near(quad.quadClickSamplePhase(.5,0),0,1e-12,"CLICK shape0 zero crossing");
near(quad.quadClickSamplePhase(.75,0),1,1e-12,"CLICK shape0 positive endpoint");
if(!(quad.quadClickSamplePhase(.125,0)<-.85))throw new Error("CLICK shape0 must dwell near -1 before the steep transition");
if(!(quad.quadClickSamplePhase(.125,100)>quad.quadClickSamplePhase(.125,0)+.15))throw new Error("CLICK increasing SHAPE must broaden the negative ramp away from its shape0 -1 dwell");
const sourceClickArea0=sourceArea(quad.quadClickSamplePhase,0),sourceClickArea100=sourceArea(quad.quadClickSamplePhase,100);
if(!(sourceClickArea100>sourceClickArea0+.01))throw new Error(`CLICK SHAPE must increase source tick area: shape0=${sourceClickArea0.toFixed(4)} shape100=${sourceClickArea100.toFixed(4)}`);

near(quad.quadTwinAmplitude(0,0),0,1e-12,"TWIN divided ramp shape0 start");
near(quad.quadTwinAmplitude(2,0),1,1e-12,"TWIN divided ramp shape0 end");
near(quad.quadTwinSamplePhase(.25,0),-1,1e-12,"TWIN shape0 negative endpoint");
near(quad.quadTwinSamplePhase(.5,0),0,1e-12,"TWIN shape0 reflected zero crossing");
near(quad.quadTwinSamplePhase(.75,0),1,1e-12,"TWIN shape0 positive endpoint");
if(!(Math.abs(quad.quadTwinSamplePhase(.125,0))<.15&&Math.abs(quad.quadTwinSamplePhase(.625,0))<.15))throw new Error("TWIN shape0 must keep the full reflected ramps thin away from the extrema");
if(!(Math.abs(quad.quadTwinSamplePhase(.125,100))>Math.abs(quad.quadTwinSamplePhase(.125,0))+.15))throw new Error("TWIN increasing SHAPE must broaden the reflected full ramp");
const sourceTwinArea0=sourceArea(quad.quadTwinSamplePhase,0),sourceTwinArea100=sourceArea(quad.quadTwinSamplePhase,100);
if(!(sourceTwinArea100>sourceTwinArea0+.01))throw new Error(`TWIN SHAPE must increase source tick area: shape0=${sourceTwinArea0.toFixed(4)} shape100=${sourceTwinArea100.toFixed(4)}`);

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
state.clickAcceleration=0;
def.noteOn({runtime,state},62,100);
const click=user.voices.get("62");
if(click?.quadEngine!=="click")throw new Error("CLICK context did not select click engine");
const clickSource=click.sources[0];
if(click.clickRepeater)throw new Error("CLICK still creates the retired trigger/repeater path");
if(clickSource.buffer)throw new Error("CLICK still uses a finite sample buffer");
if(clickSource.__msQuadShapeModel!=="click-split-ramp-periodic")throw new Error("CLICK is not the rebuilt split-ramp periodic voice");
if(clickSource.__msQuadShapeAcceleration!==0)throw new Error("CLICK zero SHAPE was not applied");
if(clickSource.periodicWaveCount!==1||!clickSource.periodicWave)throw new Error("CLICK did not create a real PeriodicWave oscillator");
const expectedHz=440*Math.pow(2,(62-69)/12);
if(Math.abs(clickSource.frequency.value-expectedHz)>.001)throw new Error("CLICK oscillator frequency is not the played note frequency");
const zeroReal=clickSource.periodicWave.real.slice(),zeroImag=clickSource.periodicWave.imag.slice(),zeroClickArea=waveArea(clickSource.periodicWave);
if(zeroReal.length<100||zeroImag.length!==zeroReal.length)throw new Error("CLICK periodic waveform lacks harmonic content");
if(!zeroReal.some((v,i)=>i>0&&Math.abs(v)>.000001)&&!zeroImag.some((v,i)=>i>0&&Math.abs(v)>.000001))throw new Error("CLICK periodic waveform is silent");
state.clickAcceleration=100;
def.setState({runtime,state});
if(click.sources[0]!==clickSource)throw new Error("CLICK SHAPE replaced the oscillator instead of reshaping it");
if(clickSource.__msQuadShapeAcceleration!==100)throw new Error("CLICK full SHAPE was not retained");
if(clickSource.periodicWaveCount<2)throw new Error("CLICK SHAPE did not rebuild the periodic waveform");
const fullWave=clickSource.periodicWave,fullClickArea=waveArea(fullWave);
const changed=fullWave.real.some((v,i)=>Math.abs(v-(zeroReal[i]||0))>.000001)||fullWave.imag.some((v,i)=>Math.abs(v-(zeroImag[i]||0))>.000001);
if(!changed)throw new Error("CLICK SHAPE does not change the periodic waveform");
if(!(fullClickArea>zeroClickArea+.01))throw new Error(`CLICK band-limited waveform must preserve increasing area trend: shape0=${zeroClickArea.toFixed(4)} shape100=${fullClickArea.toFixed(4)}`);
state.pitchBend=1;
def.setState({runtime,state});
const retunedHz=440*Math.pow(2,(63-69)/12);
if(click.sources[0]!==clickSource)throw new Error("CLICK pitch bend replaced the oscillator");
if(Math.abs(clickSource.frequency.value-retunedHz)>.001)throw new Error("CLICK pitch bend did not retune the oscillator frequency");
def.noteOff({runtime,state},62);
if(clickSource.stoppedAt==null)throw new Error("CLICK Note Off did not stop the periodic oscillator");

state.pitchBend=0;
state.selectedEngine="twin";
state.clickAcceleration=0;
def.noteOn({runtime,state},63,100);
const twin=user.voices.get("63");
if(twin?.quadEngine!=="twin")throw new Error("TWIN context did not select twin engine");
const twinSource=twin.sources[0];
if(twin.clickRepeater)throw new Error("TWIN still creates the retired trigger/repeater path");
if(twinSource.buffer)throw new Error("TWIN still uses a finite sample buffer");
if(twinSource.__msQuadShapeModel!=="twin-reflected-ramp-periodic")throw new Error("TWIN is not the rebuilt reflected-ramp periodic voice");
if(twinSource.__msQuadShapeAcceleration!==0)throw new Error("TWIN zero SHAPE was not applied");
if(twinSource.periodicWaveCount!==1||!twinSource.periodicWave)throw new Error("TWIN did not create a real PeriodicWave oscillator");
const zeroTwinArea=waveArea(twinSource.periodicWave);
state.clickAcceleration=100;
def.setState({runtime,state});
if(twin.sources[0]!==twinSource)throw new Error("TWIN SHAPE replaced the oscillator instead of reshaping it");
if(twinSource.__msQuadShapeAcceleration!==100)throw new Error("TWIN full SHAPE was not retained");
if(twinSource.periodicWaveCount<2)throw new Error("TWIN SHAPE did not rebuild the periodic waveform");
const twinWave=twinSource.periodicWave,fullTwinArea=waveArea(twinWave);
if(!(fullTwinArea>zeroTwinArea+.01))throw new Error(`TWIN band-limited waveform must preserve increasing area trend: shape0=${zeroTwinArea.toFixed(4)} shape100=${fullTwinArea.toFixed(4)}`);
const differsFromClick=twinWave.real.some((v,i)=>Math.abs(v-(fullWave.real[i]||0))>.000001)||twinWave.imag.some((v,i)=>Math.abs(v-(fullWave.imag[i]||0))>.000001);
if(!differsFromClick)throw new Error("TWIN and CLICK collapsed to the same periodic waveform");
def.noteOff({runtime,state},63);
if(twinSource.stoppedAt==null)throw new Error("TWIN Note Off did not stop the periodic oscillator");

console.log("quadsynth: source ramp geometry passes exact CLICK/TWIN spec; PeriodicWave runtime remains continuous, note-pitched, non-silent, shape-responsive, and preserves the increasing-area trend without treating finite harmonic reconstruction as the source equation");
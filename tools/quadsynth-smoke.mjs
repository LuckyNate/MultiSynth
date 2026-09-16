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
  constructor(ctx){this.context=ctx;this.frequency=new Param(440);this.gain=new Param(1);this.playbackRate=new Param(1);this.Q=new Param();this.delayTime=new Param();this.threshold=new Param();this.knee=new Param();this.ratio=new Param();this.attack=new Param();this.release=new Param();this.stoppedAt=null;this.periodicWaveCount=0;this.buffer=null}
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
state.clickAcceleration=0;
def.noteOn({runtime,state},62,100);
const click=user.voices.get("62");
if(click?.quadEngine!=="click")throw new Error("CLICK context did not select click engine");
const clickSource=click.sources[0],clickRepeater=click.clickRepeater;
if(!clickRepeater)throw new Error("CLICK engine did not create a finite-click repeater");
if(clickSource.periodicWaveCount!==0)throw new Error("CLICK engine still uses a PeriodicWave shortcut");
if(clickSource.__msQuadClickModel!=="normalized-4096-click-delay-repeater")throw new Error("CLICK engine is not using the normalized 4096-sample kernel");
if(clickSource.buffer?.length!==4096||clickSource.__msQuadClickResolution!==4096)throw new Error("CLICK kernel is not fixed at 4096 samples");
if("__msQuadClickOverlapCount" in clickSource)throw new Error("CLICK engine still contains artificial overlap-count logic");
if(clickSource.__msQuadClickAcceleration!==0)throw new Error("CLICK zero SHAPE was not applied");
const expectedHz=440*Math.pow(2,(62-69)/12),period=1/expectedHz,duration=.0015,ratio=duration/period,baseDuration=4096/ctx.sampleRate,expectedPlaybackRate=baseDuration/duration;
if(Math.abs(clickSource.__msQuadClickRateHz-expectedHz)>.001)throw new Error("CLICK trigger rate is not the played note frequency in Hz");
if(Math.abs(clickRepeater.delay.delayTime.value-period)>.000001)throw new Error("CLICK repeat interval is not 1 / note Hz");
if(clickRepeater.feedback.gain.value!==1)throw new Error("CLICK finite sample repeater is not sustaining literal delayed copies");
if(Math.abs(clickSource.__msQuadClickDuration-duration)>.000001)throw new Error("CLICK SHAPE 0 does not produce the shortest absolute finite click");
if(Math.abs(clickSource.__msQuadClickRatio-ratio)>.000001)throw new Error("CLICK overlap ratio is not derived from absolute click duration versus note period");
if(Math.abs(clickSource.playbackRate.value-expectedPlaybackRate)>.000001)throw new Error("CLICK normalized kernel playback rate does not produce the finite click duration");
const zeroSamples=clickSource.buffer.samples,min0=Math.min(...zeroSamples),max0=Math.max(...zeroSamples);
if(min0>-.999||max0<.999)throw new Error("shortest CLICK does not still reach full -1/+1 amplitude");
if(Math.abs(zeroSamples[0])>.000001||Math.abs(zeroSamples.at(-1))>.000001)throw new Error("CLICK finite event does not begin and end at zero");
const zeroShapeBuffer=clickSource.buffer;
state.clickAcceleration=100;
def.setState({runtime,state});
const shapedSource=click.sources[0],shapedRepeater=click.clickRepeater;
if(shapedSource===clickSource)throw new Error("CLICK SHAPE did not replace the finite click source");
if(clickRepeater.feedback.gain.value!==0)throw new Error("CLICK SHAPE left the old finite click train running");
if(shapedSource.buffer===zeroShapeBuffer)throw new Error("CLICK SHAPE did not generate a fresh normalized sample");
if(shapedSource.buffer?.length!==4096)throw new Error("CLICK SHAPE changed the 4096-sample kernel resolution");
if(shapedSource.__msQuadClickAcceleration!==100)throw new Error("CLICK full SHAPE was not retained");
const fullDuration=.048,fullRatio=fullDuration/period;
if(Math.abs(shapedSource.__msQuadClickDuration-fullDuration)>.000001)throw new Error("CLICK SHAPE duration is not derived independently of note Hz");
if(Math.abs(shapedSource.__msQuadClickRatio-fullRatio)>.000001)throw new Error("CLICK full SHAPE overlap is not the natural duration/period interaction");
if(Math.abs(shapedRepeater.delay.delayTime.value-period)>.000001)throw new Error("CLICK SHAPE changed the note trigger interval");
const fullSamples=shapedSource.buffer.samples,min1=Math.min(...fullSamples),max1=Math.max(...fullSamples);
if(min1>-.999||max1<.999)throw new Error("full SHAPE CLICK does not reach full -1/+1 amplitude");
const power=8,zero=Math.pow(.5,1/power),downEnd=zero/2,upEnd=(zero+1)/2,last=fullSamples.length-1,downIndex=Math.round(downEnd*last),peakIndex=Math.round(upEnd*last);
if(Math.abs(fullSamples[downIndex]+1)>.006)throw new Error("CLICK lower half does not arrive at -1 at the master-ramp split");
if(Math.abs(fullSamples[peakIndex]-1)>.006)throw new Error("CLICK full ramp does not arrive at +1 at the master-ramp split");
const leftPeak=fullSamples[peakIndex]-fullSamples[peakIndex-1],rightPeak=fullSamples[peakIndex+1]-fullSamples[peakIndex];
if(!(leftPeak>0&&rightPeak<0))throw new Error("CLICK +1 peak is rounded instead of a pointed direction reversal");
const startSlope=fullSamples[1]-fullSamples[0],endSlope=fullSamples[last]-fullSamples[last-1];
if(!(startSlope<0&&endSlope<0))throw new Error("CLICK adjoining down-ramp halves are not both descending through zero");
if(Math.abs(startSlope-endSlope)>Math.max(.00002,Math.abs(startSlope)*.08))throw new Error("CLICK down-ramp halves do not share the same slope at the zero join");
const preRetuneSource=click.sources[0],preRetuneBuffer=preRetuneSource.buffer,preRetuneFeedback=shapedRepeater.feedback,preRetuneDuration=shapedRepeater.duration,preRetunePlayback=preRetuneSource.playbackRate.value,preRetuneRatio=shapedRepeater.ratio;
state.pitchBend=1;
def.setState({runtime,state});
const retunedSource=click.sources[0],retunedRepeater=click.clickRepeater,retunedHz=440*Math.pow(2,(63-69)/12);
if(retunedSource===preRetuneSource)throw new Error("CLICK pitch change did not restart the trigger train");
if(retunedSource.buffer!==preRetuneBuffer)throw new Error("CLICK pitch change changed waveform data");
if(preRetuneFeedback.gain.value!==0)throw new Error("CLICK pitch change left the old finite sample train running");
if(Math.abs(retunedRepeater.frequency-retunedHz)>.001)throw new Error("CLICK retune did not follow pitch Hz");
if(Math.abs(retunedRepeater.delay.delayTime.value-1/retunedHz)>.000001)throw new Error("CLICK retuned trigger interval does not follow pitch Hz");
if(Math.abs(retunedRepeater.duration-preRetuneDuration)>.000001)throw new Error("CLICK pitch retune changed the independently generated click duration");
if(Math.abs(retunedSource.playbackRate.value-preRetunePlayback)>.000001)throw new Error("CLICK pitch retune changed finite click playback speed");
if(Math.abs(retunedRepeater.ratio-preRetuneRatio*retunedHz/expectedHz)>.000001)throw new Error("CLICK overlap ratio did not change naturally with note frequency");
if(retunedSource.buffer?.length!==4096)throw new Error("CLICK pitch retune changed normalized kernel resolution");
def.noteOff({runtime,state},62);
if(retunedRepeater.feedback.gain.value!==0)throw new Error("CLICK Note Off did not stop the finite click repeater");
if(retunedSource.stoppedAt==null)throw new Error("CLICK Note Off did not stop the finite click source");

console.log("quadsynth: CLICK uses one master ramp split at its true zero crossing, with pointed +1 reversal and matching down-ramp slope across end-to-end joins; duration remains independent of note Hz so gap/join/overlap emerge naturally");

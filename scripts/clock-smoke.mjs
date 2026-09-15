import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const read=path=>fs.readFileSync(path,"utf8");
const worklet=read("app/src/main/assets/worklets/multisynth-clock-processor.js");
const transportSource=read("app/src/main/assets/patch-transport.js");
const clockStandard=read("app/src/main/assets/clock-standard.js");
const graph=read("app/src/main/assets/node-audio-graph.js");
const midi=read("app/src/main/assets/native-midi.js");
const cvBus=read("app/src/main/assets/cv-bus.js");
const manifest=read("app/src/main/assets/module-manifest.js");
const father=read("app/src/main/assets/modules/father-time.js");
const whitman=read("app/src/main/assets/modules/whitman-sampler.js");
const timeBandits=read("app/src/main/assets/modules/time-bandits.js");
const randrone=read("app/src/main/assets/modules/randrone.js");

assert.match(worklet,/class MultiSynthClockProcessor extends AudioWorkletProcessor/);
assert.match(worklet,/currentFrame/);
assert.match(worklet,/sampleRate/);
assert.match(worklet,/type:\s*"timebase"/);
assert.doesNotMatch(worklet,/bpm|running|horizon|setTimeout|setInterval/);

assert.match(transportSource,/CLOCK:0xf8/);
assert.match(transportSource,/START:0xfa/);
assert.match(transportSource,/CONTINUE:0xfb/);
assert.match(transportSource,/STOP:0xfc/);
assert.match(transportSource,/receiveMidi/);
assert.match(transportSource,/ppqn:24/);
assert.doesNotMatch(transportSource,/horizon/);

assert.match(clockStandard,/PatchTransport/);
assert.match(clockStandard,/subscribeTick/);
assert.match(clockStandard,/subscribeMidi/);
assert.doesNotMatch(clockStandard,/external=true|setClockBpm|startClock|subscribeClock|clockStart|clockTick|clockStop/);

assert.match(graph,/new AudioWorkletNode\(ctx,"multisynth-clock-processor"/);
assert.match(graph,/PatchTransport\?\.ingestTimebase/);
assert.doesNotMatch(graph,/subscribeClock|setClockBpm|startClock|stopClock/);

assert.match(midi,/T\.receiveMidi\(status/);
assert.match(midi,/sendNative\(0xf8/);
assert.match(midi,/sendNative\(0xfa/);
assert.match(midi,/sendNative\(0xfb/);
assert.match(midi,/sendNative\(0xfc/);
assert.doesNotMatch(midi,/midiClockPulses|setFatherTimeSlaved|clockBpm/);

assert.match(cvBus,/receiveMidi/);
assert.doesNotMatch(cvBus,/clockTargets|walkClock|clockSourceFor|\.clockTick\(/);
assert.match(father,/midiStatus:0xf8/);
assert.match(father,/subscribeMidi/);
assert.doesNotMatch(father,/clockTick|clockStart|clockStop|hasClockUpstream/);
assert.doesNotMatch(whitman,/cvTrigger|clockTick|clockStart|clockStop|CvBus\?\.send/);
assert.doesNotMatch(timeBandits,/clockTick|clockStart|clockStop|CvBus\?\.send/);
assert.match(randrone,/PatchTransport\?\.subscribeTick/);
assert.doesNotMatch(randrone,/clockTick|setTimeout\(\(\)=>schedule/);
assert.match(manifest,/\[I\.FATHER_TIME\].*\["clockSource","clockFollower"/s);
assert.doesNotMatch(manifest,/\[I\.WHITMAN_SAMPLER\].*"clockSource"/);
assert.doesNotMatch(manifest,/\[I\.TIME_BANDITS\].*"clockSource"/);

const context={console,MultiSynth:{},setTimeout,clearTimeout,performance:{now:()=>0}};
context.window=context;
vm.createContext(context);
vm.runInContext(transportSource,context,{filename:"patch-transport.js"});
const T=context.MultiSynth.PatchTransport;
const internalTicks=[],internalPulses=[],midiEvents=[];
T.subscribeTick(t=>internalTicks.push({...t}));
T.subscribePulse(p=>internalPulses.push({...p}));
T.subscribeMidi(e=>midiEvents.push({...e}));
T.setBpm(120);
for(let frame=0;frame<=12288;frame+=128)T.ingestTimebase({frame,time:frame/48000,sampleRate:48000});
assert.equal(internalPulses.length,12,"120 BPM should produce twelve real MIDI clock pulses in 0.256 seconds");
assert.equal(internalTicks.length,2,"six MIDI clocks must derive one sixteenth boundary");
assert.ok(Math.abs(internalPulses[0].frame-1000)<1e-6,"first internal F8 boundary is sample-accurate");
assert.ok(Math.abs(internalTicks[0].frame-6000)<1e-6,"first internal sixteenth is sample-accurate");
assert.ok(Math.abs(internalTicks[1].frame-12000)<1e-6,"second internal sixteenth is sample-accurate");
assert.equal(internalTicks[0].substep,0);
assert.equal(internalTicks[1].substep,1);
assert.equal(T.ppqn,24);
assert.equal(midiEvents.filter(e=>e.status===0xf8).length,12,"internal master must emit literal F8 events");

const externalTicks=[],externalPulses=[];
const offTick=T.subscribeTick(t=>{if(t.external)externalTicks.push({...t})});
const offPulse=T.subscribePulse(p=>{if(p.external)externalPulses.push({...p})});
T.receiveMidi(0xfa,{time:1,source:"test-midi"});
const interval=60/120/24;
for(let i=1;i<=12;i++)T.receiveMidi(0xf8,{time:1+i*interval,source:"test-midi"});
assert.equal(T.external,true,"incoming MIDI clock must automatically own patch timing");
assert.equal(externalPulses.length,12,"external MIDI must preserve every F8 pulse");
assert.equal(externalTicks.length,2,"external F8 stream must derive the same sixteenth boundaries");
assert.deepEqual(externalTicks.map(t=>t.substep),[0,1],"internal and external clock must share musical phase semantics");
assert.ok(Math.abs(T.bpm-120)<.001,"external F8 cadence must resolve to the same BPM");
assert.equal(T.snapshot().source,"test-midi");
T.receiveMidi(0xfc,{time:2,source:"test-midi"});
assert.equal(T.running,false,"FC must be real MIDI Stop");
T.releaseExternalClock();
assert.equal(T.external,false,"loss/release of external clock must fall back to internal master");
offTick();offPulse();

console.log("clock smoke: PASS — one real 24 PPQN MIDI clock bus");

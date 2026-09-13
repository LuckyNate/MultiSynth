import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const read=path=>fs.readFileSync(path,"utf8");
const worklet=read("app/src/main/assets/worklets/multisynth-clock-processor.js");
const transportSource=read("app/src/main/assets/patch-transport.js");
const clockStandard=read("app/src/main/assets/clock-standard.js");
const graph=read("app/src/main/assets/node-audio-graph.js");
const midi=read("app/src/main/assets/native-midi.js");
const father=read("app/src/main/assets/modules/father-time.js");

assert.match(worklet,/class MultiSynthClockProcessor extends AudioWorkletProcessor/);
assert.match(worklet,/currentFrame/);
assert.match(worklet,/sampleRate/);
assert.match(worklet,/type:\s*"timebase"/);
assert.doesNotMatch(worklet,/bpm|running|horizon|setTimeout|setInterval/);

assert.match(transportSource,/subscribePulse/);
assert.match(transportSource,/subscribeTick/);
assert.match(transportSource,/framesPerPulse/);
assert.match(transportSource,/ppqn:\s*24/);
assert.doesNotMatch(transportSource,/setTimeout|setInterval|horizon/);

assert.match(clockStandard,/PatchTransport/);
assert.match(clockStandard,/subscribeTick/);
assert.doesNotMatch(clockStandard,/subscribeClock|setClockBpm|startClock|stopClock|setTimeout|setInterval/);

assert.match(graph,/new AudioWorkletNode\(ctx,"multisynth-clock-processor"/);
assert.match(graph,/PatchTransport\?\.ingestTimebase/);
assert.doesNotMatch(graph,/subscribeClock|setClockBpm|startClock|stopClock/);

assert.match(midi,/sendClockPulse/);
assert.match(midi,/sendNative\(0xf8/);
assert.match(midi,/sendContinue/);
assert.doesNotMatch(midi,/sendClock16th/);
assert.match(father,/subscribePulse/);
assert.match(father,/pulse%24/);
assert.match(father,/sendClockPulse/);

const context={console,MultiSynth:{}};context.window=context;vm.createContext(context);vm.runInContext(transportSource,context,{filename:"patch-transport.js"});
const T=context.MultiSynth.PatchTransport,ticks=[],pulses=[];T.subscribeTick(t=>ticks.push(t));T.subscribePulse(p=>pulses.push(p));T.setBpm(120);
for(let frame=0;frame<=12288;frame+=128)T.ingestTimebase({frame,time:frame/48000,sampleRate:48000});
assert.equal(pulses.length,12,"120 BPM should produce twelve MIDI clock pulses in 0.256 seconds");
assert.equal(ticks.length,2,"six MIDI pulses should derive one sixteenth boundary");
assert.ok(Math.abs(pulses[0].frame-1000)<1e-6,"first 24 PPQN pulse is sample-accurate");
assert.ok(Math.abs(ticks[0].frame-6000)<1e-6,"first sixteenth boundary is sample-accurate");
assert.ok(Math.abs(ticks[1].frame-12000)<1e-6,"second sixteenth boundary is sample-accurate");
assert.equal(ticks[0].substep,0);
assert.equal(ticks[1].substep,1);
assert.equal(T.ppqn,24);

const before=T.phase;T.setBpm(90);assert.equal(T.phase,before,"tempo changes preserve 24 PPQN musical phase");
const count=pulses.length;T.ingestTimebase({frame:48000,time:1,sampleRate:48000});assert.ok(pulses.length>count,"elapsed MIDI clock pulses are preserved rather than silently dropped");

console.log("clock smoke: PASS");

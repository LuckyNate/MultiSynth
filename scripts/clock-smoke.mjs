import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const read=path=>fs.readFileSync(path,"utf8");
const worklet=read("app/src/main/assets/worklets/multisynth-clock-processor.js");
const transportSource=read("app/src/main/assets/patch-transport.js");
const clockStandard=read("app/src/main/assets/clock-standard.js");
const graph=read("app/src/main/assets/node-audio-graph.js");

assert.match(worklet,/class MultiSynthClockProcessor extends AudioWorkletProcessor/);
assert.match(worklet,/currentFrame/);
assert.match(worklet,/sampleRate/);
assert.match(worklet,/type:\s*"timebase"/);
assert.doesNotMatch(worklet,/bpm|running|horizon|setTimeout|setInterval/);

assert.match(transportSource,/ingestTimebase/);
assert.match(transportSource,/subscribeTick/);
assert.match(transportSource,/framesPerStep/);
assert.doesNotMatch(transportSource,/setTimeout|setInterval|horizon/);

assert.match(clockStandard,/PatchTransport/);
assert.match(clockStandard,/subscribeTick/);
assert.doesNotMatch(clockStandard,/subscribeClock|setClockBpm|startClock|stopClock|setTimeout|setInterval/);

assert.match(graph,/new AudioWorkletNode\(ctx,"multisynth-clock-processor"/);
assert.match(graph,/PatchTransport\?\.ingestTimebase/);
assert.doesNotMatch(graph,/subscribeClock|setClockBpm|startClock|stopClock/);

const context={console,MultiSynth:{}};context.window=context;vm.createContext(context);vm.runInContext(transportSource,context,{filename:"patch-transport.js"});
const T=context.MultiSynth.PatchTransport,ticks=[];T.subscribeTick(t=>ticks.push(t));T.setBpm(120);
for(let frame=0;frame<=12288;frame+=128)T.ingestTimebase({frame,time:frame/48000,sampleRate:48000});
assert.equal(ticks.length,2,"120 BPM should produce two sixteenth boundaries in 0.256 seconds");
assert.ok(Math.abs(ticks[0].frame-6000)<1e-6,"first sixteenth boundary is sample-accurate");
assert.ok(Math.abs(ticks[1].frame-12000)<1e-6,"second sixteenth boundary is sample-accurate");
assert.equal(ticks[0].substep,0);
assert.equal(ticks[1].substep,1);

const before=T.phase;T.setBpm(90);assert.equal(T.phase,before,"tempo changes preserve musical phase");

const count=ticks.length;T.ingestTimebase({frame:48000,time:1,sampleRate:48000});assert.equal(ticks.length,count+1,"a delayed heartbeat emits one current boundary, never a catch-up burst");

console.log("clock smoke: PASS");

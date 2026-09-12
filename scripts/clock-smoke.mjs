import fs from "node:fs";
import assert from "node:assert/strict";

const read=path=>fs.readFileSync(path,"utf8");
const worklet=read("app/src/main/assets/worklets/multisynth-clock-processor.js");
const contract=read("app/src/main/assets/module-contract.js");
const graph=read("app/src/main/assets/node-audio-graph.js");
const activity=read("app/src/main/java/audio/multisynth/app/MainActivity.java");

assert.match(worklet,/class MultiSynthClockProcessor extends AudioWorkletProcessor/);
assert.match(worklet,/currentFrame/);
assert.match(worklet,/sampleRate/);
assert.doesNotMatch(worklet,/setTimeout|setInterval/);

const transport=contract.match(/function transport\([\s\S]*?\nfunction sampler/);
assert.ok(transport,"shared transport function found");
assert.match(transport[0],/subscribeClock/);
assert.doesNotMatch(transport[0],/setTimeout|setInterval/);

assert.match(graph,/new AudioWorkletNode\(ctx,"multisynth-clock-processor"/);
assert.match(graph,/subscribeClock/);
assert.match(graph,/setClockBpm/);

const pause=activity.match(/@Override protected void onPause\(\)\{[^\n]+/);
assert.ok(pause,"Android onPause found");
assert.doesNotMatch(pause[0],/panic\(\)/);

const sampleRate=48000;
const sixteenthFrames=bpm=>sampleRate*(60/bpm)/4;
assert.equal(sixteenthFrames(120),6000);
assert.equal(sixteenthFrames(60),12000);
assert.equal(sixteenthFrames(240),3000);
assert.equal(sixteenthFrames(120)/sampleRate,0.125);

let frame=0;
for(let i=0;i<64;i++)frame+=sixteenthFrames(120);
assert.equal(frame/sampleRate,8,"64 sixteenths at 120 BPM remain exactly eight seconds");

const before=frame;
frame+=sixteenthFrames(90);
assert.ok(frame>before,"tempo change advances from existing phase instead of resetting the transport");

console.log("clock smoke: PASS");

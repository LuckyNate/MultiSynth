import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const read=path=>fs.readFileSync(path,"utf8");
const worklet=read("app/src/main/assets/worklets/multisynth-clock-processor.js");
const transportSource=read("app/src/main/assets/patch-transport.js");
const clockStandard=read("app/src/main/assets/clock-standard.js");
const moduleContract=read("app/src/main/assets/module-contract.js");
const graph=read("app/src/main/assets/node-audio-graph.js");
const clockBus=read("app/src/main/assets/clock-bus.js");
const midi=read("app/src/main/assets/native-midi.js");
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
assert.match(clockStandard,/pulse%6===0/);
assert.doesNotMatch(clockStandard,/setClockBpm|startClock|subscribeClock|clockStart|clockTick|clockStop/);

assert.match(moduleContract,/midiMessage:typeof def\.midiMessage/);
assert.match(moduleContract,/function midi\(id,packet=/);
assert.match(moduleContract,/clock:typeof def\.clock/);
assert.match(moduleContract,/function clock\(id,packet=/);
assert.doesNotMatch(moduleContract,/trigger:typeof def\.trigger|function trigger\(|\btrigger,/);

assert.match(graph,/new AudioWorkletNode\(ctx,"multisynth-clock-processor"/);
assert.match(graph,/PatchTransport\?\.ingestTimebase/);
assert.match(graph,/sendClock:/);
assert.match(graph,/midi:/);

assert.match(clockBus,/MS\.ClockBus/);
assert.match(clockBus,/e\.type!=="clock"/);
assert.match(clockBus,/C\(\)\.clock/);
assert.doesNotMatch(clockBus,/C\(\)\.trigger/);

assert.match(midi,/T\.receiveMidi\(status/);
assert.match(midi,/sendNative\(0xf8/);
assert.match(midi,/sendNative\(0xfa/);
assert.match(midi,/sendNative\(0xfb/);
assert.match(midi,/sendNative\(0xfc/);
assert.match(midi,/multisynth-midi-message/);
assert.match(midi,/NodeAudioGraph\?\.midi/);
assert.doesNotMatch(midi,/multisynth-usb-cv|receiveCV|emitCV/);

assert.match(father,/version:"midi-master-5"/);
assert.match(father,/always-on-midi-master-clock/);
assert.match(father,/single-shared-master-stream/);
assert.match(father,/dynamicPorts:\{clockOut:"used-plus-one"\}/);
assert.match(father,/sendClock/);
assert.match(father,/kind:"clock"/);
assert.match(father,/p%24!==0/);
assert.match(father,/T\.setBpm\?\./);
assert.match(father,/T\.start\?\./);
assert.match(father,/!T\.external&&!T\.running/);
assert.equal((father.match(/subscribeMidi/g)||[]).length,1,"Father Time must create only one shared MIDI-out subscription");
assert.match(father,/sendClockPulse/);
assert.doesNotMatch(father,/state:"running"|id:"running"|label:"RUN"|T\.stop\(/);

assert.match(whitman,/function noteOn/);
assert.match(whitman,/MIDI_BASE_NOTE=36/);
assert.doesNotMatch(whitman,/function trigger\(/);
assert.match(timeBandits,/function noteOn/);
assert.match(timeBandits,/MIDI_BASE(?:_NOTE)?=36/);
assert.doesNotMatch(timeBandits,/function trigger\(/);
assert.match(randrone,/function noteOn/);
assert.doesNotMatch(randrone,/trigger:/);
assert.match(manifest,/\[I\.FATHER_TIME\].*\["clockSource","clockFollower","midi"/s);
assert.match(manifest,/\[I\.WHITMAN_SAMPLER\].*"noteInput"/s);
assert.match(manifest,/\[I\.TIME_BANDITS\].*"noteInput"/s);
assert.match(manifest,/\[I\.RANDRONE\].*"noteInput"/s);

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
T.start();
assert.equal(T.running,true,"internal master must be running when Father Time owns transport");
assert.equal(midiEvents.at(-1)?.status,0xfa,"internal master start must emit literal FA");
for(let frame=0;frame<=12288;frame+=128)T.ingestTimebase({frame,time:frame/48000,sampleRate:48000});
assert.equal(internalPulses.length,12,"120 BPM should produce twelve MIDI clock pulses in 0.256 seconds");
assert.equal(internalTicks.length,2,"six MIDI clocks must derive one sixteenth boundary");
assert.ok(Math.abs(internalPulses[0].frame-1000)<1e-6,"first F8 boundary is sample-accurate");
assert.ok(Math.abs(internalTicks[0].frame-6000)<1e-6,"first sixteenth is sample-accurate");
assert.ok(Math.abs(internalTicks[1].frame-12000)<1e-6,"second sixteenth is sample-accurate");
assert.equal(T.ppqn,24);
assert.equal(midiEvents.filter(e=>e.status===0xf8).length,12,"internal master must emit literal F8 events");

const externalTicks=[],externalPulses=[];
const offTick=T.subscribeTick(t=>{if(t.external)externalTicks.push({...t})});
const offPulse=T.subscribePulse(p=>{if(p.external)externalPulses.push({...p})});
T.receiveMidi(0xfa,{time:1,source:"test-midi"});
const interval=60/120/24;
for(let i=1;i<=12;i++)T.receiveMidi(0xf8,{time:1+i*interval,source:"test-midi"});
assert.equal(T.external,true,"incoming MIDI clock must own patch timing");
assert.equal(externalPulses.length,12,"external MIDI must preserve every F8 pulse");
assert.equal(externalTicks.length,2,"external F8 must derive the same sixteenth boundaries");
assert.ok(Math.abs(T.bpm-120)<.001,"external F8 cadence must resolve to 120 BPM");
T.receiveMidi(0xfc,{time:2,source:"test-midi"});
assert.equal(T.running,false,"FC must be MIDI Stop");
T.releaseExternalClock();
offTick();offPulse();

const wireClocks=[],wireMidi=[],wireEvents=[];
const midiContext={console,performance:{now:()=>0},CustomEvent:class{constructor(type,o={}){this.type=type;this.detail=o.detail}},document:{readyState:"complete",getElementById(){return null},querySelectorAll(){return[]}},dispatchEvent(e){wireEvents.push(e);return true},MultiSynth:{PatchTransport:{external:false,bpm:120,receiveMidi(status){wireClocks.push(status);return true}},NodeAudioGraph:{context:{currentTime:0},midi(packet){wireMidi.push({...packet});return 1},panic(){}}}};
midiContext.window=midiContext;
vm.createContext(midiContext);
vm.runInContext(midi,midiContext,{filename:"native-midi.js"});
midiContext.MultiSynthNativeMidi.receive([0x90,60,0xf8,100,61,0xf8,110,0xb0,7,96]);
assert.deepEqual(wireMidi.filter(e=>e.type==="noteOn").map(e=>[e.note,e.velocity]),[[60,100],[61,110]],"realtime bytes must not corrupt Note On running status");
assert.deepEqual(wireClocks,[0xf8,0xf8],"interleaved F8 bytes must reach transport individually");
assert.ok(wireMidi.some(e=>e.type==="controlChange"&&e.control===7&&e.value===96),"CC must enter the real module MIDI path");
assert.ok(wireEvents.some(e=>e.type==="multisynth-midi-message"&&e.detail?.type==="controlChange"&&e.detail?.control===7&&e.detail?.value===96),"CC must remain observable as a real MIDI channel event");

console.log("clock smoke: PASS — Father Time internal MIDI master + real MIDI channel messages + external clock override");

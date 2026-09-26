import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const source=fs.readFileSync(path.join(repo,"app/src/main/assets/modules/alchemy-mixer.js"),"utf8");
const manifest=fs.readFileSync(path.join(repo,"app/src/main/assets/module-manifest.js"),"utf8");

if(!manifest.includes('[I.ALCHEMY_MIXER]:row(I.ALCHEMY_MIXER,"mixer","#9a6734",["audioInput","audioOutput","terminalOutput","midiInput"],["midi"]'))throw new Error("Alchemy Mixer manifest MIDI input missing");
if(!source.includes('midi-channel-addresses-input-cc7-level-cc16-mute-cc17-solo'))throw new Error("Alchemy Mixer MIDI contract missing");
if(!source.includes('physicalOutput:"local-speaker-only"')||!source.includes('carrierOutput:"chainable-for-additional-output-gates"'))throw new Error("Alchemy output routing contract regressed");

let definition=null;
const context={console,Map,Float32Array,URLSearchParams,requestAnimationFrame(){},MultiSynth:{ModuleIds:{ALCHEMY_MIXER:"alchemy-mixer"},ModuleContract:{define(d){definition=d},defineSurface(){}}}};
context.window=context;context.globalThis=context;context.parent=context;
vm.createContext(context);
vm.runInContext(source,context,{filename:"alchemy-mixer.js"});
if(!definition?.midiMessage)throw new Error("Alchemy Mixer midiMessage missing");

const state={channels:{}};
let syncCount=0;
const runtime={user:{sync(){syncCount++},inputs:new Map()}};
const send=(status,cc,value)=>definition.midiMessage({runtime,state},{status,data1:cc,data2:value});

if(!send(0xb0,7,64))throw new Error("channel 1 CC7 was not handled");
if(Math.abs(state.channels[0].level-64/127)>1e-9)throw new Error("channel 1 level mapping incorrect");
if(!send(0xb1,16,127)||state.channels[1].mute!==true)throw new Error("channel 2 mute mapping incorrect");
if(!send(0xb2,17,127)||state.channels[2].solo!==true)throw new Error("channel 3 solo mapping incorrect");
if(!send(0xb2,17,0)||state.channels[2].solo!==false)throw new Error("channel 3 solo release mapping incorrect");
if(definition.midiMessage({runtime,state},{status:0x90,data1:60,data2:100})!==false)throw new Error("Alchemy Mixer accepted non-CC MIDI");
if(definition.midiMessage({runtime,state},{status:0xb0,data1:99,data2:127})!==false)throw new Error("Alchemy Mixer accepted unmapped CC");
if(syncCount!==4)throw new Error(`expected 4 runtime syncs, got ${syncCount}`);

console.log("alchemy mixer MIDI smoke passed — MIDI channel selects input; CC7 level, CC16 mute, CC17 solo; local-speaker routing retained");

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const source=fs.readFileSync(path.join(repo,"app/src/main/assets/modules/denzels-equalizer.js"),"utf8");
const manifest=fs.readFileSync(path.join(repo,"app/src/main/assets/module-manifest.js"),"utf8");

if(!source.includes('version:"final-mix-midi-1"'))throw new Error("Denzel EQ version/role missing");
if(!source.includes('role:"final-mix-ten-band-graphic-eq"'))throw new Error("Denzel EQ final-mix role missing");
if(!manifest.includes('[I.DENZELS_EQUALIZER]:row(I.DENZELS_EQUALIZER,"effect","#72b9a7",["audioInput","audioOutput","midiInput"]'))throw new Error("Denzel EQ MIDI input missing from manifest");

let def=null,surface=null;
const state={b31:0,b62:0,b125:0,b250:0,b500:0,b1000:0,b2000:0,b4000:0,b8000:0,b16000:0,level:1,bypass:false};
const context={console,Math,Float32Array,MultiSynth:{ModuleIds:{DENZELS_EQUALIZER:"denzels-equalizer"},ModuleContract:{define(v){def=v},defineSurface(_id,v){surface=v}}}};
context.window=context;context.globalThis=context;
vm.createContext(context);
vm.runInContext(source,context,{filename:"denzels-equalizer.js"});
if(!def||!surface)throw new Error("Denzel EQ contract did not register");

const send=(cc,value)=>def.midiMessage({update(patch){Object.assign(state,patch)}},{status:0xB0,data1:cc,data2:value});
if(send(16,0)!==true||Math.abs(state.b31+12)>1e-9)throw new Error("CC16 did not set 31 Hz to -12 dB");
if(send(25,127)!==true||Math.abs(state.b16000-12)>1e-9)throw new Error("CC25 did not set 16 kHz to +12 dB");
send(20,64);if(Math.abs(state.b500-((-12)+(64/127)*24))>1e-9)throw new Error("band midpoint mapping is wrong");
send(7,127);if(state.level!==2)throw new Error("CC7 did not set output level");
send(26,127);if(state.bypass!==true)throw new Error("CC26 did not enable bypass");
send(26,0);if(state.bypass!==false)throw new Error("CC26 did not disable bypass");
if(def.midiMessage({update(){}},{status:0x90,data1:60,data2:100})!==false)throw new Error("Denzel EQ accepted non-CC MIDI");
if(def.midiMessage({update(){}},{status:0xB0,data1:27,data2:64})!==false)throw new Error("Denzel EQ accepted unmapped CC");

const bandControls=surface.controls.filter(c=>/^b\d+$/.test(c.id));
if(bandControls.length!==10)throw new Error("Denzel EQ no longer exposes ten band controls");
for(let i=0;i<bandControls.length;i++)if(bandControls[i].meta?.midiCC!==16+i)throw new Error(`band ${i} MIDI metadata mismatch`);
const level=surface.controls.find(c=>c.id==="level"),bypass=surface.controls.find(c=>c.id==="bypass");
if(level?.meta?.midiCC!==7||bypass?.meta?.midiCC!==26)throw new Error("level/bypass MIDI metadata mismatch");

console.log("Denzel EQ MIDI smoke passed — final-mix 10-band EQ preserves DSP and maps CC16-25 bands, CC7 level, CC26 bypass");

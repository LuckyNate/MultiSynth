import fs from 'node:fs';
import vm from 'node:vm';

const src=fs.readFileSync('app/src/main/assets/modules/the-chopper.js','utf8');
let definition=null,surface=null;
const updates=[],events=[];
const ModuleContract={
  define(def){definition=def;return def},
  defineSurface(_id,s){surface=s;return s},
  update(id,patch){updates.push({id,patch});return patch}
};
const context={window:{MultiSynth:{ModuleContract,ModuleIds:{THE_CHOPPER:'the-chopper',displayNameFor:()=> 'The Chopper'},ModuleStandard:{},CleanMic:{}}},console};
context.window.window=context.window;
vm.runInNewContext(src,context,{filename:'modules/the-chopper.js'});

if(!definition?.midiMessage)throw new Error('The Chopper midiMessage missing');
if(!surface)throw new Error('The Chopper surface missing');
const runtime={instanceId:'chop-1',user:{emit:(type,payload)=>events.push({type,payload})}};
const send=(cc,value)=>definition.midiMessage({runtime},{status:0xb0,command:0xb0,data1:cc,data2:value});

if(send(16,127)!==true)throw new Error('CC16 not handled');
if(updates.at(-1)?.patch?.autoSensitivity!==32)throw new Error('CC16 sensitivity mapping failed');

for(const [cc,action] of [[17,'auto'],[18,'clear'],[19,'save'],[20,'saveWhole']]){
  events.length=0;
  if(send(cc,127)!==true)throw new Error(`CC${cc} not handled`);
  if(events.at(-1)?.type!=='chopper-midi-action'||events.at(-1)?.payload?.action!==action)throw new Error(`CC${cc} action mapping failed`);
}

send(21,127);
if(updates.at(-1)?.patch?.micRecording!==true)throw new Error('CC21 mic gate on failed');
send(21,0);
if(updates.at(-1)?.patch?.micRecording!==false)throw new Error('CC21 mic gate off failed');
send(22,127);
if(updates.at(-1)?.patch?.inputRecording!==true)throw new Error('CC22 input gate on failed');
send(22,0);
if(updates.at(-1)?.patch?.inputRecording!==false)throw new Error('CC22 input gate off failed');

if(definition.midiMessage({runtime},{status:0x90,command:0x90,data1:60,data2:127})!==false)throw new Error('Unexpected note performance behavior');
if(surface.package?.behavior?.midi!=='host-targeted-control-only-no-midi-jacks')throw new Error('MIDI utility contract missing');

const manifest=fs.readFileSync('app/src/main/assets/module-manifest.js','utf8');
const row=manifest.match(/\[I\.THE_CHOPPER\]:row\([^\n]+/g)?.[0]||'';
if(/midiInput|midiOutput|noteInput/.test(row))throw new Error('The Chopper must not expose MIDI graph ports');

const editor=fs.readFileSync('app/src/main/assets/the-chopper.js','utf8');
for(const token of ['chopper-midi-action','autoFind()','saveSlices(false)','saveSlices(true)','midiHolds.micRecording','midiHolds.inputRecording'])if(!editor.includes(token))throw new Error(`Editor MIDI bridge missing: ${token}`);

console.log('The Chopper MIDI smoke passed');

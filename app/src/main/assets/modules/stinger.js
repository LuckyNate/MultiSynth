"use strict";
(function(g){
const m=g.MultiSynth||{},ids=m.ModuleIds,contract=m.ModuleContract,prefabs=m.ControlPrefabs;
if(!ids||!contract||!prefabs)return;
contract.getDefinition(ids.STINGER);
const defaults={level:.8,carrier:1,attack:.005,decay:.08,sustain:1,release:.08,amount1:.35,amount2:.25,amount3:.20,phase1:0,phase2:120,phase3:240,octave1:0,octave2:0,octave3:0,detune1:0,detune2:0,detune3:0,direction1:"up",direction2:"up",direction3:"up",acceleration1:88,acceleration2:92,acceleration3:96};
const controls=[prefabs.performanceKeyboard(),prefabs.adsr(),
{id:"carrier",control:"knob",state:"carrier",label:"CARRIER",value:{default:1,min:0,max:1,step:.01},node:"controller.carrier"},
{id:"level",control:"knob",state:"level",label:"LEVEL",value:{default:.8,min:0,max:1,step:.01},node:"controller.level"}];
const octaves=[-4,-3,-2,-1,0,1,2,3,4];
for(let stage=1;stage<=3;stage++)controls.push(
{id:"amount"+stage,control:"knob",state:"amount"+stage,label:"AMOUNT "+stage,value:{min:0,max:.85,step:.01},node:"controller.amount"+stage},
{id:"acceleration"+stage,control:"encoder",state:"acceleration"+stage,label:"ACCELERATION "+stage,value:{default:[88,92,96][stage-1],min:0,max:100,step:1},meta:{unit:"%",visual:"spine-ramp"},node:"controller.acceleration"+stage},
{id:"phase"+stage,control:"encoder",state:"phase"+stage,label:"PHASE "+stage,value:{min:0,max:360,step:1},meta:{unit:"°",cyclical:true},node:"controller.phase"+stage},
{id:"detune"+stage,control:"knob",state:"detune"+stage,label:"DETUNE "+stage,value:{min:-100,max:100,step:1},meta:{unit:"¢"},node:"controller.detune"+stage},
prefabs.selector({id:"octave"+stage,state:"octave"+stage,label:"OCTAVE "+stage,options:octaves}),
{id:"direction"+stage,control:"switch",state:"direction"+stage,label:"UP / DOWN "+stage,meta:{orientation:"vertical"},node:"controller.direction"+stage});
contract.defineSurface(ids.STINGER,{version:3,package:{id:ids.STINGER,version:3,behavior:{role:"three-stage-spine-click-ladder",stateOwnership:"module",sourceLayer:"DspSources",sourceOwnership:"shared-bottom-layer",voiceEnvelope:"built-in-adsr"}},faceplate:{livery:"yellow-stinger",primary:"#181704",secondary:"#ffe64a",tertiary:"#fffbd0"},defaults,controls,sources:[{id:"source.audio",type:"audioInput",mode:"optional"},{id:"source.oscillators",type:"dspSource",primitive:"DspSources.oscillator",waveform:"sawtooth",mode:"three-stage"},{id:"source.note",type:"noteInput"},{id:"source.cv",type:"cvInput"}],actions:[{id:"action.ladder",type:"acceleratingClickLadder"},{id:"action.envelope",type:"builtInAdsrVca"}],nodes:{connections:[["source.audio","action.ladder"],["source.oscillators","action.ladder"],["source.note","action.ladder"],["source.cv","action.ladder"],["controller.keyboard","action.ladder"],["action.ladder","action.envelope"],["controller.adsr","action.envelope"]]}});
})(window);

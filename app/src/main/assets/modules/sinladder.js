"use strict";
(function(g){
const M=g.MultiSynth||{},I=M.ModuleIds,C=M.ModuleContract,P=M.ControlPrefabs;
if(!I||!C||!P)return;
C.getDefinition(I.SIN_LADDER);
const defaults={level:.8,carrier:1,...P.ADSR_DEFAULTS,amount1:.35,amount2:.25,amount3:.20,phase1:0,phase2:120,phase3:240,octave1:0,octave2:0,octave3:0,detune1:0,detune2:0,detune3:0,direction1:"up",direction2:"up",direction3:"up",harmonic1:1,harmonic2:2,harmonic3:3};
const controls=[
 P.performanceKeyboard(),P.adsr(),
 {id:"carrier",control:"knob",state:"carrier",label:"CARRIER",value:{default:1,min:0,max:1,step:.01},node:"controller.carrier"},
 {id:"level",control:"knob",state:"level",label:"LEVEL",value:{default:.8,min:0,max:1,step:.01},node:"controller.level"}
];
for(let n=1;n<=3;n++)controls.push(
 {id:"amount"+n,control:"knob",state:"amount"+n,label:"AMOUNT "+n,value:{min:0,max:.85,step:.01},node:"controller.amount"+n},
 P.selector({id:"harmonic"+n,state:"harmonic"+n,label:"HARMONIC "+n,options:[1,2,3,4,5,6,7,8]}),
 {id:"phase"+n,control:"encoder",state:"phase"+n,label:"PHASE "+n,value:{min:0,max:360,step:1},meta:{unit:"°",cyclical:true},node:"controller.phase"+n},
 {id:"detune"+n,control:"knob",state:"detune"+n,label:"DETUNE "+n,value:{min:-100,max:100,step:1},meta:{unit:"¢"},node:"controller.detune"+n},
 P.selector({id:"octave"+n,state:"octave"+n,label:"OCTAVE "+n,options:[-4,-3,-2,-1,0,1,2,3,4]}),
 {id:"direction"+n,control:"switch",state:"direction"+n,label:"UP / DOWN "+n,meta:{orientation:"vertical"},node:"controller.direction"+n}
);
C.defineSurface(I.SIN_LADDER,{version:3,package:{id:I.SIN_LADDER,version:3,behavior:{role:"three-stage-sine-harmonic-ladder",stateOwnership:"module",sourceLayer:"DspSources",sourceOwnership:"shared-bottom-layer",voiceEnvelope:"built-in-adsr"}},faceplate:{livery:"cyan-sine-ladder",primary:"#051719",secondary:"#36eaff",tertiary:"#d9fcff"},defaults,controls,sources:[{id:"source.audio",type:"audioInput",mode:"optional"},{id:"source.oscillators",type:"dspSource",primitive:"DspSources.oscillator",waveform:"sine",mode:"three-stage"},{id:"source.note",type:"noteInput"},{id:"source.cv",type:"cvInput"}],actions:[{id:"action.ladder",type:"sineHarmonicLadder"},{id:"action.envelope",type:"builtInAdsrVca"}],nodes:{connections:[["source.audio","action.ladder"],["source.oscillators","action.ladder"],["source.note","action.ladder"],["source.cv","action.ladder"],["controller.keyboard","action.ladder"],["action.ladder","action.envelope"],["controller.adsr","action.envelope"]]}});
})(window);

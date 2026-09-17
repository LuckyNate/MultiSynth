"use strict";
(function(g){
const M=g.MultiSynth||{},I=M.ModuleIds,C=M.ModuleContract,P=M.ControlPrefabs;if(!I||!C||!P)return;
C.getDefinition(I.RAZORBACK);
const defaults={level:.8,carrier:1,...P.ADSR_DEFAULTS,amount1:.35,amount2:.25,amount3:.20,phase1:0,phase2:120,phase3:240,octave1:0,octave2:0,octave3:0,detune1:0,detune2:0,detune3:0,direction1:"up",direction2:"up",direction3:"up",peak1:25,peak2:50,peak3:75,modulation:0,expression:1,sustainPedal:false,pitchBend:0,program:0};
const controls=[P.performanceKeyboard(),P.adsr(),
{id:"modulation",control:"knob",state:"modulation",label:"MOD",value:{default:0,min:0,max:1,step:.01},meta:{midi:{cc:1}},node:"controller.modulation"},
{id:"sustain-pedal",control:"switch",state:"sustainPedal",label:"SUSTAIN",value:{default:false},meta:{midi:{cc:64}},node:"controller.sustain"},
{id:"carrier",control:"knob",state:"carrier",label:"CARRIER",value:{default:1,min:0,max:1,step:.01},node:"controller.carrier"},
{id:"level",control:"knob",state:"level",label:"LEVEL",value:{default:.8,min:0,max:1,step:.01},meta:{midi:{cc:7}},node:"controller.level"}
];
for(let n=1;n<=3;n++){const cc=20+(n-1)*6;controls.push(
{id:"amount"+n,control:"knob",state:"amount"+n,label:"AMOUNT "+n,value:{min:0,max:.85,step:.01},meta:{midi:{cc}},node:"controller.amount"+n},
{id:"peak"+n,control:"encoder",state:"peak"+n,label:"PEAK "+n,value:{default:[25,50,75][n-1],min:0,max:100,step:1},meta:{unit:"%",visual:"movable-triangle-peak",midi:{cc:cc+1}},node:"controller.peak"+n},
{id:"phase"+n,control:"encoder",state:"phase"+n,label:"PHASE "+n,value:{min:0,max:360,step:1},meta:{unit:"°",cyclical:true,midi:{cc:cc+2}},node:"controller.phase"+n},
{id:"detune"+n,control:"knob",state:"detune"+n,label:"DETUNE "+n,value:{min:-100,max:100,step:1},meta:{unit:"¢",midi:{cc:cc+3}},node:"controller.detune"+n},
P.selector({id:"octave"+n,state:"octave"+n,label:"OCTAVE "+n,options:[-4,-3,-2,-1,0,1,2,3,4],meta:{midi:{cc:cc+4}}}),
{id:"direction"+n,control:"switch",state:"direction"+n,label:"UP / DOWN "+n,meta:{orientation:"vertical",midi:{cc:cc+5}},node:"controller.direction"+n}
)}
C.defineSurface(I.RAZORBACK,{version:5,package:{id:I.RAZORBACK,version:5,behavior:{role:"three-stage-triangle-peak-ladder",stateOwnership:"module",sourceLayer:"DspSources",sourceOwnership:"shared-bottom-layer",voiceEnvelope:"built-in-adsr",midi:"note-on-off-velocity-pitch-bend-cc1-cc7-cc11-cc64-adsr-program-change-stage-cc20-37",stageMidi:"amount-peak-phase-detune-octave-direction"}},faceplate:{livery:"red-razor-ladder",primary:"#190506",secondary:"#ff3d42",tertiary:"#ffd8da"},defaults,controls,sources:[{id:"source.audio",type:"audioInput",mode:"optional"},{id:"source.oscillators",type:"dspSource",primitive:"DspSources.oscillator",waveform:"triangle",mode:"three-stage"},{id:"source.note",type:"noteInput"},{id:"source.midi",type:"midiInput",mode:"note-and-channel-messages"}],actions:[{id:"action.ladder",type:"trianglePeakLadder"},{id:"action.envelope",type:"builtInAdsrVca"},{id:"action.expression",type:"midiExpression"},{id:"action.modulation",type:"midiModulation"},{id:"action.sustain",type:"midiSustain"}],nodes:{connections:[["source.audio","action.ladder"],["source.oscillators","action.ladder"],["source.note","action.ladder"],["source.midi","action.ladder"],["controller.keyboard","action.ladder"],["controller.modulation","action.modulation"],["controller.sustain","action.sustain"],["action.ladder","action.envelope"],["controller.adsr","action.envelope"],["controller.level","action.ladder"],["action.expression","action.ladder"]]}});
})(window);

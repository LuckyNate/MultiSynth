"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{};
  const defs=new Map();
  const FAMILY_BY_ID=Object.freeze({
    "live-wire":"SIGNAL SOURCE",
    "beat-red":"INSTRUMENT",
    "father-time":"TIMERS",
    "ws":"SAMPLERS",
    "time-bandits":"TIMERS",
    "the-chopper":"SAMPLERS",
    "sample-surgery":"FILE UTILITIES",
    "sample-library":"FILE UTILITIES",
    "big-deal":"EFX PROCESSORS",
    "big-mouth":"EFX PROCESSORS",
    "grain-liqour":"EFX PROCESSORS",
    "been-served":"EFX PROCESSORS",
    "garage-band":"EFX PROCESSORS",
    "master-of-levels":"SIGNAL PROCESSORS",
    "denzels-equalizer":"SIGNAL PROCESSORS",
    "echo-canyon":"EFX PROCESSORS",
    "control-freak":"SIGNAL SOURCE",
    "lowrider-lfo":"SIGNAL SOURCE",
    "unstable-diffusion":"INSTRUMENT",
    "puresynth":"INSTRUMENT",
    "quadsynth":"INSTRUMENT",
    "pulsynth":"INSTRUMENT",
    "sinladder":"INSTRUMENT",
    "razorback":"INSTRUMENT",
    "stinger":"INSTRUMENT",
    "no-quarter":"INSTRUMENT",
    "randrone":"SIGNAL SOURCE",
    "hookworm":"EFX PROCESSORS",
    "tapeworm":"EFX PROCESSORS",
    "tail-gator":"SIGNAL PROCESSORS"
  });
  const freezeDeep=v=>{if(!v||typeof v!=="object"||Object.isFrozen(v))return v;Object.values(v).forEach(freezeDeep);return Object.freeze(v)};
  const Controls=Object.freeze({
    adsr:(options={})=>({id:options.id||"adsr",control:"adsr",label:options.label||"ENVELOPE",meta:{library:"adsr",...(options.meta||{})},node:options.node||"controller.adsr"}),
    performanceKeyboard:(options={})=>({id:options.id||"keyboard",control:"keyboard",label:options.label||"KEYBOARD",meta:{pinned:"bottom",library:"performance-keyboard",...(options.meta||{})},node:options.node||"controller.keyboard"})
  });
  const Defaults=Object.freeze({adsr:Object.freeze({attack:.005,decay:.08,sustain:1,release:.08})});
  function define(spec){
    if(!spec?.id)throw new Error("Module Builder definition requires id");
    const id=String(spec.id);
    if(defs.has(id))throw new Error("Duplicate Module Builder definition: "+id);
    const family=String(spec.family||spec.taxonomy?.family||FAMILY_BY_ID[id]||"NULL FAMILY").trim().toUpperCase();
    const out=freezeDeep({...spec,family,taxonomy:{...(spec.taxonomy||{}),family}});
    defs.set(id,out);
    return out;
  }
  function get(id){return defs.get(String(id||""))||null}
  function requireDef(id){const d=get(id);if(!d)throw new Error("Missing Module Builder definition: "+id);return d}
  define({id:"time-bandits",model:"module-builder",version:10,package:{id:"time-bandits",version:10,behavior:{clock:"32-step-internal-bpm-or-upstream-cv",probability:"independent-per-step-hit-chance",cvOutput:"successful-hit-trigger",audioMode:"additive-pass-through",stateOwnership:"module-builder"}},faceplate:{livery:"clockwork",primary:"#24160f",secondary:"#d9a84f",tertiary:"#f4dfad"},defaults:{bpm:120,probability:100,probabilities:Array(32).fill(100),drum:"kick",tune:58,decay:520,level:92,pcmKey:null,sampleName:"BUILT-IN KICK"},controls:[{id:"bpm",control:"knob",state:"bpm",label:"TIMER",value:{default:120,min:30,max:300,step:1},meta:{unit:" BPM"},node:"controller.bpm"},{id:"probability",control:"knob",state:"probability",label:"STEP CHANCE",value:{default:100,min:0,max:100,step:1},meta:{unit:"%"},node:"controller.probability"},{id:"drum",control:"selector",state:"drum",label:"DRUM",value:{default:"kick",options:["kick","sub","snare","tom","hat"],labels:["KICK","808 SUB","SNARE","TOM","HAT"]},node:"controller.drum"},{id:"tune",control:"knob",state:"tune",label:"TUNE",value:{default:58,min:30,max:1200,step:1},meta:{unit:" Hz"},node:"controller.tune"},{id:"decay",control:"knob",state:"decay",label:"DECAY",value:{default:520,min:20,max:2000,step:5},meta:{unit:" ms"},node:"controller.decay"},{id:"level",control:"knob",state:"level",label:"LEVEL",value:{default:92,min:0,max:100,step:1},meta:{unit:"%"},node:"controller.level"},{id:"soundSource",control:"screen",state:"pcmKey",label:"SAMPLE ACCESS",node:"controller.soundSource"},{id:"clockRing",control:"ledRing",label:"32 STEP PROBABILITY CLOCK",value:{count:32},node:"indicator.clockRing"}],sources:[{id:"source.internalClock",type:"clock",mode:"fallback",state:"bpm"},{id:"source.cv",type:"cvInput",mode:"step-clock"}],actions:[{id:"action.step",type:"advance32Step"},{id:"action.chance",type:"perStepProbability",state:"probabilities"},{id:"action.sound",type:"drumOrPcm"},{id:"action.cv",type:"successfulHitCvOutput"}],nodes:{connections:[["source.internalClock","action.step"],["source.cv","action.step"],["action.step","action.chance"],["controller.probability","action.chance"],["controller.drum","action.sound"],["controller.tune","action.sound"],["controller.decay","action.sound"],["controller.soundSource","action.sound"],["action.chance","action.sound"],["action.chance","action.cv"],["action.step","indicator.clockRing"]]}});
  define({id:"randrone",model:"module-builder",version:2,package:{id:"randrone",version:2,behavior:{audioMode:"generator-when-unfed-random-carrier-processor-when-fed",triggerMode:"one-random-event",clockMode:"trigger-follower",cvMode:"trigger",stateOwnership:"module-builder",sourceLayer:"DspSources",sourceOwnership:"shared-bottom-layer"}},faceplate:{livery:"cyan-generative",primary:"#07161a",secondary:"#9efcff",tertiary:"#dffeff"},defaults:{activity:45,density:4,length:55,pitch:55,bright:50,noise:20,drift:35,chaos:55,level:70,running:false},controls:[{id:"running",control:"switch",state:"running",label:"RUN",value:{default:false},node:"controller.running"},{id:"activity",control:"knob",state:"activity",label:"ACTIVITY",value:{default:45,min:0,max:100,step:1},meta:{unit:"%"},node:"controller.activity"},{id:"density",control:"knob",state:"density",label:"DENSITY",value:{default:4,min:1,max:8,step:1},node:"controller.density"},{id:"length",control:"knob",state:"length",label:"LENGTH",value:{default:55,min:0,max:100,step:1},meta:{unit:"%"},node:"controller.length"},{id:"pitch",control:"knob",state:"pitch",label:"PITCH",value:{default:55,min:0,max:100,step:1},meta:{unit:"%"},node:"controller.pitch"},{id:"bright",control:"knob",state:"bright",label:"BRIGHT",value:{default:50,min:0,max:100,step:1},meta:{unit:"%"},node:"controller.bright"},{id:"noise",control:"knob",state:"noise",label:"NOISE",value:{default:20,min:0,max:100,step:1},meta:{unit:"%"},node:"controller.noise"},{id:"drift",control:"knob",state:"drift",label:"DRIFT",value:{default:35,min:0,max:100,step:1},meta:{unit:"%"},node:"controller.drift"},{id:"chaos",control:"knob",state:"chaos",label:"CHAOS",value:{default:55,min:0,max:100,step:1},meta:{unit:"%"},node:"controller.chaos"},{id:"level",control:"knob",state:"level",label:"LEVEL",value:{default:70,min:0,max:100,step:1},meta:{unit:"%"},node:"controller.level"}],sources:[{id:"source.audio",type:"audioInput",mode:"optional"},{id:"source.generated",type:"dspSource",primitive:"DspSources.oscillator|DspSources.noise",mode:"fallback-random-event"},{id:"source.clock",type:"clockFollower",mode:"trigger"},{id:"source.cv",type:"cvInput",mode:"trigger"}],actions:[{id:"action.run",type:"setState",state:"running"},{id:"action.randomEvent",type:"randomizeOrGenerate"},{id:"action.processCarrier",type:"randomCarrierProcessor"}],nodes:{connections:[["controller.running","action.run"],["source.clock","action.randomEvent"],["source.cv","action.randomEvent"],["source.generated","action.randomEvent"],["source.audio","action.processCarrier"]]}});
  MS.ModuleBuilderDefinitions=Object.freeze({define,get,require:requireDef,all:()=>Object.freeze([...defs.values()]),Controls,Defaults,FAMILY_BY_ID});
})(window);

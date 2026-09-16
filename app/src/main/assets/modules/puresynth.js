"use strict";
(function(g){
  const ms=g.MultiSynth||{};
  const ids=ms.ModuleIds;
  const contract=ms.ModuleContract;
  const prefabs=ms.ControlPrefabs;
  if(!ids||!contract||!prefabs)return;
  contract.getDefinition(ids.PURE_SYNTH);

  const defaults={
    level:.8,carrier:1,waveform:"sine",
    phase:0,pwm:50,peak:.5,
    modulation:0,expression:1,sustainPedal:false,pitchBend:0,program:0,
    ...prefabs.ADSR_DEFAULTS
  };
  const waveforms=["sine","square","triangle","white","pink","red","blue"];
  const controls=waveforms.map(name=>({
    id:"wave-"+name,control:"button",state:"waveform",label:name.toUpperCase(),
    value:{value:name},meta:{exclusiveGroup:"waveform",waveform:name},
    node:"controller.waveform."+name
  }));
  controls.push(
    {id:"shape",control:"encoder",label:"SHAPE",value:{default:0,min:0,max:360,step:1},
      meta:{contextState:"waveform",contexts:{
        sine:{state:"phase",label:"PHASE",min:0,max:360,step:1,unit:"°"},
        square:{state:"pwm",label:"DUTY",min:5,max:95,step:1,unit:"%"},
        triangle:{state:"peak",label:"PEAK",min:0,max:1,step:.01,unit:""}
      }},node:"controller.shape"},
    {id:"modulation",control:"knob",state:"modulation",label:"MOD",value:{default:0,min:0,max:1,step:.01},meta:{midi:{cc:1}},node:"controller.modulation"},
    {id:"sustain-pedal",control:"switch",state:"sustainPedal",label:"SUSTAIN",value:{default:false},meta:{midi:{cc:64}},node:"controller.sustain"},
    {id:"expression",control:"fader",state:"expression",label:"EXPRESSION",value:{default:1,min:0,max:1,step:.01},meta:{midi:{cc:11}},node:"controller.expression"},
    {id:"level",control:"fader",state:"level",label:"LEVEL",value:{default:.8,min:0,max:1,step:.01},meta:{midi:{cc:7}},node:"controller.level"},
    {id:"program",control:"encoder",state:"program",label:"PROGRAM",value:{default:0,min:0,max:127,step:1},meta:{midi:{message:"programChange"}},node:"controller.program"},
    prefabs.adsr(),
    prefabs.performanceKeyboard(),
    {id:"scope",control:"oscilloscope",label:"OUTPUT",meta:{displayOnly:true},node:"indicator.scope"}
  );

  contract.defineSurface(ids.PURE_SYNTH,{
    version:10,
    package:{id:ids.PURE_SYNTH,version:10,behavior:{
      role:"canonical-basic-midi-synth",audioMode:"generator-or-carrier-processor",noise:true,
      stateOwnership:"module",trianglePeakMorphsToSaw:true,sourceLayer:"DspSources",
      sourceOwnership:"shared-bottom-layer",voiceEnvelope:"built-in-adsr",
      midi:"note-on-off-velocity-pitch-bend-cc1-cc7-cc11-cc64-program-change",
      shape:"waveform-context-sensitive"
    }},
    faceplate:{livery:"pure-white",primary:"#111",secondary:"#f4f4f0",tertiary:"#aaa"},
    defaults,controls,
    sources:[
      {id:"source.audio",type:"audioInput",mode:"optional"},
      {id:"source.generated",type:"dspSource",primitive:"DspSources.oscillator|DspSources.noise",mode:"waveform-selected"},
      {id:"source.midi",type:"midiInput",mode:"note-and-channel-messages"}
    ],
    actions:[
      {id:"action.voice",type:"pureOscillator"},
      {id:"action.envelope",type:"builtInAdsrVca"},
      {id:"action.shape",type:"waveShape"},
      {id:"action.expression",type:"midiExpression"},
      {id:"action.modulation",type:"midiModulation"},
      {id:"action.sustain",type:"midiSustain"}
    ],
    nodes:{connections:[
      ["source.generated","action.voice"],["source.midi","action.voice"],
      ["controller.keyboard","action.voice"],["controller.modulation","action.modulation"],
      ["controller.sustain","action.sustain"],["controller.expression","action.expression"],
      ["action.voice","action.envelope"],["controller.adsr","action.envelope"],
      ["controller.waveform.sine","action.shape"],["controller.waveform.square","action.shape"],
      ["controller.waveform.triangle","action.shape"],["controller.waveform.white","action.shape"],
      ["controller.waveform.pink","action.shape"],["controller.waveform.red","action.shape"],
      ["controller.waveform.blue","action.shape"],["controller.shape","action.shape"],
      ["controller.level","action.voice"],["action.expression","action.voice"],
      ["action.envelope","indicator.scope"]
    ]}
  });
})(window);

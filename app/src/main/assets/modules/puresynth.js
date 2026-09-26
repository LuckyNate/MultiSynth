"use strict";
(function(g){
  const ms=g.MultiSynth||{};
  const ids=ms.ModuleIds;
  const contract=ms.ModuleContract;
  const prefabs=ms.ControlPrefabs;
  if(!ids||!contract||!prefabs)return;
  contract.getDefinition(ids.PURE_SYNTH);

  const defaults={
    level:.8,carrier:1,waveform:"sine",frequencyHz:440,
    phase:0,pwm:50,peak:.5,
    modulation:0,expression:1,pitchBend:0,program:0
  };
  const waveforms=["sine","square","triangle","white","pink","red","blue"];
  const controls=waveforms.map(name=>({
    id:"wave-"+name,control:"button",state:"waveform",label:name.toUpperCase(),
    value:{value:name},meta:{exclusiveGroup:"waveform",waveform:name},
    node:"controller.waveform."+name
  }));
  controls.push(
    {id:"pitch",control:"encoder",state:"frequencyHz",label:"PITCH",value:{default:440,min:20,max:20000,step:1},meta:{unit:"Hz",scale:"logarithmic"},node:"controller.pitch"},
    {id:"shape",control:"encoder",label:"SHAPE",value:{default:0,min:0,max:360,step:1},
      meta:{contextState:"waveform",contexts:{
        sine:{state:"phase",label:"PHASE",min:0,max:360,step:1,unit:"°"},
        square:{state:"pwm",label:"DUTY",min:5,max:95,step:1,unit:"%"},
        triangle:{state:"peak",label:"PEAK",min:0,max:1,step:.01,unit:""}
      }},node:"controller.shape"},
    {id:"modulation",control:"knob",state:"modulation",label:"MOD",value:{default:0,min:0,max:1,step:.01},meta:{midi:{cc:1}},node:"controller.modulation"},
    {id:"level",control:"knob",state:"level",label:"LEVEL",value:{default:.8,min:0,max:1,step:.01},meta:{midi:{cc:7}},node:"controller.level"},
    prefabs.performanceKeyboard(),
    {id:"scope",control:"oscilloscope",label:"OUTPUT",meta:{displayOnly:true},node:"indicator.scope"}
  );

  contract.defineSurface(ids.PURE_SYNTH,{
    version:13,
    package:{id:ids.PURE_SYNTH,version:13,behavior:{
      role:"continuous-oscillator-source",audioMode:"generator",noise:true,
      stateOwnership:"module",trianglePeakMorphsToSaw:true,sourceLayer:"DspSources",
      sourceOwnership:"shared-bottom-layer",voiceEnvelope:"none",
      pitch:"frequency-hz-or-keyboard-note-last-control-wins",
      midi:"note-on-sets-frequency-pitch-bend-cc1-cc7-cc11-program-change",
      shape:"waveform-context-sensitive"
    }},
    faceplate:{livery:"pure-white",primary:"#111",secondary:"#f4f4f0",tertiary:"#aaa"},
    defaults,controls,
    sources:[
      {id:"source.generated",type:"dspSource",primitive:"DspSources.oscillator|DspSources.noise",mode:"continuous-waveform-selected"},
      {id:"source.midi",type:"midiInput",mode:"note-selects-frequency-and-channel-messages"}
    ],
    actions:[
      {id:"action.voice",type:"continuousPureOscillator"},
      {id:"action.shape",type:"waveShape"},
      {id:"action.expression",type:"midiExpression"},
      {id:"action.modulation",type:"midiModulation"}
    ],
    nodes:{connections:[
      ["source.generated","action.voice"],["source.midi","action.voice"],
      ["controller.keyboard","action.voice"],["controller.pitch","action.voice"],
      ["controller.modulation","action.modulation"],
      ["controller.waveform.sine","action.shape"],["controller.waveform.square","action.shape"],
      ["controller.waveform.triangle","action.shape"],["controller.waveform.white","action.shape"],
      ["controller.waveform.pink","action.shape"],["controller.waveform.red","action.shape"],
      ["controller.waveform.blue","action.shape"],["controller.shape","action.shape"],
      ["controller.level","action.voice"],["action.expression","action.voice"],
      ["action.voice","indicator.scope"]
    ]}
  });
})(window);

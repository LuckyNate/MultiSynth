"use strict";
(function(g){
  const ms=g.MultiSynth||{};
  const ids=ms.ModuleIds;
  const contract=ms.ModuleContract;
  const prefabs=ms.ControlPrefabs;
  if(!ids||!contract||!prefabs)return;
  contract.getDefinition(ids.PURE_SYNTH);

  const defaults={
    level:.8,carrier:1,waveform:"sine",hold:false,
    phase:0,pwm:50,peak:.5,...prefabs.ADSR_DEFAULTS
  };
  const waveforms=["sine","square","triangle","white","pink","red","blue"];
  const controls=waveforms.map(name=>({
    id:"wave-"+name,control:"button",state:"waveform",label:name.toUpperCase(),
    value:{value:name},meta:{exclusiveGroup:"waveform",waveform:name},
    node:"controller.waveform."+name
  }));
  controls.push(
    {id:"hold",control:"switch",state:"hold",label:"HOLD",value:{default:false},node:"controller.hold"},
    {id:"shape",control:"encoder",label:"SHAPE",value:{default:0,min:0,max:360,step:1},
      meta:{contextState:"waveform",contexts:{
        sine:{state:"phase",label:"PHASE",min:0,max:360,step:1,unit:"°"},
        square:{state:"pwm",label:"DUTY",min:5,max:95,step:1,unit:"%"},
        triangle:{state:"peak",label:"PEAK",min:0,max:1,step:.01,unit:""}
      }},node:"controller.shape"},
    {id:"carrier",control:"knob",state:"carrier",label:"CARRIER",value:{default:1,min:0,max:1,step:.01},node:"controller.carrier"},
    {id:"level",control:"knob",state:"level",label:"LEVEL",value:{default:.8,min:0,max:1,step:.01},node:"controller.level"},
    prefabs.adsr(),
    prefabs.performanceKeyboard(),
    {id:"scope",control:"oscilloscope",label:"OUTPUT",meta:{displayOnly:true},node:"indicator.scope"}
  );

  contract.defineSurface(ids.PURE_SYNTH,{
    version:8,
    package:{id:ids.PURE_SYNTH,version:8,behavior:{
      role:"pure-waveform-source",audioMode:"generator-or-carrier-processor",noise:true,
      stateOwnership:"module",trianglePeakMorphsToSaw:true,sourceLayer:"DspSources",
      sourceOwnership:"shared-bottom-layer",voiceEnvelope:"built-in-adsr",
      hold:"continuous-master-after-waveform-selector",shape:"waveform-context-sensitive"
    }},
    faceplate:{livery:"pure-white",primary:"#111",secondary:"#f4f4f0",tertiary:"#aaa"},
    defaults,controls,
    sources:[
      {id:"source.audio",type:"audioInput",mode:"optional"},
      {id:"source.generated",type:"dspSource",primitive:"DspSources.oscillator|DspSources.noise",mode:"waveform-selected"},
      {id:"source.note",type:"noteInput"},
      {id:"source.cv",type:"cvInput"}
    ],
    actions:[
      {id:"action.voice",type:"pureOscillator"},
      {id:"action.envelope",type:"builtInAdsrVca"},
      {id:"action.shape",type:"waveShape"},
      {id:"action.hold",type:"continuousMaster",state:"hold"}
    ],
    nodes:{connections:[
      ["source.generated","action.voice"],["source.note","action.voice"],["source.cv","action.voice"],
      ["controller.keyboard","action.voice"],["controller.hold","action.hold"],
      ["action.voice","action.envelope"],["controller.adsr","action.envelope"],
      ["controller.waveform.sine","action.shape"],["controller.waveform.square","action.shape"],
      ["controller.waveform.triangle","action.shape"],["controller.waveform.white","action.shape"],
      ["controller.waveform.pink","action.shape"],["controller.waveform.red","action.shape"],
      ["controller.waveform.blue","action.shape"],["controller.shape","action.shape"],
      ["controller.carrier","action.voice"],["controller.level","action.voice"],
      ["action.envelope","indicator.scope"]
    ]}
  });
})(window);

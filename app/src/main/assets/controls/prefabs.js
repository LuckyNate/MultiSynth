"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{};
  const C=MS.ControlSurface?.MODULE_CONTROL||{};
  const control=name=>C[name]||String(name||"").toLowerCase();
  const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
  const ADSR_DEFAULTS=Object.freeze({attack:.005,decay:.08,sustain:1,release:.08});
  function adsr(options={}){
    const id=options.id||"adsr",label=options.label||"ENVELOPE",meta={library:"adsr",...(options.meta||{})};
    return Object.freeze({id,label,kind:"prefab",controls:Object.freeze([
      {id:id+"-attack",control:control("KNOB"),state:"attack",label:"ATTACK",value:{default:ADSR_DEFAULTS.attack,min:0,max:10,step:.001},meta:{...meta,stage:"attack"}},
      {id:id+"-decay",control:control("KNOB"),state:"decay",label:"DECAY",value:{default:ADSR_DEFAULTS.decay,min:0,max:10,step:.001},meta:{...meta,stage:"decay"}},
      {id:id+"-sustain",control:control("KNOB"),state:"sustain",label:"SUSTAIN",value:{default:ADSR_DEFAULTS.sustain,min:0,max:1,step:.01},meta:{...meta,stage:"sustain"}},
      {id:id+"-release",control:control("KNOB"),state:"release",label:"RELEASE",value:{default:ADSR_DEFAULTS.release,min:0,max:10,step:.001},meta:{...meta,stage:"release"}}
    ].map(Object.freeze))});
  }
  function performanceKeyboard(options={}){
    return Object.freeze({id:options.id||"keyboard",kind:"prefab",prefab:"performance-keyboard",label:options.label||"KEYBOARD",meta:Object.freeze({pinned:"bottom",library:"performance-keyboard",...(options.meta||{})}),mount:"PerformanceKeyboard"});
  }
  function selector(options={}){
    const values=Array.isArray(options.options)?options.options.slice():[];
    return Object.freeze({id:options.id||"selector",kind:"prefab",label:options.label||"",controls:Object.freeze(values.map((value,index)=>Object.freeze({id:(options.id||"selector")+"-"+index,control:control("BUTTON"),state:options.state,label:String(value),value:{value},meta:{exclusiveGroup:options.id||"selector",selectorValue:value}})))});
  }
  MS.ControlPrefabs=Object.freeze({ADSR_DEFAULTS,adsr,performanceKeyboard,selector,clone});
})(window);

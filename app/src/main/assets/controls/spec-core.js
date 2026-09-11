"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{},CS=MS.ControlSurface,P=MS.ControlSurfaceSpecParts||{};
  if(!CS)return;
  const C=CS.CONTROL,freeze=o=>Object.freeze(o),px=n=>`${Number(n)}px`;
  const required=["knob","encoder","turntable","fader","ribbon","expression","pad","button","switch","xy","readout","screen","oscilloscope","meter","led","jack","decal"];
  for(const name of required)if(!P[name])throw new Error("Missing canonical control definition: "+name);
  const TYPES=freeze({
    [C.KNOB]:P.knob.type,[C.ENCODER]:P.encoder.type,[C.TURNTABLE]:P.turntable.type,[C.FADER]:P.fader.type,
    [C.RIBBON]:P.ribbon.type,[C.EXPRESSION]:P.expression.type,[C.PAD]:P.pad.type,[C.BUTTON]:P.button.type,
    [C.SWITCH]:P.switch.type,[C.XY]:P.xy.type,[C.READOUT]:P.readout.type,[C.SCREEN]:P.screen.type,
    [C.OSCILLOSCOPE]:P.oscilloscope.type,[C.METER]:P.meter.type,[C.LED]:P.led.type,[C.JACK]:P.jack.type,[C.DECAL]:P.decal.type
  });
  const VARIANTS=freeze(Object.fromEntries(required.map(name=>[name,P[name].variants])));
  function defaults(control){const d=TYPES[control];if(!d)throw new Error("No control visual spec for "+control);return d}
  function resolve(control,overrides={}){const base=defaults(control),r={...base,...overrides};if(VARIANTS[control]&&!VARIANTS[control].includes(r.variant))throw new Error("Unsupported "+control+" variant: "+r.variant);if(control===C.SWITCH&&r.variant==="vertical"){if(overrides.width==null)r.width=base.height;if(overrides.height==null)r.height=base.width;if(overrides.touchWidth==null)r.touchWidth=base.touchHeight;if(overrides.touchHeight==null)r.touchHeight=base.touchWidth}return freeze(r)}
  function cssVars(control,overrides={}){const s=resolve(control,overrides),out={};for(const [k,v] of Object.entries(s)){if(typeof v==="number"){const unitless=new Set(["travel","startAngle","endAngle","ticks","opacity","rotation","scale","rows","columns"]);out[`--ms-${k.replace(/[A-Z]/g,m=>"-"+m.toLowerCase())}`]=unitless.has(k)?String(v):px(v)}else if(typeof v==="boolean")out[`--ms-${k.replace(/[A-Z]/g,m=>"-"+m.toLowerCase())}`]=v?"1":"0";else if(v!=null)out[`--ms-${k.replace(/[A-Z]/g,m=>"-"+m.toLowerCase())}`]=String(v)}return freeze(out)}
  MS.ControlSurfaceSpec=freeze({TYPES,VARIANTS,defaults,resolve,cssVars});
})(window);

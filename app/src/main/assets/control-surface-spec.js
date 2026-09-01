"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{},CS=MS.ControlSurface;
  if(!CS)return;
  const C=CS.CONTROL;
  const freeze=o=>Object.freeze(o);
  const px=n=>`${Number(n)}px`;
  const TYPES=freeze({
    [C.KNOB]:freeze({variant:"cap",size:64,touch:76,travel:270,startAngle:-135,endAngle:135,ticks:11,pointer:"line",labelGap:8,valueReadout:true}),
    [C.DIAL]:freeze({variant:"rotary",size:72,touch:82,travel:300,startAngle:-150,endAngle:150,ticks:12,pointer:"wedge",labelGap:8,valueReadout:true}),
    [C.TURNTABLE]:freeze({variant:"platter",size:128,touch:140,travel:360,startAngle:0,endAngle:360,ticks:0,pointer:"none",labelGap:8,valueReadout:true}),
    [C.FADER]:freeze({variant:"vertical",width:46,height:160,touchWidth:62,touchHeight:174,trackWidth:8,thumbWidth:38,thumbHeight:22,labelGap:8,valueReadout:true}),
    [C.RIBBON]:freeze({variant:"horizontal",width:220,height:44,touchWidth:220,touchHeight:56,corner:12,labelGap:8,valueReadout:true}),
    [C.PAD]:freeze({variant:"square",width:72,height:72,touchWidth:80,touchHeight:80,corner:12,labelGap:7,valueReadout:false}),
    [C.BUTTON]:freeze({variant:"rect",width:92,height:48,touchWidth:100,touchHeight:56,corner:8,labelGap:6,valueReadout:false}),
    [C.SWITCH]:freeze({variant:"rocker",width:58,height:34,touchWidth:70,touchHeight:48,corner:17,labelGap:7,valueReadout:false}),
    [C.KEY]:freeze({variant:"key",width:42,height:132,touchWidth:42,touchHeight:132,corner:0,labelGap:0,valueReadout:false}),
    [C.XY]:freeze({variant:"pad",width:220,height:180,touchWidth:220,touchHeight:180,corner:10,labelGap:8,valueReadout:true}),
    [C.SCREEN]:freeze({variant:"screen",width:240,height:120,touchWidth:240,touchHeight:120,corner:10,labelGap:8,valueReadout:false}),
    [C.OSCILLOSCOPE]:freeze({variant:"scope",width:240,height:120,touchWidth:240,touchHeight:120,corner:10,labelGap:8,valueReadout:false}),
    [C.METER]:freeze({variant:"bar",width:34,height:132,touchWidth:46,touchHeight:140,corner:5,labelGap:7,valueReadout:true}),
    [C.LED]:freeze({variant:"round",size:18,touch:36,corner:50,labelGap:6,valueReadout:false}),
    [C.JACK]:freeze({variant:"socket",size:34,touch:50,corner:50,labelGap:6,valueReadout:false}),
    [C.DECAL]:freeze({variant:"screenprint",width:180,height:90,opacity:1,rotation:0,fit:"contain",blend:"normal",labelGap:0,valueReadout:false})
  });
  const VARIANTS=freeze({
    knob:freeze(["cap","skirted","pointer","encoder"]),dial:freeze(["rotary","selector","indexed"]),turntable:freeze(["platter"]),fader:freeze(["vertical","horizontal"]),ribbon:freeze(["horizontal","vertical"]),pad:freeze(["square","round","strip"]),button:freeze(["rect","round","arcade"]),switch:freeze(["rocker","slide","toggle"]),key:freeze(["key","black-key","pad-key"]),xy:freeze(["pad"]),screen:freeze(["screen","scroll"]),oscilloscope:freeze(["scope"]),meter:freeze(["bar","needle"]),led:freeze(["round","rect"]),jack:freeze(["socket"]),decal:freeze(["screenprint","sticker","stencil","plate"])
  });
  function defaults(control){const d=TYPES[control];if(!d)throw new Error("No control visual spec for "+control);return d}
  function resolve(control,overrides={}){const base=defaults(control),r={...base,...overrides};if(VARIANTS[control]&&!VARIANTS[control].includes(r.variant))throw new Error("Unsupported "+control+" variant: "+r.variant);return freeze(r)}
  function cssVars(control,overrides={}){const s=resolve(control,overrides),out={};for(const [k,v] of Object.entries(s)){if(typeof v==="number"){const unitless=new Set(["travel","startAngle","endAngle","ticks","opacity","rotation"]);out[`--ms-${k.replace(/[A-Z]/g,m=>"-"+m.toLowerCase())}`]=unitless.has(k)?String(v):px(v)}else if(typeof v==="boolean")out[`--ms-${k.replace(/[A-Z]/g,m=>"-"+m.toLowerCase())}`]=v?"1":"0";else if(v!=null)out[`--ms-${k.replace(/[A-Z]/g,m=>"-"+m.toLowerCase())}`]=String(v)}return freeze(out)}
  MS.ControlSurfaceSpec=freeze({TYPES,VARIANTS,defaults,resolve,cssVars});
})(window);

"use strict";
// CANON LOCK — VISUAL / SPEC LAYER.
// This file is one of the three canonical shared-control layers: library, spec, renderer.
// Any change to an existing canonical control in ANY of those three layers requires two confirmations:
// (1) Nate explicitly authorizes the exact proposed change; (2) that exact scope is repeated back and Nate explicitly confirms it again.
// Only then may that exact change be executed. Approval is single-use and does not authorize cleanup, refactors,
// adjacent controls, contract/I-O changes, interaction/renderer changes, or other follow-up work outside the confirmed scope.
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{},CS=MS.ControlSurface;
  if(!CS)return;
  const C=CS.CONTROL;
  const freeze=o=>Object.freeze(o);
  const px=n=>`${Number(n)}px`;
  // SHARED SURFACE VISUAL CANON — NO TOUCH.
  // Existing control/node-feature appearance, geometry, proportions, bezels, hardware styling, and approved variants are locked canon.
  // Do not redesign, restyle, normalize, "improve", or alter an existing canonical surface element unless the two-confirmation canon lock above is satisfied for that exact change.
  // New surface types and explicitly approved new variants may be added without changing existing canon.
  const TYPES=freeze({
    // CANON CONTROL — KNOB — DO NOT EDIT EXISTING VISUALS WITHOUT EXPLICIT NO-TOUCH OVERRIDE.
    [C.KNOB]:freeze({variant:"cap",size:64,touch:76,travel:270,startAngle:-135,endAngle:135,ticks:11,pointer:"line",labelGap:8,valueReadout:false}),
    // CANON CONTROL — ENCODER — DO NOT EDIT EXISTING VISUALS WITHOUT EXPLICIT NO-TOUCH OVERRIDE.
    [C.ENCODER]:freeze({variant:"rotary",size:128,touch:140,travel:300,startAngle:-150,endAngle:150,ticks:12,pointer:"dot",labelGap:8,valueReadout:false}),
    // CANON CONTROL — TURNTABLE — DO NOT EDIT EXISTING VISUALS WITHOUT EXPLICIT NO-TOUCH OVERRIDE.
    [C.TURNTABLE]:freeze({variant:"platter",size:128,touch:140,travel:360,startAngle:0,endAngle:360,ticks:0,pointer:"none",labelGap:8,valueReadout:false}),
    // CANON CONTROL — FADER — DO NOT EDIT EXISTING VISUALS WITHOUT EXPLICIT NO-TOUCH OVERRIDE.
    [C.FADER]:freeze({variant:"vertical",width:46,height:160,touchWidth:62,touchHeight:174,trackWidth:8,thumbWidth:38,thumbHeight:22,labelGap:8,valueReadout:false}),
    // CANON CONTROL — RIBBON — square-corner transient strip.
    [C.RIBBON]:freeze({variant:"horizontal",width:220,height:44,touchWidth:220,touchHeight:56,corner:0,labelGap:8,valueReadout:false}),
    // CANON CONTROL — EXPRESSION — rounded spring-return strip.
    [C.EXPRESSION]:freeze({variant:"horizontal",width:220,height:44,touchWidth:220,touchHeight:56,corner:12,labelGap:8,valueReadout:false}),
    // CANON CONTROL — PAD — DO NOT EDIT EXISTING VISUALS WITHOUT EXPLICIT NO-TOUCH OVERRIDE.
    [C.PAD]:freeze({variant:"square",width:72,height:72,touchWidth:80,touchHeight:80,corner:12,labelGap:7,valueReadout:false}),
    // CANON CONTROL — BUTTON — DO NOT EDIT EXISTING VISUALS WITHOUT EXPLICIT NO-TOUCH OVERRIDE.
    [C.BUTTON]:freeze({variant:"rect",width:92,height:48,touchWidth:100,touchHeight:56,corner:8,labelGap:6,valueReadout:false}),
    // CANON CONTROL — SWITCH — DO NOT EDIT EXISTING VISUALS WITHOUT EXPLICIT NO-TOUCH OVERRIDE.
    [C.SWITCH]:freeze({variant:"rocker",width:68,height:34,touchWidth:76,touchHeight:48,corner:17,labelGap:7,valueReadout:false}),
    // CANON CONTROL — XY — DO NOT EDIT EXISTING VISUALS WITHOUT EXPLICIT NO-TOUCH OVERRIDE.
    [C.XY]:freeze({variant:"pad",width:220,height:180,touchWidth:220,touchHeight:180,corner:10,labelGap:8,valueReadout:false}),
    // READOUT is under visual evaluation; rows and columns are configured by the consuming faceplate.
    [C.READOUT]:freeze({variant:"glass",rows:1,columns:1,labelGap:0,valueReadout:false}),
    // CANON CONTROL — SCREEN — DO NOT EDIT EXISTING VISUALS WITHOUT EXPLICIT NO-TOUCH OVERRIDE.
    [C.SCREEN]:freeze({variant:"screen",width:240,height:120,touchWidth:240,touchHeight:120,corner:10,labelGap:8,valueReadout:false}),
    // CANON CONTROL — OSCILLOSCOPE — DO NOT EDIT EXISTING VISUALS WITHOUT EXPLICIT NO-TOUCH OVERRIDE.
    [C.OSCILLOSCOPE]:freeze({variant:"scope",width:240,height:120,touchWidth:240,touchHeight:120,corner:10,labelGap:8,valueReadout:false}),
    // CANON CONTROL — METER — DO NOT EDIT EXISTING VISUALS WITHOUT EXPLICIT NO-TOUCH OVERRIDE.
    [C.METER]:freeze({variant:"bar",width:34,height:132,touchWidth:46,touchHeight:140,corner:5,labelGap:7,valueReadout:false}),
    // CANON CONTROL — LED — DO NOT EDIT EXISTING VISUALS WITHOUT EXPLICIT NO-TOUCH OVERRIDE.
    [C.LED]:freeze({variant:"round",size:18,touch:36,corner:50,labelGap:6,valueReadout:false}),
    // CANON NODE FEATURE — JACK — lives on nodes; visual canon is unchanged.
    [C.JACK]:freeze({variant:"socket",size:34,touch:50,corner:50,labelGap:6,valueReadout:false}),
    // CANON NODE FEATURE — DECAL — reuses the canonical decal primitive for node artwork.
    [C.DECAL]:freeze({variant:"screenprint",width:180,height:90,scale:1,translateX:0,translateY:0,rotation:0,tint:"#ffffff",opacity:1,fit:"contain",labelGap:0,valueReadout:false})
  });
  // Every existing canonical variant named below is locked. READOUT variants are candidates until Nate explicitly locks one or more.
  const VARIANTS=freeze({
    knob:freeze(["cap","skirted","pointer","encoder"]),encoder:freeze(["rotary","selector","indexed"]),turntable:freeze(["platter"]),fader:freeze(["vertical","horizontal"]),ribbon:freeze(["horizontal","vertical"]),expression:freeze(["horizontal","vertical"]),pad:freeze(["square","round","hex"]),button:freeze(["rect","round","arcade"]),switch:freeze(["rocker","slide","toggle","vertical"]),xy:freeze(["pad"]),readout:freeze(["glass","amber","inset","banner"]),screen:freeze(["screen","scroll"]),oscilloscope:freeze(["scope"]),meter:freeze(["bar","needle"]),led:freeze(["round","rect"]),jack:freeze(["socket"]),decal:freeze(["screenprint","sticker","stencil","plate"])
  });
  function defaults(control){const d=TYPES[control];if(!d)throw new Error("No control visual spec for "+control);return d}
  function resolve(control,overrides={}){const base=defaults(control),r={...base,...overrides};if(VARIANTS[control]&&!VARIANTS[control].includes(r.variant))throw new Error("Unsupported "+control+" variant: "+r.variant);if(control===C.SWITCH&&r.variant==="vertical"){if(overrides.width==null)r.width=base.height;if(overrides.height==null)r.height=base.width;if(overrides.touchWidth==null)r.touchWidth=base.touchHeight;if(overrides.touchHeight==null)r.touchHeight=base.touchWidth}return freeze(r)}
  function cssVars(control,overrides={}){const s=resolve(control,overrides),out={};for(const [k,v] of Object.entries(s)){if(typeof v==="number"){const unitless=new Set(["travel","startAngle","endAngle","ticks","opacity","rotation","scale","rows","columns"]);out[`--ms-${k.replace(/[A-Z]/g,m=>"-"+m.toLowerCase())}`]=unitless.has(k)?String(v):px(v)}else if(typeof v==="boolean")out[`--ms-${k.replace(/[A-Z]/g,m=>"-"+m.toLowerCase())}`]=v?"1":"0";else if(v!=null)out[`--ms-${k.replace(/[A-Z]/g,m=>"-"+m.toLowerCase())}`]=String(v)}return freeze(out)}
  MS.ControlSurfaceSpec=freeze({TYPES,VARIANTS,defaults,resolve,cssVars});
})(window);
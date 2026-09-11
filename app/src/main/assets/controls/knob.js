"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{},R=MS.ControlSurfaceSpecParts=MS.ControlSurfaceSpecParts||{};
  // CANON CONTROL — KNOB — DO NOT EDIT EXISTING VISUALS WITHOUT EXPLICIT NO-TOUCH OVERRIDE.
  R.knob=Object.freeze({
    type:Object.freeze({variant:"cap",size:64,touch:76,travel:270,startAngle:-135,endAngle:135,ticks:11,pointer:"line",labelGap:8,valueReadout:false}),
    variants:Object.freeze(["cap","skirted","pointer","encoder"])
  });
})(window);

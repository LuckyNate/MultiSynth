"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{},R=MS.ControlSurfaceSpecParts=MS.ControlSurfaceSpecParts||{};
  // CANON CONTROL — TURNTABLE — DO NOT EDIT EXISTING VISUALS WITHOUT EXPLICIT NO-TOUCH OVERRIDE.
  R.turntable=Object.freeze({
    type:Object.freeze({variant:"platter",size:128,touch:140,travel:360,startAngle:0,endAngle:360,ticks:0,pointer:"none",labelGap:8,valueReadout:false}),
    variants:Object.freeze(["platter"])
  });
})(window);

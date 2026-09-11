"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{},R=MS.ControlSurfaceSpecParts=MS.ControlSurfaceSpecParts||{};
  // CANON CONTROL — ENCODER — DO NOT EDIT EXISTING VISUALS WITHOUT EXPLICIT NO-TOUCH OVERRIDE.
  R.encoder=Object.freeze({
    type:Object.freeze({variant:"rotary",size:128,touch:140,travel:300,startAngle:-150,endAngle:150,ticks:12,pointer:"dot",labelGap:8,valueReadout:false}),
    variants:Object.freeze(["rotary","selector","indexed"])
  });
})(window);

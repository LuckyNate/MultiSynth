"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{},R=MS.ControlSurfaceSpecParts=MS.ControlSurfaceSpecParts||{};
  // CANON CONTROL — FADER — DO NOT EDIT EXISTING VISUALS WITHOUT EXPLICIT NO-TOUCH OVERRIDE.
  R.fader=Object.freeze({
    type:Object.freeze({variant:"vertical",width:46,height:160,touchWidth:62,touchHeight:174,trackWidth:8,thumbWidth:38,thumbHeight:22,labelGap:8,valueReadout:false}),
    variants:Object.freeze(["vertical","horizontal"])
  });
})(window);

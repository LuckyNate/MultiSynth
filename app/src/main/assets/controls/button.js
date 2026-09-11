"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{},R=MS.ControlSurfaceSpecParts=MS.ControlSurfaceSpecParts||{};
  // CANON CONTROL — BUTTON — DO NOT EDIT EXISTING VISUALS WITHOUT EXPLICIT NO-TOUCH OVERRIDE.
  R.button=Object.freeze({
    type:Object.freeze({variant:"rect",width:92,height:48,touchWidth:100,touchHeight:56,corner:8,labelGap:6,valueReadout:false}),
    variants:Object.freeze(["rect","round","arcade"])
  });
})(window);

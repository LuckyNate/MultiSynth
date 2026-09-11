"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{},R=MS.ControlSurfaceSpecParts=MS.ControlSurfaceSpecParts||{};
  // CANON CONTROL — SCREEN — DO NOT EDIT EXISTING VISUALS WITHOUT EXPLICIT NO-TOUCH OVERRIDE.
  R.screen=Object.freeze({
    type:Object.freeze({variant:"screen",width:240,height:120,touchWidth:240,touchHeight:120,corner:10,labelGap:8,valueReadout:false}),
    variants:Object.freeze(["screen","scroll"])
  });
})(window);

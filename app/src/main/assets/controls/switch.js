"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{},R=MS.ControlSurfaceSpecParts=MS.ControlSurfaceSpecParts||{};
  // CANON CONTROL — SWITCH — DO NOT EDIT EXISTING VISUALS WITHOUT EXPLICIT NO-TOUCH OVERRIDE.
  R.switch=Object.freeze({
    type:Object.freeze({variant:"rocker",width:68,height:34,touchWidth:76,touchHeight:48,corner:17,labelGap:7,valueReadout:false}),
    variants:Object.freeze(["rocker","slide","toggle","vertical"])
  });
})(window);

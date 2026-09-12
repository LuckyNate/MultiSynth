"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{},R=MS.ControlSurfaceSpecParts=MS.ControlSurfaceSpecParts||{};
  // CANON CONTROL — GAUGE — DO NOT EDIT EXISTING VISUALS WITHOUT EXPLICIT NO-TOUCH OVERRIDE.
  R.gauge=Object.freeze({
    type:Object.freeze({variant:"needle",width:34,height:132,touchWidth:46,touchHeight:140,corner:5,labelGap:7,valueReadout:false}),
    variants:Object.freeze(["needle"])
  });
})(window);

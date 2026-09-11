"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{},R=MS.ControlSurfaceSpecParts=MS.ControlSurfaceSpecParts||{};
  // CANON CONTROL — PAD — DO NOT EDIT EXISTING VISUALS WITHOUT EXPLICIT NO-TOUCH OVERRIDE.
  R.pad=Object.freeze({
    type:Object.freeze({variant:"square",width:72,height:72,touchWidth:80,touchHeight:80,corner:12,labelGap:7,valueReadout:false}),
    variants:Object.freeze(["square","round","hex"])
  });
})(window);

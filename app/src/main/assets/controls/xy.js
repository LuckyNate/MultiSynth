"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{},R=MS.ControlSurfaceSpecParts=MS.ControlSurfaceSpecParts||{};
  // CANON CONTROL — XY — DO NOT EDIT EXISTING VISUALS WITHOUT EXPLICIT NO-TOUCH OVERRIDE.
  R.xy=Object.freeze({
    type:Object.freeze({variant:"pad",width:220,height:180,touchWidth:220,touchHeight:180,corner:10,labelGap:8,valueReadout:false}),
    variants:Object.freeze(["pad"])
  });
})(window);

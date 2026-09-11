"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{},R=MS.ControlSurfaceSpecParts=MS.ControlSurfaceSpecParts||{};
  // CANON CONTROL — LED — DO NOT EDIT EXISTING VISUALS WITHOUT EXPLICIT NO-TOUCH OVERRIDE.
  R.led=Object.freeze({
    type:Object.freeze({variant:"round",size:18,touch:36,corner:50,labelGap:6,valueReadout:false}),
    variants:Object.freeze(["round","rect","square","pill"])
  });
})(window);

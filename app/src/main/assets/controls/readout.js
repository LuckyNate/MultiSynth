"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{},R=MS.ControlSurfaceSpecParts=MS.ControlSurfaceSpecParts||{};
  // READOUT is under visual evaluation; rows and columns are configured by the consuming faceplate.
  R.readout=Object.freeze({
    type:Object.freeze({variant:"glass",rows:1,columns:1,labelGap:0,valueReadout:false}),
    variants:Object.freeze(["glass","amber","inset","banner"])
  });
})(window);

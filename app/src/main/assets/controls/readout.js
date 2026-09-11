"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{},R=MS.ControlSurfaceSpecParts=MS.ControlSurfaceSpecParts||{};
  // READOUT is one canonical calculator-style display. Rows and columns are configured by the consuming faceplate;
  // color/material styling follows the module theme and may be overridden with readout CSS custom properties.
  R.readout=Object.freeze({
    type:Object.freeze({variant:"default",rows:1,columns:1,labelGap:0,valueReadout:false}),
    variants:Object.freeze(["default"])
  });
})(window);

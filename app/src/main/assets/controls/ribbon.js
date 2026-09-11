"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{},R=MS.ControlSurfaceSpecParts=MS.ControlSurfaceSpecParts||{};
  // CANON CONTROL — RIBBON — square-corner transient strip.
  R.ribbon=Object.freeze({
    type:Object.freeze({variant:"horizontal",width:220,height:44,touchWidth:220,touchHeight:56,corner:0,labelGap:8,valueReadout:false}),
    variants:Object.freeze(["horizontal","vertical"])
  });
})(window);

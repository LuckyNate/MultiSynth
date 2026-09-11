"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{},R=MS.ControlSurfaceSpecParts=MS.ControlSurfaceSpecParts||{};
  // CANON CONTROL — EXPRESSION — rounded spring-return strip.
  R.expression=Object.freeze({
    type:Object.freeze({variant:"horizontal",width:220,height:44,touchWidth:220,touchHeight:56,corner:12,labelGap:8,valueReadout:false}),
    variants:Object.freeze(["horizontal","vertical"])
  });
})(window);

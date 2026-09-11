"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{},R=MS.ControlSurfaceSpecParts=MS.ControlSurfaceSpecParts||{};
  // CANON NODE FEATURE — JACK — lives on nodes; visual canon is unchanged.
  R.jack=Object.freeze({
    type:Object.freeze({variant:"socket",size:34,touch:50,corner:50,labelGap:6,valueReadout:false}),
    variants:Object.freeze(["socket"])
  });
})(window);

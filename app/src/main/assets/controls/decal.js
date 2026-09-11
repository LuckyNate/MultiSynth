"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{},R=MS.ControlSurfaceSpecParts=MS.ControlSurfaceSpecParts||{};
  // CANON NODE FEATURE — DECAL — reuses the canonical decal primitive for node artwork.
  R.decal=Object.freeze({
    type:Object.freeze({variant:"screenprint",width:180,height:90,scale:1,translateX:0,translateY:0,rotation:0,tint:"#ffffff",opacity:1,fit:"contain",labelGap:0,valueReadout:false}),
    variants:Object.freeze(["screenprint","sticker","stencil","plate"])
  });
})(window);

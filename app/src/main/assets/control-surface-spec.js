"use strict";
// CANON LOCK — VISUAL / SPEC LAYER.
// This file is now the canonical loader for per-control visual/spec definitions.
// Existing canonical control definitions remain individually protected by the two-confirmation rule.
(function(global){
  const doc=global.document;
  if(!doc||!doc.write)throw new Error("control-surface-spec.js requires parser-time script loading");
  const current=doc.currentScript;
  const src=current?.src||"control-surface-spec.js";
  const base=src.replace(/[^/]*$/,"controls/");
  const files=[
    "knob.js","encoder.js","turntable.js","fader.js","ribbon.js","expression.js",
    "pad.js","button.js","switch.js","xy.js","readout.js","screen.js","oscilloscope.js",
    "meter.js","led.js","jack.js","decal.js","spec-core.js","prefabs.js"
  ];
  for(const file of files)doc.write('<script src="'+base+file+'"><\/script>');
})(window);

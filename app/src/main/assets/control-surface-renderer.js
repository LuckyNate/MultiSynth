"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{},CS=MS.ControlSurface,SPEC=MS.ControlSurfaceSpec;
  if(!CS||!SPEC)return;
  const C=CS.CONTROL;
  function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n}
  function applyVars(node,vars){for(const [k,v] of Object.entries(vars||{}))node.style.setProperty(k,v)}
  function shell(d,visual){const root=el("div",`ms-control ms-${d.control} ms-${d.control}--${visual.variant}`);root.dataset.control=d.control;if(d.id)root.dataset.controlId=d.id;if(d.state)root.dataset.stateKey=d.state;root.dataset.variant=visual.variant;applyVars(root,SPEC.cssVars(d.control,visual));const face=el("div","ms-control-face");root.appendChild(face);if(d.label){const l=el("div","ms-control-label",d.label);root.appendChild(l)}if(visual.valueReadout&&d.value){const value=el("output","ms-control-value",String(d.value.default??d.value.value??""));root.appendChild(value)}return{root,face}}
  function decorate(d,p){const {root,face}=p;switch(d.control){
    case C.KNOB:case C.DIAL:{const pointer=el("span","ms-control-pointer");face.appendChild(pointer);const ticks=el("span","ms-control-ticks");face.appendChild(ticks);break}
    case C.WHEEL:{face.appendChild(el("span","ms-wheel-groove"));face.appendChild(el("span","ms-wheel-center"));break}
    case C.FADER:{face.appendChild(el("span","ms-fader-track"));face.appendChild(el("span","ms-fader-thumb"));break}
    case C.PAD:case C.BUTTON:case C.KEY:{face.appendChild(el("span","ms-press-surface"));break}
    case C.SWITCH:{face.appendChild(el("span","ms-switch-track"));face.appendChild(el("span","ms-switch-thumb"));break}
    case C.XY:{face.appendChild(el("span","ms-xy-grid"));face.appendChild(el("span","ms-xy-dot"));break}
    case C.SCREEN:{face.appendChild(el("span","ms-screen-glass"));break}
    case C.METER:{face.appendChild(el("span","ms-meter-track"));face.appendChild(el("span","ms-meter-fill"));break}
    case C.LED:{face.appendChild(el("span","ms-led-lens"));break}
    case C.JACK:{face.appendChild(el("span","ms-jack-ring"));face.appendChild(el("span","ms-jack-hole"));break}
  }return root}
  function render(spec,options={}){const d=spec?.control?CS.define(spec):spec;if(!d?.control)throw new Error("ControlSurfaceRenderer requires a descriptor");const visual=SPEC.resolve(d.control,{...(d.meta?.visual||{}),...(options.visual||{}),...(d.variant?{variant:d.variant}:{})});return decorate(d,shell(d,visual))}
  function mount(parent,spec,options={}){const node=render(spec,options);parent.appendChild(node);return node}
  MS.ControlSurfaceRenderer=Object.freeze({render,mount,applyVars});
})(window);

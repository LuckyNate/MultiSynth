"use strict";
// CANON LOCK — CONTRACT / I/O LAYER.
// This file is one of the three canonical shared-control layers: library, spec, renderer.
// Any change to an existing canonical control in ANY of those three layers requires two confirmations:
// (1) Nate explicitly authorizes the exact proposed change; (2) that exact scope is repeated back and Nate explicitly confirms it again.
// Only then may that exact change be executed. Approval is single-use and does not authorize cleanup, refactors,
// adjacent controls, styling, behavior, renderer/spec changes, or other follow-up work outside the confirmed scope.
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{};

  // Controls live on modules. They are interactive/presentational module-surface elements.
  const MODULE_CONTROL=Object.freeze({
    KNOB:"knob", ENCODER:"encoder", TURNTABLE:"turntable", FADER:"fader", RIBBON:"ribbon", EXPRESSION:"expression",
    PAD:"pad", BUTTON:"button", SWITCH:"switch", XY:"xy", READOUT:"readout",
    SCREEN:"screen", OSCILLOSCOPE:"oscilloscope", METER:"meter", LED:"led"
  });

  // Node features live on nodes, not modules. They are not module controls.
  // JACK is a node connection feature. DECAL reuses the canonical decal rendering primitive for node artwork.
  const NODE_FEATURE=Object.freeze({
    JACK:"jack",
    DECAL:"decal"
  });

  // Backward-compatible surface-type union for existing renderer/spec code.
  // Do not use this union to classify JACK or DECAL as module controls; use MODULE_CONTROL or NODE_FEATURE.
  const CONTROL=Object.freeze({...MODULE_CONTROL,...NODE_FEATURE});

  const GESTURE=Object.freeze({
    TAP:"tap", DOUBLE_TAP:"doubleTap", HOLD:"hold", RELEASE:"release", DRAG:"drag",
    DRAG_X:"dragX", DRAG_Y:"dragY", CIRCULAR_DRAG:"circularDrag", SWIPE:"swipe",
    PRESS:"press", PRESS_DRAG:"pressDrag"
  });

  const ACTION=Object.freeze({
    SET_VALUE:"setValue", SET_X:"setX", SET_Y:"setY", STEP_VALUE:"stepValue",
    TOGGLE:"toggle", TRIGGER:"trigger", NOTE_ON:"noteOn", NOTE_OFF:"noteOff",
    BEGIN_HOLD:"beginHold", END_HOLD:"endHold", BEGIN_RECORD:"beginRecord", END_RECORD:"endRecord",
    BEGIN_AUTOMATION:"beginAutomation", END_AUTOMATION:"endAutomation",
    HOLD_AUTOMATION:"holdAutomation", RESUME_AUTOMATION:"resumeAutomation",
    RESET_VALUE:"resetValue", AUDITION:"audition", SELECT:"select", OPEN_SELECTOR:"openSelector",
    PAN:"pan", ZOOM:"zoom", ZOOM_TIME:"zoomTime",
    SCRUB:"scrub", SET_RATE:"setRate", START_TRANSPORT:"startTransport", STOP_TRANSPORT:"stopTransport",
    NOOP:"noop"
  });

  const DEFAULT_GESTURES=Object.freeze({
    [CONTROL.KNOB]:Object.freeze([GESTURE.TAP,GESTURE.HOLD,GESTURE.RELEASE,GESTURE.DRAG]),
    [CONTROL.ENCODER]:Object.freeze([GESTURE.TAP,GESTURE.HOLD,GESTURE.RELEASE,GESTURE.CIRCULAR_DRAG]),
    [CONTROL.TURNTABLE]:Object.freeze([GESTURE.PRESS,GESTURE.DRAG,GESTURE.RELEASE]),
    [CONTROL.FADER]:Object.freeze([GESTURE.TAP,GESTURE.PRESS,GESTURE.DRAG,GESTURE.RELEASE]),
    [CONTROL.RIBBON]:Object.freeze([GESTURE.TAP,GESTURE.PRESS,GESTURE.DRAG,GESTURE.RELEASE]),
    [CONTROL.EXPRESSION]:Object.freeze([GESTURE.TAP,GESTURE.PRESS,GESTURE.DRAG,GESTURE.RELEASE]),
    [CONTROL.PAD]:Object.freeze([GESTURE.TAP,GESTURE.PRESS,GESTURE.HOLD,GESTURE.RELEASE]),
    [CONTROL.BUTTON]:Object.freeze([GESTURE.TAP,GESTURE.PRESS,GESTURE.HOLD,GESTURE.RELEASE]),
    [CONTROL.SWITCH]:Object.freeze([GESTURE.TAP]),
    [CONTROL.XY]:Object.freeze([GESTURE.PRESS,GESTURE.DRAG,GESTURE.RELEASE]),
    [CONTROL.READOUT]:Object.freeze([]),
    [CONTROL.SCREEN]:Object.freeze([GESTURE.TAP,GESTURE.HOLD,GESTURE.DRAG,GESTURE.SWIPE]),
    [CONTROL.OSCILLOSCOPE]:Object.freeze([GESTURE.DRAG,GESTURE.RELEASE]),
    [CONTROL.METER]:Object.freeze([GESTURE.TAP]),
    [CONTROL.LED]:Object.freeze([]),
    [CONTROL.JACK]:Object.freeze([GESTURE.TAP,GESTURE.PRESS,GESTURE.DRAG,GESTURE.RELEASE]),
    [CONTROL.DECAL]:Object.freeze([])
  });

  const ACTIONS=new Set(Object.values(ACTION)),SURFACE_TYPES=new Set(Object.values(CONTROL)),GESTURES=new Set(Object.values(GESTURE));
  const readoutScopes=new WeakMap();
  function freezeMap(map){return Object.freeze(Object.fromEntries(Object.entries(map||{}).map(([k,v])=>[k,Object.freeze({...v})])))}
  function normalizeBinding(gesture,binding){if(!GESTURES.has(gesture))throw new Error("Unknown control gesture: "+gesture);const b=typeof binding==="string"?{action:binding}:{...(binding||{})};if(!ACTIONS.has(b.action))throw new Error("Unknown control action for "+gesture+": "+String(b.action));return Object.freeze({action:b.action,args:b.args==null?null:Object.freeze({...b.args})})}
  function normalizeValue(control,value){if(control===CONTROL.SWITCH){const source=value||{};return Object.freeze({default:!!(source.value??source.default??false),value:!!(source.value??source.default??false)})}return value?Object.freeze({...value}):null}
  function define(spec){if(!spec||!SURFACE_TYPES.has(spec.control))throw new Error("Unknown control surface type: "+String(spec?.control));const bindings={};for(const [gesture,binding] of Object.entries(spec.gestures||{}))bindings[gesture]=normalizeBinding(gesture,binding);const value=normalizeValue(spec.control,spec.value);return Object.freeze({control:spec.control,id:spec.id==null?null:String(spec.id),state:spec.state==null?null:String(spec.state),label:spec.label==null?null:String(spec.label),variant:spec.variant==null?null:String(spec.variant),value,gestures:freezeMap(bindings),meta:Object.freeze({...spec.meta})})}
  function supports(control,gesture){return SURFACE_TYPES.has(control)&&GESTURES.has(gesture)}
  function isDefaultGesture(control,gesture){return !!DEFAULT_GESTURES[control]?.includes(gesture)}
  function defaultsFor(control){return DEFAULT_GESTURES[control]||Object.freeze([])}
  function actionFor(descriptor,gesture){return descriptor?.gestures?.[gesture]||null}
  function validate(spec){try{return{ok:true,descriptor:define(spec),error:null}}catch(error){return{ok:false,descriptor:null,error}}}
  function compose(base,override){const a=base||{},b=override||{};return define({...a,...b,value:{...(a.value||{}),...(b.value||{})},gestures:{...(a.gestures||{}),...(b.gestures||{})},meta:{...(a.meta||{}),...(b.meta||{})}})}

  const readoutPending=new Map();let readoutFrame=0;
  function flushReadouts(){readoutFrame=0;for(const [target,value] of readoutPending){target.__ms14seg?.set(value)}readoutPending.clear()}
  function sendReadoutValue(readout,value){if(!readout)return;const target=typeof readout==="string"?document.getElementById(readout):readout?.root||readout;if(!target?.__ms14seg)return;readoutPending.set(target,value);if(!readoutFrame)readoutFrame=requestAnimationFrame(flushReadouts)}

  function readoutScope(moduleRoot){if(!moduleRoot)return null;let scope=readoutScopes.get(moduleRoot);if(!scope){scope=new Map();readoutScopes.set(moduleRoot,scope)}return scope}
  function mountReadout(host,spec={}){const d=spec?.control?define(spec):define({control:CONTROL.READOUT,id:spec.id,meta:{rows:spec.rows,columns:spec.columns,text:spec.text,lit:spec.lit,name:spec.name,moduleRoot:spec.moduleRoot}}),meta=d.meta||{},moduleRoot=meta.moduleRoot||spec.moduleRoot||null,name=meta.name??spec.name??d.id,renderer=MS.ControlSurfaceRenderer;if(!renderer?.mountReadout)throw new Error("ControlSurfaceRenderer.mountReadout is required");const api=renderer.mountReadout(host,d);if(moduleRoot&&name!=null){const scope=readoutScope(moduleRoot),key=String(name);if(scope.has(key))throw new Error("Duplicate readout name in module scope: "+key);scope.set(key,api);api.root.dataset.readoutName=key}return api}
  function valueReadout(moduleRoot,readout,value){if(arguments.length<3){sendReadoutValue(moduleRoot,readout);return}if(!moduleRoot||!readout)return;const target=readoutScopes.get(moduleRoot)?.get(String(readout));if(target)sendReadoutValue(target,value)}

  MS.ControlSurface=Object.freeze({MODULE_CONTROL,NODE_FEATURE,CONTROL,GESTURE,ACTION,DEFAULT_GESTURES,define,compose,validate,supports,isDefaultGesture,defaultsFor,actionFor,mountReadout,valueReadout,listControls:()=>Object.freeze(Object.values(MODULE_CONTROL)),listNodeFeatures:()=>Object.freeze(Object.values(NODE_FEATURE)),listGestures:()=>Object.freeze(Object.values(GESTURE)),listActions:()=>Object.freeze(Object.values(ACTION))});
})(window);

"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{};

  const CONTROL=Object.freeze({
    KNOB:"knob", DIAL:"dial", WHEEL:"wheel", FADER:"fader", RIBBON:"ribbon",
    PAD:"pad", BUTTON:"button", SWITCH:"switch", KEY:"key", XY:"xy",
    SCREEN:"screen", METER:"meter", LED:"led", JACK:"jack"
  });

  const GESTURE=Object.freeze({
    TAP:"tap", DOUBLE_TAP:"doubleTap", HOLD:"hold", RELEASE:"release", DRAG:"drag",
    DRAG_X:"dragX", DRAG_Y:"dragY", SWIPE:"swipe", PRESS:"press", PRESS_DRAG:"pressDrag"
  });

  const ACTION=Object.freeze({
    SET_VALUE:"setValue", SET_X:"setX", SET_Y:"setY", STEP_VALUE:"stepValue",
    TOGGLE:"toggle", TRIGGER:"trigger", NOTE_ON:"noteOn", NOTE_OFF:"noteOff",
    BEGIN_HOLD:"beginHold", END_HOLD:"endHold", BEGIN_RECORD:"beginRecord", END_RECORD:"endRecord",
    BEGIN_AUTOMATION:"beginAutomation", END_AUTOMATION:"endAutomation",
    HOLD_AUTOMATION:"holdAutomation", RESUME_AUTOMATION:"resumeAutomation",
    RESET_VALUE:"resetValue", AUDITION:"audition", SELECT:"select", OPEN_SELECTOR:"openSelector",
    PAN:"pan", ZOOM:"zoom", NOOP:"noop"
  });

  // Recommended interaction vocabulary for each control. These are defaults, not hard limits.
  const DEFAULT_GESTURES=Object.freeze({
    [CONTROL.KNOB]:Object.freeze([GESTURE.TAP,GESTURE.HOLD,GESTURE.RELEASE,GESTURE.DRAG]),
    [CONTROL.DIAL]:Object.freeze([GESTURE.TAP,GESTURE.HOLD,GESTURE.RELEASE,GESTURE.DRAG]),
    [CONTROL.WHEEL]:Object.freeze([GESTURE.PRESS,GESTURE.DRAG,GESTURE.RELEASE]),
    [CONTROL.FADER]:Object.freeze([GESTURE.TAP,GESTURE.PRESS,GESTURE.DRAG,GESTURE.RELEASE]),
    [CONTROL.RIBBON]:Object.freeze([GESTURE.TAP,GESTURE.PRESS,GESTURE.DRAG,GESTURE.RELEASE]),
    [CONTROL.PAD]:Object.freeze([GESTURE.TAP,GESTURE.PRESS]),
    [CONTROL.BUTTON]:Object.freeze([GESTURE.TAP,GESTURE.PRESS,GESTURE.HOLD,GESTURE.RELEASE]),
    [CONTROL.SWITCH]:Object.freeze([GESTURE.TAP]),
    [CONTROL.KEY]:Object.freeze([GESTURE.PRESS,GESTURE.RELEASE]),
    [CONTROL.XY]:Object.freeze([GESTURE.PRESS,GESTURE.DRAG,GESTURE.RELEASE]),
    [CONTROL.SCREEN]:Object.freeze([GESTURE.TAP,GESTURE.HOLD,GESTURE.DRAG,GESTURE.SWIPE]),
    [CONTROL.METER]:Object.freeze([GESTURE.TAP]),
    [CONTROL.LED]:Object.freeze([GESTURE.TAP]),
    [CONTROL.JACK]:Object.freeze([GESTURE.TAP,GESTURE.PRESS,GESTURE.DRAG,GESTURE.RELEASE])
  });

  const ACTIONS=new Set(Object.values(ACTION)),CONTROLS=new Set(Object.values(CONTROL)),GESTURES=new Set(Object.values(GESTURE));
  function freezeMap(map){return Object.freeze(Object.fromEntries(Object.entries(map||{}).map(([k,v])=>[k,Object.freeze({...v})])))}
  function normalizeBinding(gesture,binding){if(!GESTURES.has(gesture))throw new Error("Unknown control gesture: "+gesture);const b=typeof binding==="string"?{action:binding}:{...(binding||{})};if(!ACTIONS.has(b.action))throw new Error("Unknown control action for "+gesture+": "+String(b.action));return Object.freeze({action:b.action,args:b.args==null?null:Object.freeze({...b.args})})}
  function define(spec){if(!spec||!CONTROLS.has(spec.control))throw new Error("Unknown control surface type: "+String(spec?.control));const bindings={};for(const [gesture,binding] of Object.entries(spec.gestures||{}))bindings[gesture]=normalizeBinding(gesture,binding);const value=spec.value?Object.freeze({...spec.value}):null;return Object.freeze({control:spec.control,id:spec.id==null?null:String(spec.id),state:spec.state==null?null:String(spec.state),label:spec.label==null?null:String(spec.label),variant:spec.variant==null?null:String(spec.variant),value,gestures:freezeMap(bindings),meta:Object.freeze({...spec.meta})})}
  function supports(control,gesture){return CONTROLS.has(control)&&GESTURES.has(gesture)}
  function isDefaultGesture(control,gesture){return !!DEFAULT_GESTURES[control]?.includes(gesture)}
  function defaultsFor(control){return DEFAULT_GESTURES[control]||Object.freeze([])}
  function actionFor(descriptor,gesture){return descriptor?.gestures?.[gesture]||null}
  function validate(spec){try{return{ok:true,descriptor:define(spec),error:null}}catch(error){return{ok:false,descriptor:null,error}}}
  function compose(base,override){const a=base||{},b=override||{};return define({...a,...b,value:{...(a.value||{}),...(b.value||{})},gestures:{...(a.gestures||{}),...(b.gestures||{})},meta:{...(a.meta||{}),...(b.meta||{})}})}

  MS.ControlSurface=Object.freeze({CONTROL,GESTURE,ACTION,DEFAULT_GESTURES,define,compose,validate,supports,isDefaultGesture,defaultsFor,actionFor,listControls:()=>Object.freeze(Object.values(CONTROL)),listGestures:()=>Object.freeze(Object.values(GESTURE)),listActions:()=>Object.freeze(Object.values(ACTION))});
})(window);

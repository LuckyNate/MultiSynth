"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{};

  const CONTROL=Object.freeze({
    KNOB:"knob", ENCODER:"encoder", TURNTABLE:"turntable", FADER:"fader", RIBBON:"ribbon",
    PAD:"pad", BUTTON:"button", SWITCH:"switch", XY:"xy", READOUT:"readout",
    SCREEN:"screen", OSCILLOSCOPE:"oscilloscope", METER:"meter", LED:"led", JACK:"jack",
    // DECAL is a silent, non-interactive faceplate styling primitive. It does not bind state,
    // gestures, routing, or DSP. Modules opt in explicitly when they want printed artwork.
    DECAL:"decal"
  });

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
    [CONTROL.PAD]:Object.freeze([GESTURE.TAP,GESTURE.PRESS]),
    [CONTROL.BUTTON]:Object.freeze([GESTURE.TAP,GESTURE.PRESS,GESTURE.HOLD,GESTURE.RELEASE]),
    [CONTROL.SWITCH]:Object.freeze([GESTURE.TAP]),
    [CONTROL.XY]:Object.freeze([GESTURE.PRESS,GESTURE.DRAG,GESTURE.RELEASE]),
    [CONTROL.READOUT]:Object.freeze([]),
    [CONTROL.SCREEN]:Object.freeze([GESTURE.TAP,GESTURE.HOLD,GESTURE.DRAG,GESTURE.SWIPE]),
    [CONTROL.OSCILLOSCOPE]:Object.freeze([GESTURE.DRAG,GESTURE.RELEASE]),
    [CONTROL.METER]:Object.freeze([GESTURE.TAP]),
    [CONTROL.LED]:Object.freeze([GESTURE.TAP]),
    [CONTROL.JACK]:Object.freeze([GESTURE.TAP,GESTURE.PRESS,GESTURE.DRAG,GESTURE.RELEASE]),
    [CONTROL.DECAL]:Object.freeze([])
  });

  const ACTIONS=new Set(Object.values(ACTION)),CONTROLS=new Set(Object.values(CONTROL)),GESTURES=new Set(Object.values(GESTURE));
  function freezeMap(map){return Object.freeze(Object.fromEntries(Object.entries(map||{}).map(([k,v])=>[k,Object.freeze({...v})])))}
  function normalizeBinding(gesture,binding){if(!GESTURES.has(gesture))throw new Error("Unknown control gesture: "+gesture);const b=typeof binding==="string"?{action:binding}:{...(binding||{})};if(!ACTIONS.has(b.action))throw new Error("Unknown control action for "+gesture+": "+String(b.action));return Object.freeze({action:b.action,args:b.args==null?null:Object.freeze({...b.args})})}
  function normalizeValue(control,value){if(control===CONTROL.SWITCH){const source=value||{};return Object.freeze({default:!!(source.value??source.default??false),value:!!(source.value??source.default??false)})}return value?Object.freeze({...value}):null}
  function define(spec){if(!spec||!CONTROLS.has(spec.control))throw new Error("Unknown control surface type: "+String(spec?.control));const bindings={};for(const [gesture,binding] of Object.entries(spec.gestures||{}))bindings[gesture]=normalizeBinding(gesture,binding);const value=normalizeValue(spec.control,spec.value);return Object.freeze({control:spec.control,id:spec.id==null?null:String(spec.id),state:spec.state==null?null:String(spec.state),label:spec.label==null?null:String(spec.label),variant:spec.variant==null?null:String(spec.variant),value,gestures:freezeMap(bindings),meta:Object.freeze({...spec.meta})})}
  function supports(control,gesture){return CONTROLS.has(control)&&GESTURES.has(gesture)}
  function isDefaultGesture(control,gesture){return !!DEFAULT_GESTURES[control]?.includes(gesture)}
  function defaultsFor(control){return DEFAULT_GESTURES[control]||Object.freeze([])}
  function actionFor(descriptor,gesture){return descriptor?.gestures?.[gesture]||null}
  function validate(spec){try{return{ok:true,descriptor:define(spec),error:null}}catch(error){return{ok:false,descriptor:null,error}}}
  function compose(base,override){const a=base||{},b=override||{};return define({...a,...b,value:{...(a.value||{}),...(b.value||{})},gestures:{...(a.gestures||{}),...(b.gestures||{})},meta:{...(a.meta||{}),...(b.meta||{})}})}
  function mountReadout(host,spec={}){const D=MS.FourteenSegmentReadout;if(!D?.mount)return null;const d=spec?.control?define(spec):define({control:CONTROL.READOUT,id:spec.id,meta:{rows:spec.rows,columns:spec.columns,text:spec.text,lit:spec.lit}});const meta=d.meta||{};return D.mount(host,{id:d.id,rows:meta.rows??1,columns:meta.columns??1,text:meta.text??"",lit:!!meta.lit})}
  function valueReadout(readout,value){if(!readout)return;MS.FourteenSegmentReadout?.valueReadout?.(readout,value)}

  MS.ControlSurface=Object.freeze({CONTROL,GESTURE,ACTION,DEFAULT_GESTURES,define,compose,validate,supports,isDefaultGesture,defaultsFor,actionFor,mountReadout,valueReadout,listControls:()=>Object.freeze(Object.values(CONTROL)),listGestures:()=>Object.freeze(Object.values(GESTURE)),listActions:()=>Object.freeze(Object.values(ACTION))});
})(window);

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
    [CONTROL.LED]:Object.freeze([GESTURE.TAP]),
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

  // READOUT is canonical shared-control code. It lives here with the other canon controls;
  // the former standalone fourteen-segment file was development-only. Preserve this behavior exactly.
  // Character masks adapted from dmadison/LED-Segment-ASCII (MIT), 14-segment ASCII table.
  // Copyright (c) 2017 David Madison. https://github.com/dmadison/LED-Segment-ASCII
  const READOUT_MASKS=[0x0000,0x4006,0x0202,0x12CE,0x12ED,0x3FE4,0x2359,0x0200,0x2400,0x0900,0x3FC0,0x12C0,0x0800,0x00C0,0x4000,0x0C00,0x0C3F,0x0406,0x00DB,0x008F,0x00E6,0x2069,0x00FD,0x0007,0x00FF,0x00EF,0x1200,0x0A00,0x2440,0x00C8,0x0980,0x5083,0x02BB,0x00F7,0x128F,0x0039,0x120F,0x0079,0x0071,0x00BD,0x00F6,0x1209,0x001E,0x2470,0x0038,0x0536,0x2136,0x003F,0x00F3,0x203F,0x20F3,0x00ED,0x1201,0x003E,0x0C30,0x2836,0x2D00,0x00EE,0x0C09,0x0039,0x2100,0x000F,0x2800,0x0008,0x0100,0x1058,0x2078,0x00D8,0x088E,0x0858,0x14C0,0x048E,0x1070,0x1000,0x0A10,0x3600,0x0030,0x10D4,0x1050,0x00DC,0x0170,0x0486,0x0050,0x2088,0x0078,0x001C,0x0810,0x2814,0x2D00,0x028E,0x0848,0x0949,0x1200,0x2489,0x0CC0,0x0000];
  const READOUT_NS="http://www.w3.org/2000/svg";
  const READOUT_SEG={A:"M18 10 L62 10",B:"M66 14 L66 47",C:"M66 53 L66 86",D:"M18 90 L62 90",E:"M14 53 L14 86",F:"M14 14 L14 47",G1:"M18 50 L38 50",G2:"M42 50 L62 50",H:"M18 14 L38 47",J:"M40 14 L40 47",K:"M62 14 L42 47",L:"M38 53 L18 86",M:"M40 53 L40 86",N:"M42 53 L62 86"};
  const READOUT_ORDER=["A","B","C","D","E","F","G1","G2","H","J","K","L","M","N"];
  const READOUT_STYLE_ID="ms-14seg-shared-style";
  function installReadoutStyle(){if(document.getElementById(READOUT_STYLE_ID))return;const style=document.createElement("style");style.id=READOUT_STYLE_ID;style.textContent='.ms-14seg-readout{--ms-readout-screen:#687466;--ms-readout-border:#444b43;--ms-readout-on:#151815;--ms-readout-off:rgba(21,24,21,.14);--ms-readout-glow:none;display:grid;grid-template-columns:repeat(var(--ms-readout-cols),minmax(0,1fr));grid-template-rows:repeat(var(--ms-readout-rows),auto);gap:4px;padding:6px 8px;box-sizing:border-box;overflow:hidden;min-width:0;background:var(--ms-readout-screen);border:2px solid var(--ms-readout-border);border-radius:4px;box-shadow:inset 0 0 0 2px rgba(255,255,255,.05),inset 0 2px 8px rgba(0,0,0,.45)}.ms-14seg-cell{display:block;width:100%;height:auto;min-width:0}.ms-14seg-segment{fill:none;stroke:var(--ms-readout-off);stroke-width:6;stroke-linecap:round;stroke-linejoin:round}.ms-14seg-segment.is-on{stroke:var(--ms-readout-on);filter:var(--ms-readout-glow)}.ms-14seg-dp{fill:var(--ms-readout-on);stroke:none}.ms-14seg-unlit{--ms-readout-screen:#687466;--ms-readout-border:#444b43;--ms-readout-on:#151815;--ms-readout-off:rgba(21,24,21,.14);--ms-readout-glow:none}.ms-14seg-lit{--ms-readout-screen:color-mix(in srgb,var(--ms-control-bg,#202020) 78%,var(--ms-control-accent,#d8d8d8));--ms-readout-border:color-mix(in srgb,var(--ms-control-edge,#555) 68%,var(--ms-control-accent,#d8d8d8));--ms-readout-on:var(--ms-control-accent,#d8d8d8);--ms-readout-off:color-mix(in srgb,var(--ms-control-accent,#d8d8d8) 14%,transparent);--ms-readout-glow:drop-shadow(0 0 3px var(--ms-control-accent,#d8d8d8));box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--ms-control-fg,#e8e8e8) 10%,transparent),inset 0 2px 8px color-mix(in srgb,var(--ms-control-bg,#202020) 72%,#000),0 0 5px color-mix(in srgb,var(--ms-control-accent,#d8d8d8) 20%,transparent)}';document.head.appendChild(style)}
  function readoutMaskFor(ch){const c=(ch||" ").charCodeAt(0);return c>=32&&c<=127?READOUT_MASKS[c-32]:READOUT_MASKS[31]}
  function readoutCell(ch){const svg=document.createElementNS(READOUT_NS,"svg");svg.setAttribute("viewBox","0 0 80 100");svg.setAttribute("class","ms-14seg-cell");const mask=readoutMaskFor(ch);READOUT_ORDER.forEach((name,i)=>{const p=document.createElementNS(READOUT_NS,"path");p.setAttribute("d",READOUT_SEG[name]);p.setAttribute("class","ms-14seg-segment"+(mask&(1<<i)?" is-on":""));svg.appendChild(p)});if(mask&0x4000){const dp=document.createElementNS(READOUT_NS,"circle");dp.setAttribute("cx","73");dp.setAttribute("cy","90");dp.setAttribute("r","3");dp.setAttribute("class","ms-14seg-segment is-on ms-14seg-dp");svg.appendChild(dp)}return svg}
  function mountReadoutDisplay(host,{id=null,rows=1,columns=1,text="",lit=false}={}){if(!host)return null;installReadoutStyle();const root=document.createElement("div"),isLit=!!lit;root.className=`ms-14seg-readout ${isLit?"ms-14seg-lit":"ms-14seg-unlit"}`;if(id)root.id=id;root.dataset.control="readout";root.dataset.lit=isLit?"1":"0";root.style.setProperty("--ms-readout-cols",Math.max(1,columns|0));root.style.setProperty("--ms-readout-rows",Math.max(1,rows|0));host.appendChild(root);const api={root,rows:Math.max(1,rows|0),columns:Math.max(1,columns|0),lit:isLit,message:"",timer:0,index:0,render(value){const capacity=api.rows*api.columns,s=String(value??"").padEnd(capacity," ").slice(0,capacity);root.replaceChildren(...Array.from(s,readoutCell));return api},stop(){if(api.timer)clearInterval(api.timer);api.timer=0;return api},set(value){api.stop();api.message=String(value??"");api.index=0;const capacity=api.rows*api.columns;if(capacity>3&&api.message.length>capacity){const gap=" ".repeat(capacity),track=gap+api.message+gap;api.render(track.slice(0,capacity));api.timer=setInterval(()=>{api.index=(api.index+1)%(track.length-capacity+1);api.render(track.slice(api.index,api.index+capacity))},220);return api}return api.render(api.message)}};root.__ms14seg=api;return api.set(text)}
  const readoutPending=new Map();let readoutFrame=0;
  function flushReadouts(){readoutFrame=0;for(const [target,value] of readoutPending){target.__ms14seg?.set(value)}readoutPending.clear()}
  function sendReadoutValue(readout,value){if(!readout)return;const target=typeof readout==="string"?document.getElementById(readout):readout?.root||readout;if(!target?.__ms14seg)return;readoutPending.set(target,value);if(!readoutFrame)readoutFrame=requestAnimationFrame(flushReadouts)}

  function readoutScope(moduleRoot){if(!moduleRoot)return null;let scope=readoutScopes.get(moduleRoot);if(!scope){scope=new Map();readoutScopes.set(moduleRoot,scope)}return scope}
  function mountReadout(host,spec={}){const d=spec?.control?define(spec):define({control:CONTROL.READOUT,id:spec.id,meta:{rows:spec.rows,columns:spec.columns,text:spec.text,lit:spec.lit,name:spec.name,moduleRoot:spec.moduleRoot}});const meta=d.meta||{},moduleRoot=meta.moduleRoot||spec.moduleRoot||null,name=meta.name??spec.name??d.id;const api=mountReadoutDisplay(host,{rows:meta.rows??1,columns:meta.columns??1,text:meta.text??"",lit:!!meta.lit});if(moduleRoot&&name!=null){const scope=readoutScope(moduleRoot),key=String(name);if(scope.has(key))throw new Error("Duplicate readout name in module scope: "+key);scope.set(key,api);api.root.dataset.readoutName=key}return api}
  function valueReadout(moduleRoot,readout,value){if(arguments.length<3){sendReadoutValue(moduleRoot,readout);return}if(!moduleRoot||!readout)return;const target=readoutScopes.get(moduleRoot)?.get(String(readout));if(target)sendReadoutValue(target,value)}

  MS.ControlSurface=Object.freeze({MODULE_CONTROL,NODE_FEATURE,CONTROL,GESTURE,ACTION,DEFAULT_GESTURES,define,compose,validate,supports,isDefaultGesture,defaultsFor,actionFor,mountReadout,valueReadout,listControls:()=>Object.freeze(Object.values(MODULE_CONTROL)),listNodeFeatures:()=>Object.freeze(Object.values(NODE_FEATURE)),listGestures:()=>Object.freeze(Object.values(GESTURE)),listActions:()=>Object.freeze(Object.values(ACTION))});
})(window);
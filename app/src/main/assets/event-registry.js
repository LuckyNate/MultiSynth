"use strict";
(function(global){
 const MS=global.MultiSynth=global.MultiSynth||{};
 const EVENTS=Object.freeze({MODULE:"multisynth-module",NODE_GRAPH:"multisynth-node-graph",NODE_UI_ERROR:"multisynth-node-ui-error",FATHER_TIME_TICK:"multisynth-father-time-tick",FATHER_TIME_CV_TRIGGER:"multisynth-father-time-cv-trigger",FATHER_TIME_EXTERNAL_START:"multisynth-father-time-external-start",FATHER_TIME_EXTERNAL_STOP:"multisynth-father-time-external-stop"});
 const set=new Set(Object.values(EVENTS));
 MS.Events=Object.freeze({...EVENTS,ALL:Object.freeze([...set]),dispatch:(name,detail,target=global)=>target.dispatchEvent(new CustomEvent(name,{detail})),listen:(name,fn,target=global,options)=>{target.addEventListener(name,fn,options);return()=>target.removeEventListener(name,fn,options)},known:name=>set.has(String(name||""))});
})(window);

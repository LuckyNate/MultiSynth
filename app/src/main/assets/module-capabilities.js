"use strict";
(function(global){
 const MS=global.MultiSynth=global.MultiSynth||{};
 const FLAGS=Object.freeze({AUDIO_INPUT:"audioInput",AUDIO_OUTPUT:"audioOutput",GENERATOR:"generator",NOTE_INPUT:"noteInput",CV_INPUT:"cvInput",CV_OUTPUT:"cvOutput",CLOCK_SOURCE:"clockSource",CLOCK_FOLLOWER:"clockFollower",DIV_INPUT:"divInput",MIC:"mic",PCM:"pcm",MIDI:"midi",TERMINAL_OUTPUT:"terminalOutput"});
 const values=new Set(Object.values(FLAGS));
 const normalize=list=>Object.freeze([...new Set((Array.isArray(list)?list:[]).map(String).filter(x=>values.has(x)))]);
 const api=Object.freeze({...FLAGS,ALL:Object.freeze([...values]),normalize,has:(subject,flag)=>{const list=Array.isArray(subject)?subject:subject?.capabilities;return Array.isArray(list)&&list.includes(flag);},validate:list=>{const bad=(Array.isArray(list)?list:[]).filter(x=>!values.has(String(x)));return{ok:bad.length===0,unknown:bad.map(String)}}});
 MS.ModuleCapabilities=api;
})(window);

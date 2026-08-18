"use strict";
(function(global){
 const MS=global.MultiSynth=global.MultiSynth||{},M=MS.ModuleManifest,K=MS.ModuleCapabilities,S=MS.StateKeys;
 function metadata(type){return M?.get(type)||null}
 function has(type,flag,fallback=true){const meta=metadata(type);return !meta||!K?fallback:K.has(meta,flag)}
 function state(state,key,fallback){return S?S.get(state,key,fallback):(state&&Object.prototype.hasOwnProperty.call(state,key)?state[key]:fallback)}
 function patch(key,value){return S?S.patch(key,value):{[key]:value}}
 MS.ModuleBoundaries=Object.freeze({metadata,has,state,patch,canAudioIn:type=>has(type,K?.AUDIO_INPUT||"audioInput"),canAudioOut:type=>has(type,K?.AUDIO_OUTPUT||"audioOutput"),canNote:type=>has(type,K?.NOTE_INPUT||"noteInput"),canCVIn:type=>has(type,K?.CV_INPUT||"cvInput"),canCVOut:type=>has(type,K?.CV_OUTPUT||"cvOutput"),canClockSource:type=>has(type,K?.CLOCK_SOURCE||"clockSource"),canClockFollow:type=>has(type,K?.CLOCK_FOLLOWER||"clockFollower"),canDivIn:type=>has(type,K?.DIV_INPUT||"divInput")});
})(window);

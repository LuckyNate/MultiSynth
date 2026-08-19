"use strict";
(function(global){
 const MS=global.MultiSynth=global.MultiSynth||{},I=MS.ModuleIds,versions=new Map();
 function register(moduleId,version=1,migrate=null){const v=Math.max(1,Number(version)||1);versions.set(String(moduleId),Object.freeze({version:v,migrate:typeof migrate==="function"?migrate:null}));return v;}
 function versionFor(moduleId,fallback=1){return versions.get(String(moduleId))?.version||fallback;}
 function restore(moduleId,saved,savedVersion){const spec=versions.get(String(moduleId));if(!spec||!spec.migrate||!savedVersion||Number(savedVersion)>=spec.version)return saved;return spec.migrate(saved,Number(savedVersion),spec.version);}
 const declared=I?Object.freeze({
  [I.LIVE_WIRE]:1,[I.BEAT_RED]:1,[I.FATHER_TIME]:1,[I.WHITMAN]:1,[I.TIME_BANDITS]:3,[I.THE_CHOPPER]:1,[I.SAMPLE_SURGERY]:1,[I.SAMPLE_LIBRARY]:1,[I.BIG_DEAL]:1,[I.GRAIN_LIQOUR]:1,[I.BEEN_SERVED]:1,[I.GARAGE_BAND]:1,[I.MASTER_OF_LEVELS]:1,[I.DENZELS_EQUALIZER]:1,[I.ECHO_CANYON]:1,[I.CONTROL_FREAK]:1,[I.PURE_SYNTH]:1,[I.QUAD_SYNTH]:1,[I.PULSYNTH]:1,[I.SIN_LADDER]:1,[I.RAZORBACK]:1,[I.STINGER]:1,[I.NO_QUARTER]:1,[I.RANDRONE]:1,[I.HOOKWORM]:1,[I.TAPEWORM]:1,[I.TAIL_GATOR]:1
 }):Object.freeze({});
 for(const [moduleId,version] of Object.entries(declared))register(moduleId,version);
 MS.StateSchema=Object.freeze({register,versionFor,restore,declared,describe:moduleId=>versions.get(String(moduleId))||Object.freeze({version:1,migrate:null})});
})(window);

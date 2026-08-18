"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{},I=MS.ModuleIds;if(!I)return;
  const row=(id,editorUrl,category,color,capabilities=[],resources=[])=>{const ident=I.identityFor(id);if(!ident)throw new Error("Missing module identity: "+id);return Object.freeze({id:ident.id,displayName:ident.displayName,editorUrl,themeKey:ident.themeKey,category,color,capabilities:Object.freeze(capabilities.slice()),resources:Object.freeze(resources.slice())});};
  const M=Object.freeze({
    [I.LIVE_WIRE]:row(I.LIVE_WIRE,"live-wire.html","input","#72d7ff",["audioOutput","generator"],["nativeAudio"]),
    [I.BEAT_RED]:row(I.BEAT_RED,"rack-module-editor.html","rhythm","#d64b4b",["audioInput","audioOutput","clockFollower","cvInput"],[]),
    [I.FATHER_TIME]:row(I.FATHER_TIME,"rack-module-editor.html","clock","#8d6b45",["audioInput","audioOutput","clockSource","clockFollower","cvInput","cvOutput","midi"],["midi","storage"]),
    [I.WHITMAN]:row(I.WHITMAN,"rack-module-editor.html","sampler","#6b3f24",["audioInput","audioOutput","noteInput","clockFollower","cvInput","pcm","mic"],["pcm","mic","storage"]),
    [I.TIME_DIVIDER]:row(I.TIME_DIVIDER,"rack-module-editor.html","clock","#7b78d4",["audioInput","audioOutput","clockFollower","divInput","cvInput","cvOutput"],[]),
    [I.THE_CHOPPER]:row(I.THE_CHOPPER,"the-chopper.html","sampler","#b88952",["audioInput","audioOutput","pcm","mic"],["pcm","mic","storage"]),
    [I.SAMPLE_SURGERY]:row(I.SAMPLE_SURGERY,"sample-surgery.html","utility","#7fc9b2",["pcm"],["pcm","storage"]),
    [I.SAMPLE_LIBRARY]:row(I.SAMPLE_LIBRARY,"sample-library.html","utility","#c8b57a",["pcm"],["pcm","storage"]),
    [I.BIG_DEAL]:row(I.BIG_DEAL,"rack-module-editor.html","granular","#b4232f",["audioInput","audioOutput","pcm"],["pcm","storage"]),
    [I.GRAIN_LIQOUR]:row(I.GRAIN_LIQOUR,"rack-module-editor.html","granular","#8d5fa8",["audioInput","audioOutput","pcm"],["pcm","storage"]),
    [I.BEEN_SERVED]:row(I.BEEN_SERVED,"been-served.html","effect","#d6a04b",["audioInput","audioOutput"],[]),
    [I.GARAGE_BAND]:row(I.GARAGE_BAND,"garage-band.html","effect","#8b8b8b",["audioInput","audioOutput"],[]),
    [I.MASTER_OF_LEVELS]:row(I.MASTER_OF_LEVELS,"master-of-levels.html","utility","#d0d0d0",["audioInput","audioOutput","terminalOutput"],[]),
    [I.DENZELS_EQUALIZER]:row(I.DENZELS_EQUALIZER,"rack-module-editor.html","effect","#72b9a7",["audioInput","audioOutput"],[]),
    [I.ECHO_CANYON]:row(I.ECHO_CANYON,"rack-module-editor.html","effect","#c47b48",["audioInput","audioOutput"],[]),
    [I.CONTROL_FREAK]:row(I.CONTROL_FREAK,"control-freak.html","controller","#75b7ff",["noteInput","midi","cvOutput"],["midi"]),
    [I.PURE_SYNTH]:row(I.PURE_SYNTH,"rack-module-editor.html","instrument","#f4f4f0",["audioInput","audioOutput","generator","noteInput","cvInput"],[]),
    [I.QUAD_SYNTH]:row(I.QUAD_SYNTH,"rack-module-editor.html","instrument","#ffb000",["audioInput","audioOutput","generator","noteInput","cvInput"],[]),
    [I.PULSYNTH]:row(I.PULSYNTH,"rack-module-editor.html","instrument","#58ff78",["audioInput","audioOutput","generator","noteInput","cvInput"],[]),
    [I.SIN_LADDER]:row(I.SIN_LADDER,"rack-module-editor.html","instrument","#36eaff",["audioInput","audioOutput","generator","noteInput","cvInput"],[]),
    [I.RAZORBACK]:row(I.RAZORBACK,"rack-module-editor.html","instrument","#ff3d42",["audioInput","audioOutput","generator","noteInput","cvInput"],[]),
    [I.STINGER]:row(I.STINGER,"rack-module-editor.html","instrument","#ffe64a",["audioInput","audioOutput","generator","noteInput","cvInput"],[]),
    [I.NO_QUARTER]:row(I.NO_QUARTER,"rack-module-editor.html","instrument","#77a4ff",["audioInput","audioOutput","generator","noteInput","cvInput"],[]),
    [I.RANDRONE]:row(I.RANDRONE,"rack-module-editor.html","generator","#9efcff",["audioInput","audioOutput","generator","cvInput","clockFollower"],[]),
    [I.HOOKWORM]:row(I.HOOKWORM,"rack-module-editor.html","looper","#e98232",["audioInput","audioOutput","mic","clockFollower"],["mic","storage"]),
    [I.TAPEWORM]:row(I.TAPEWORM,"rack-module-editor.html","looper","#f58ab3",["audioInput","audioOutput","mic","clockFollower"],["mic","storage"]),
    [I.TAIL_GATOR]:row(I.TAIL_GATOR,"tail-gator.html","routing","#5aa66f",["audioInput","audioOutput","terminalOutput"],[])
  });
  const api=Object.freeze({all:Object.freeze(Object.values(M)),get:id=>M[I.canonicalId(id)]||null,require:id=>{const m=M[I.canonicalId(id)];if(!m)throw new Error("Missing module manifest metadata: "+id);return m;},has:id=>!!M[I.canonicalId(id)]});
  MS.ModuleManifest=api;
})(window);

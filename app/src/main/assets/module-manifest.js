"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{},I=MS.ModuleIds;if(!I)return;
  const row=(id,displayName,editorUrl,themeKey,category,color,capabilities=[],resources=[])=>Object.freeze({id,displayName,editorUrl,themeKey,category,color,capabilities:Object.freeze(capabilities.slice()),resources:Object.freeze(resources.slice())});
  const M=Object.freeze({
    [I.LIVE_WIRE]:row(I.LIVE_WIRE,"Live Wire","live-wire.html",I.LIVE_WIRE,"input","#72d7ff",["audioOutput","generator"],["nativeAudio"]),
    [I.BEAT_RED]:row(I.BEAT_RED,"Beat Red","rack-module-editor.html",I.BEAT_RED,"rhythm","#d64b4b",["audioInput","audioOutput","clockFollower","cvInput"],[]),
    [I.FATHER_TIME]:row(I.FATHER_TIME,"Father Time","rack-module-editor.html",I.FATHER_TIME,"clock","#8d6b45",["audioInput","audioOutput","clockSource","clockFollower","cvInput","cvOutput","midi"],["midi","storage"]),
    [I.WHITMAN]:row(I.WHITMAN,"Whitman","rack-module-editor.html",I.WHITMAN,"sampler","#6b3f24",["audioInput","audioOutput","noteInput","clockFollower","cvInput","pcm","mic"],["pcm","mic","storage"]),
    [I.TIME_DIVIDER]:row(I.TIME_DIVIDER,"Time Divider","rack-module-editor.html",I.TIME_DIVIDER,"clock","#7b78d4",["audioInput","audioOutput","clockFollower","divInput","cvInput","cvOutput"],[]),
    [I.THE_CHOPPER]:row(I.THE_CHOPPER,"The Chopper","the-chopper.html",I.THE_CHOPPER,"sampler","#b88952",["audioInput","audioOutput","pcm","mic"],["pcm","mic","storage"]),
    [I.SAMPLE_SURGERY]:row(I.SAMPLE_SURGERY,"Sample Surgery","sample-surgery.html",I.SAMPLE_SURGERY,"utility","#7fc9b2",["pcm"],["pcm","storage"]),
    [I.SAMPLE_LIBRARY]:row(I.SAMPLE_LIBRARY,"Sample Library","sample-library.html",I.SAMPLE_LIBRARY,"utility","#c8b57a",["pcm"],["pcm","storage"]),
    [I.BIG_DEAL]:row(I.BIG_DEAL,"Big Deal","rack-module-editor.html",I.BIG_DEAL,"granular","#b4232f",["audioInput","audioOutput","pcm"],["pcm","storage"]),
    [I.GRAIN_LIQOUR]:row(I.GRAIN_LIQOUR,"Grain Liqour","rack-module-editor.html",I.GRAIN_LIQOUR,"granular","#8d5fa8",["audioInput","audioOutput","pcm"],["pcm","storage"]),
    [I.BEEN_SERVED]:row(I.BEEN_SERVED,"Been Served","been-served.html",I.BEEN_SERVED,"effect","#d6a04b",["audioInput","audioOutput"],[]),
    [I.GARAGE_BAND]:row(I.GARAGE_BAND,"Garage Band","garage-band.html",I.GARAGE_BAND,"effect","#8b8b8b",["audioInput","audioOutput"],[]),
    [I.MASTER_OF_LEVELS]:row(I.MASTER_OF_LEVELS,"Master of Levels","master-of-levels.html",I.MASTER_OF_LEVELS,"utility","#d0d0d0",["audioInput","audioOutput","terminalOutput"],[]),
    [I.DENZELS_EQUALIZER]:row(I.DENZELS_EQUALIZER,"Denzel's Equalizer","rack-module-editor.html",I.DENZELS_EQUALIZER,"effect","#72b9a7",["audioInput","audioOutput"],[]),
    [I.ECHO_CANYON]:row(I.ECHO_CANYON,"Echo Canyon","rack-module-editor.html",I.ECHO_CANYON,"effect","#c47b48",["audioInput","audioOutput"],[]),
    [I.CONTROL_FREAK]:row(I.CONTROL_FREAK,"Control Freak","control-freak.html",I.CONTROL_FREAK,"controller","#75b7ff",["noteInput","midi","cvOutput"],["midi"]),
    [I.PURE_SYNTH]:row(I.PURE_SYNTH,"PureSynth",null,I.PURE_SYNTH,"instrument",null,["audioInput","audioOutput","generator","noteInput","cvInput"],[]),
    [I.QUAD_SYNTH]:row(I.QUAD_SYNTH,"QuadSynth",null,I.QUAD_SYNTH,"instrument",null,["audioInput","audioOutput","generator","noteInput","cvInput"],[]),
    [I.PULSYNTH]:row(I.PULSYNTH,"Pulsynth",null,I.PULSYNTH,"instrument",null,["audioInput","audioOutput","generator","noteInput","cvInput"],[]),
    [I.SIN_LADDER]:row(I.SIN_LADDER,"SinLadder",null,I.SIN_LADDER,"instrument",null,["audioInput","audioOutput","generator","noteInput","cvInput"],[]),
    [I.RAZORBACK]:row(I.RAZORBACK,"Razorback",null,I.RAZORBACK,"instrument",null,["audioInput","audioOutput","generator","noteInput","cvInput"],[]),
    [I.STINGER]:row(I.STINGER,"Stinger",null,I.STINGER,"instrument",null,["audioInput","audioOutput","generator","noteInput","cvInput"],[]),
    [I.NO_QUARTER]:row(I.NO_QUARTER,"No Quarter",null,I.NO_QUARTER,"instrument",null,["audioInput","audioOutput","generator","noteInput","cvInput"],[]),
    [I.RANDRONE]:row(I.RANDRONE,"Randrone",null,I.RANDRONE,"generator",null,["audioInput","audioOutput","generator","cvInput","clockFollower"],[]),
    [I.HOOKWORM]:row(I.HOOKWORM,"Hookworm",null,I.HOOKWORM,"looper",null,["audioInput","audioOutput","mic","clockFollower"],["mic"]),
    [I.TAPEWORM]:row(I.TAPEWORM,"Tapeworm",null,I.TAPEWORM,"looper",null,["audioInput","audioOutput","mic","clockFollower"],["mic"]),
    [I.TAIL_GATOR]:row(I.TAIL_GATOR,"Tail Gator","tail-gator.html",I.TAIL_GATOR,"routing","#5aa66f",["audioInput","audioOutput","terminalOutput"],[])
  });
  const api=Object.freeze({all:Object.freeze(Object.values(M)),get:id=>M[String(id||"")]||null,require:id=>{const m=M[String(id||"")];if(!m)throw new Error("Missing module manifest metadata: "+id);return m;},has:id=>!!M[String(id||"")]});
  MS.ModuleManifest=api;
})(window);

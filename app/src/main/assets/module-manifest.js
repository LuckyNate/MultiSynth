"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{},I=MS.ModuleIds,B=MS.ModuleBoilerplate;if(!I)return;
  const has=(caps,flag)=>caps.includes(flag);
  function routingFor(capabilities,overrides={}){
    const audioIn=has(capabilities,"audioInput"),audioOut=has(capabilities,"audioOutput"),generator=has(capabilities,"generator"),terminal=has(capabilities,"terminalOutput"),clockSource=has(capabilities,"clockSource"),clockFollower=has(capabilities,"clockFollower"),cvIn=has(capabilities,"cvInput"),cvOut=has(capabilities,"cvOutput"),notes=has(capabilities,"noteInput");
    const base={audioRole:terminal?"terminal":generator?"generator":audioIn&&audioOut?"processor":audioOut?"generator":"none",carrierBehavior:!audioIn?"none":generator?"add":terminal?"passthrough":"transform",stereoBehavior:audioIn||audioOut?"stereoPreserve":"none",timingRole:clockSource&&clockFollower?"sourceFollower":clockSource?"source":clockFollower?"follower":"none",cvBehavior:cvIn&&cvOut?"moduleSpecific":cvIn?"moduleSpecific":cvOut?"source":"default",voiceMode:Object.freeze({mode:notes?"moduleSpecific":"none",maxVoices:null,steal:"none"}),bypassBehavior:audioIn&&audioOut?"dedicatedCarrierOutput":"none",latencySamples:0};
    return Object.freeze({...base,...overrides,voiceMode:Object.freeze({...base.voiceMode,...(overrides.voiceMode||{})})});
  }
  const row=(id,category,color,capabilities=[],resources=[],routing={})=>{const ident=I.identityFor(id);if(!ident)throw new Error("Missing module identity: "+id);const caps=Object.freeze(capabilities.slice()),route=routingFor(caps,routing),role=B?.infer(caps,route)||"root",ports=B?.require(role)?.ports?.slice?.()||[];return Object.freeze({id:ident.id,displayName:ident.displayName,editorUrl:ident.editorUrl,moduleScript:ident.moduleScript,themeKey:ident.themeKey||ident.id,category,color,capabilities:caps,resources:Object.freeze(resources.slice()),boilerplateRole:role,boilerplatePorts:Object.freeze(ports),routing:route});};
  const M=Object.freeze({
    [I.LIVE_WIRE]:row(I.LIVE_WIRE,"input","#72d7ff",["audioOutput","generator"],["nativeAudio"]),
    [I.BEAT_RED]:row(I.BEAT_RED,"rhythm","#d64b4b",["audioInput","audioOutput","clockFollower","cvInput"],[],{carrierBehavior:"add"}),
    [I.FATHER_TIME]:row(I.FATHER_TIME,"clock","#8d6b45",["audioInput","audioOutput","clockSource","clockFollower","cvInput","cvOutput","midi"],["midi","storage"],{audioRole:"passthrough",carrierBehavior:"passthrough"}),
    [I.WS]:row(I.WS,"sampler","#6b3f24",["audioInput","audioOutput","noteInput","clockFollower","cvInput","pcm"],["pcm","storage"],{carrierBehavior:"add"}),
    [I.TIME_BANDITS]:row(I.TIME_BANDITS,"rhythm","#c89b52",["audioInput","audioOutput","clockSource","clockFollower","cvInput","cvOutput"],[],{carrierBehavior:"add"}),
    [I.THE_CHOPPER]:row(I.THE_CHOPPER,"sampler","#b88952",["audioInput","audioOutput","pcm","mic"],["pcm","mic","storage"]),
    [I.SAMPLE_SURGERY]:row(I.SAMPLE_SURGERY,"utility","#7fc9b2",["pcm"],["pcm","storage"]),
    [I.SAMPLE_LIBRARY]:row(I.SAMPLE_LIBRARY,"utility","#c8b57a",["pcm"],["pcm","storage"]),
    [I.BIG_DEAL]:row(I.BIG_DEAL,"granular","#b4232f",["audioInput","audioOutput","pcm"],["pcm","storage"]),
    [I.BIG_MOUTH]:row(I.BIG_MOUTH,"effect","#ff4f87",["audioInput","audioOutput","pcm","mic"],["pcm","mic","storage"]),
    [I.GRAIN_LIQOUR]:row(I.GRAIN_LIQOUR,"granular","#8d5fa8",["audioInput","audioOutput","pcm"],["pcm","storage"]),
    [I.BEEN_SERVED]:row(I.BEEN_SERVED,"effect","#d6a04b",["audioInput","audioOutput"],[]),
    [I.GARAGE_BAND]:row(I.GARAGE_BAND,"effect","#8b8b8b",["audioInput","audioOutput"],[]),
    [I.MASTER_OF_LEVELS]:row(I.MASTER_OF_LEVELS,"utility","#d0d0d0",["audioInput","audioOutput","terminalOutput"],[],{audioRole:"terminal"}),
    [I.DENZELS_EQUALIZER]:row(I.DENZELS_EQUALIZER,"effect","#72b9a7",["audioInput","audioOutput"],[]),
    [I.ECHO_CANYON]:row(I.ECHO_CANYON,"effect","#c47b48",["audioInput","audioOutput"],[]),
    [I.CONTROL_FREAK]:row(I.CONTROL_FREAK,"controller","#75b7ff",["noteInput","midi","cvOutput"],["midi"]),
    [I.LOWRIDER_LFO]:row(I.LOWRIDER_LFO,"modulator","#d6aa3c",["audioOutput","generator","cvOutput"],[],{audioRole:"generator",cvBehavior:"source"}),
    [I.UNSTABLE_DIFFUSION]:row(I.UNSTABLE_DIFFUSION,"instrument","#e8e8e8",["audioInput","audioOutput","generator","noteInput","pcm"],["pcm","storage"],{audioRole:"processor",carrierBehavior:"transform"}),
    [I.PURE_SYNTH]:row(I.PURE_SYNTH,"instrument","#f4f4f0",["audioInput","audioOutput","generator","noteInput","cvInput"],[]),
    [I.QUAD_SYNTH]:row(I.QUAD_SYNTH,"instrument","#ffb000",["audioInput","audioOutput","generator","noteInput","cvInput"],[]),
    [I.PULSYNTH]:row(I.PULSYNTH,"instrument","#58ff78",["audioInput","audioOutput","generator","noteInput","cvInput"],[]),
    [I.SIN_LADDER]:row(I.SIN_LADDER,"instrument","#36eaff",["audioInput","audioOutput","generator","noteInput","cvInput"],[]),
    [I.RAZORBACK]:row(I.RAZORBACK,"instrument","#ff3d42",["audioInput","audioOutput","generator","noteInput","cvInput"],[]),
    [I.STINGER]:row(I.STINGER,"instrument","#ffe64a",["audioInput","audioOutput","generator","noteInput","cvInput"],[]),
    [I.NO_QUARTER]:row(I.NO_QUARTER,"instrument","#77a4ff",["audioInput","audioOutput","generator","noteInput","cvInput"],[]),
    [I.RANDRONE]:row(I.RANDRONE,"generator","#9efcff",["audioInput","audioOutput","generator","cvInput","clockFollower"],[]),
    [I.HOOKWORM]:row(I.HOOKWORM,"looper","#e98232",["audioInput","audioOutput","mic","clockFollower"],["mic","storage"]),
    [I.TAPEWORM]:row(I.TAPEWORM,"looper","#f58ab3",["audioInput","audioOutput","mic","clockFollower"],["mic","storage"]),
    [I.TAIL_GATOR]:row(I.TAIL_GATOR,"routing","#5aa66f",["audioInput","audioOutput","terminalOutput"],[],{audioRole:"terminal",carrierBehavior:"passthrough"}),
    [I.BLUETOOTH_OUTPUT]:row(I.BLUETOOTH_OUTPUT,"routing","#6fb7ff",["audioInput","audioOutput","terminalOutput"],["nativeAudio"],{audioRole:"terminal",carrierBehavior:"passthrough"})
  });
  MS.ModuleManifest=Object.freeze({all:Object.freeze(Object.values(M)),get:id=>M[I.canonicalId(id)]||null,require:id=>{const m=M[I.canonicalId(id)];if(!m)throw new Error("Missing module manifest metadata: "+id);return m},has:id=>!!M[I.canonicalId(id)]});
})(window);

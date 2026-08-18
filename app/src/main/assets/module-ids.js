"use strict";
(function(global){
  const IDS=Object.freeze({
    LIVE_WIRE:"live-wire",
    BEAT_RED:"beat-red",
    FATHER_TIME:"father-time",
    WHITMAN:"whitman",
    TIME_DIVIDER:"time-divider",
    THE_CHOPPER:"the-chopper",
    SAMPLE_SURGERY:"sample-surgery",
    SAMPLE_LIBRARY:"sample-library",
    BIG_DEAL:"big-deal",
    GRAIN_LIQOUR:"grain-liqour",
    BEEN_SERVED:"been-served",
    GARAGE_BAND:"garage-band",
    MASTER_OF_LEVELS:"master-of-levels",
    DENZELS_EQUALIZER:"denzels-equalizer",
    ECHO_CANYON:"echo-canyon",
    CONTROL_FREAK:"control-freak",
    PURE_SYNTH:"puresynth",
    QUAD_SYNTH:"quadsynth",
    PULSYNTH:"pulsynth",
    SIN_LADDER:"sinladder",
    RAZORBACK:"razorback",
    STINGER:"stinger",
    NO_QUARTER:"no-quarter",
    RANDRONE:"randrone",
    HOOKWORM:"hookworm",
    TAPEWORM:"tapeworm",
    TAIL_GATOR:"tail-gator"
  });
  const THEMES=Object.freeze({
    LIVE_WIRE:"live-wire",BEAT_RED:"beat-red",FATHER_TIME:"father-time",WHITMAN:"whitman",TIME_DIVIDER:"time-divider",
    THE_CHOPPER:"the-chopper",SAMPLE_SURGERY:"sample-surgery",SAMPLE_LIBRARY:"sample-library",BIG_DEAL:"big-deal",GRAIN_LIQOUR:"grain-liqour",
    BEEN_SERVED:"been-served",GARAGE_BAND:"garage-band",MASTER_OF_LEVELS:"master-of-levels",DENZELS_EQUALIZER:"denzels-equalizer",ECHO_CANYON:"echo-canyon",
    CONTROL_FREAK:"control-freak",PURE_SYNTH:"puresynth",QUAD_SYNTH:"quadsynth",PULSYNTH:"pulsynth",SIN_LADDER:"sinladder",RAZORBACK:"razorback",
    STINGER:"stinger",NO_QUARTER:"no-quarter",RANDRONE:"randrone",HOOKWORM:"hookworm",TAPEWORM:"tapeworm",TAIL_GATOR:"tail-gator"
  });
  const NAMES=Object.freeze({
    "Live Wire":IDS.LIVE_WIRE,"Beat Red":IDS.BEAT_RED,"Father Time":IDS.FATHER_TIME,Whitman:IDS.WHITMAN,"Time Divider":IDS.TIME_DIVIDER,
    "The Chopper":IDS.THE_CHOPPER,"Sample Surgery":IDS.SAMPLE_SURGERY,"Sample Library":IDS.SAMPLE_LIBRARY,"Big Deal":IDS.BIG_DEAL,"Grain Liqour":IDS.GRAIN_LIQOUR,
    "Been Served":IDS.BEEN_SERVED,"Garage Band":IDS.GARAGE_BAND,"Master of Levels":IDS.MASTER_OF_LEVELS,"Denzel's Equalizer":IDS.DENZELS_EQUALIZER,"Echo Canyon":IDS.ECHO_CANYON,
    "Control Freak":IDS.CONTROL_FREAK,PureSynth:IDS.PURE_SYNTH,QuadSynth:IDS.QUAD_SYNTH,Pulsynth:IDS.PULSYNTH,SinLadder:IDS.SIN_LADDER,Razorback:IDS.RAZORBACK,
    Stinger:IDS.STINGER,"No Quarter":IDS.NO_QUARTER,Randrone:IDS.RANDRONE,Hookworm:IDS.HOOKWORM,Tapeworm:IDS.TAPEWORM,"Tail Gator":IDS.TAIL_GATOR
  });
  const VALUES=Object.freeze(Object.values(IDS)),SET=new Set(VALUES),ID_TO_KEY=new Map(Object.entries(IDS).map(([k,v])=>[v,k]));
  const norm=v=>String(v||"").trim().toLowerCase().replace(/[_\s]+/g,"-");
  const NORMALIZED_IDS=new Map(VALUES.map(v=>[norm(v),v]));
  const NORMALIZED_NAMES=new Map(Object.entries(NAMES).map(([name,id])=>[norm(name),id]));
  const LEGACY_ALIASES=Object.freeze({
    "sample-chopper":IDS.THE_CHOPPER
  });
  const canonicalId=value=>{const raw=String(value||"");if(SET.has(raw))return raw;const n=norm(raw);return LEGACY_ALIASES[n]||NORMALIZED_IDS.get(n)||NORMALIZED_NAMES.get(n)||raw;};
  const api=Object.freeze({
    ...IDS,
    ALL:VALUES,
    BY_DISPLAY_NAME:NAMES,
    LEGACY_ALIASES,
    canonicalId,
    has:id=>SET.has(canonicalId(id)),
    is:(id,key)=>canonicalId(id)===IDS[key],
    any:(id,keys)=>Array.isArray(keys)&&keys.some(k=>canonicalId(id)===IDS[k]),
    require:key=>{const id=IDS[key];if(!id)throw new Error("Unknown module identity key: "+key);return id;},
    keyFor:id=>ID_TO_KEY.get(canonicalId(id))||null,
    forDisplayName:name=>NAMES[String(name||"")]||NORMALIZED_NAMES.get(norm(name))||null,
    themeFor:id=>{const canonical=canonicalId(id),key=ID_TO_KEY.get(canonical);return key?THEMES[key]:canonical;},
    canonicalDefinition:def=>{const id=canonicalId(NAMES[String(def?.displayName||"")]||String(def?.type||""));if(!SET.has(id))throw new Error("Module identity is not registered: "+String(def?.displayName||def?.type||"UNKNOWN"));const key=ID_TO_KEY.get(id);return{...def,type:id,selectorClass:key?THEMES[key]:id};}
  });
  global.MultiSynth=global.MultiSynth||{};
  global.MultiSynth.ModuleIds=api;
})(window);

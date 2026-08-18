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
  const VALUES=Object.freeze(Object.values(IDS));
  const SET=new Set(VALUES);
  const api=Object.freeze({
    ...IDS,
    ALL:VALUES,
    has:id=>SET.has(String(id||"")),
    is:(id,key)=>String(id||"")===IDS[key],
    any:(id,keys)=>Array.isArray(keys)&&keys.some(k=>String(id||"")===IDS[k]),
    require:key=>{const id=IDS[key];if(!id)throw new Error("Unknown module identity key: "+key);return id;}
  });
  global.MultiSynth=global.MultiSynth||{};
  global.MultiSynth.ModuleIds=api;
})(window);

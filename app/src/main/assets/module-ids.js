"use strict";
(function(global){
  // One authoritative identity row per module.
  // id is the canonical filename/reference stem used everywhere.
  const entry=(id,displayName)=>Object.freeze({
    id,
    displayName,
    themeKey:id,
    editorUrl:id+".html",
    moduleScript:"modules/"+id+".js"
  });
  const CATALOG=Object.freeze({
    LIVE_WIRE:entry("live-wire","Live Wire"),
    BEAT_RED:entry("beat-red","Beat Red"),
    FATHER_TIME:entry("father-time","Father Time"),
    WHITMAN:entry("whitman","Whitman"),
    TIME_DIVIDER:entry("time-divider","Time Divider"),
    THE_CHOPPER:entry("the-chopper","The Chopper"),
    SAMPLE_SURGERY:entry("sample-surgery","Sample Surgery"),
    SAMPLE_LIBRARY:entry("sample-library","Sample Library"),
    BIG_DEAL:entry("big-deal","Big Deal"),
    GRAIN_LIQOUR:entry("grain-liqour","Grain Liqour"),
    BEEN_SERVED:entry("been-served","Been Served"),
    GARAGE_BAND:entry("garage-band","Garage Band"),
    MASTER_OF_LEVELS:entry("master-of-levels","Master of Levels"),
    DENZELS_EQUALIZER:entry("denzels-equalizer","Denzel's Equalizer"),
    ECHO_CANYON:entry("echo-canyon","Echo Canyon"),
    CONTROL_FREAK:entry("control-freak","Control Freak"),
    PURE_SYNTH:entry("puresynth","PureSynth"),
    QUAD_SYNTH:entry("quadsynth","QuadSynth"),
    PULSYNTH:entry("pulsynth","Pulsynth"),
    SIN_LADDER:entry("sinladder","SinLadder"),
    RAZORBACK:entry("razorback","Razorback"),
    STINGER:entry("stinger","Stinger"),
    NO_QUARTER:entry("no-quarter","No Quarter"),
    RANDRONE:entry("randrone","Randrone"),
    HOOKWORM:entry("hookworm","Hookworm"),
    TAPEWORM:entry("tapeworm","Tapeworm"),
    TAIL_GATOR:entry("tail-gator","Tail Gator")
  });
  const IDS=Object.freeze(Object.fromEntries(Object.entries(CATALOG).map(([k,v])=>[k,v.id])));
  const VALUES=Object.freeze(Object.values(IDS)),SET=new Set(VALUES),ID_TO_KEY=new Map(Object.entries(IDS).map(([k,v])=>[v,k]));
  const BY_DISPLAY_NAME=Object.freeze(Object.fromEntries(Object.values(CATALOG).map(v=>[v.displayName,v.id])));
  const norm=v=>String(v||"").trim().toLowerCase().replace(/[_\s]+/g,"-");
  const NORMALIZED_IDS=new Map(VALUES.map(v=>[norm(v),v]));
  const NORMALIZED_NAMES=new Map(Object.values(CATALOG).map(v=>[norm(v.displayName),v.id]));
  const canonicalId=value=>{const raw=String(value||"");if(SET.has(raw))return raw;const n=norm(raw);return NORMALIZED_IDS.get(n)||NORMALIZED_NAMES.get(n)||raw;};
  const keyFor=id=>ID_TO_KEY.get(canonicalId(id))||null;
  const identityFor=value=>{const key=CATALOG[String(value||"")]?String(value):keyFor(value);return key?CATALOG[key]:null;};
  const api=Object.freeze({
    ...IDS,
    CATALOG,
    ALL:VALUES,
    BY_DISPLAY_NAME,
    canonicalId,
    identityFor,
    has:id=>SET.has(canonicalId(id)),
    is:(id,key)=>canonicalId(id)===IDS[key],
    any:(id,keys)=>Array.isArray(keys)&&keys.some(k=>canonicalId(id)===IDS[k]),
    require:key=>{const row=CATALOG[key];if(!row)throw new Error("Unknown module identity key: "+key);return row.id;},
    requireIdentity:key=>{const row=CATALOG[key];if(!row)throw new Error("Unknown module identity key: "+key);return row;},
    keyFor,
    forDisplayName:name=>BY_DISPLAY_NAME[String(name||"")]||NORMALIZED_NAMES.get(norm(name))||null,
    displayNameFor:id=>identityFor(id)?.displayName||String(id||""),
    themeFor:id=>identityFor(id)?.id||canonicalId(id),
    editorFor:id=>identityFor(id)?.editorUrl||canonicalId(id)+".html",
    scriptFor:id=>identityFor(id)?.moduleScript||"modules/"+canonicalId(id)+".js",
    canonicalDefinition:def=>{const id=canonicalId(String(def?.type||""));if(!SET.has(id))throw new Error("Module identity is not registered: "+String(def?.type||"UNKNOWN"));const ident=identityFor(id);return{...def,type:id,displayName:ident.displayName,selectorClass:id,editorUrl:ident.editorUrl};}
  });
  global.MultiSynth=global.MultiSynth||{};
  global.MultiSynth.ModuleIds=api;
})(window);

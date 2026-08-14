"use strict";

/* Turns RackEngine geometry into the live Web Audio graph. */
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{};
const E=()=>MS.RackEngine,C=()=>MS.ModuleContract;
let ctx=null,master=null,limiter=null;
const rackIO=new Map();
let rebuilding=false;

function ensureContext(){
 if(ctx)return ctx;
 const A=global.AudioContext||global.webkitAudioContext;if(!A)throw new Error("Web Audio unavailable");
 ctx=new A({latencyHint:"interactive"});
 master=ctx.createGain();master.gain.value=.82;
 limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-3;limiter.knee.value=3;limiter.ratio.value=20;limiter.attack.value=.002;limiter.release.value=.08;
 master.connect(limiter);limiter.connect(ctx.destination);return ctx;
}
function runtime(mid,rack){try{return C().getRuntime(mid);}catch(_){return E().createModuleRuntime(rack.id,mid,{audioContext:ensureContext(),native:MS.rack?.native||null});}}
function disconnectNode(n){try{n?.disconnect?.();}catch(_){}}
function io(rack){let x=rackIO.get(rack.id);if(x)return x;const c=ensureContext();x={input:c.createGain(),output:c.createGain(),sink:c.createGain()};x.input.gain.value=1;x.output.gain.value=Number.isFinite(rack.gain)?rack.gain:1;x.sink.gain.value=1;rackIO.set(rack.id,x);return x;}
function cleanup(valid){for(const [id,x] of rackIO)if(!valid.has(id)){disconnectNode(x.input);disconnectNode(x.output);disconnectNode(x.sink);rackIO.delete(id);}}

function rebuild(){
 if(rebuilding)return;rebuilding=true;
 try{
  const c=ensureContext(),g=E().graph(),valid=new Set(g.racks.map(r=>r.id));cleanup(valid);
  for(const r of g.racks){const x=io(r);disconnectNode(x.input);disconnectNode(x.output);disconnectNode(x.sink);x.output.gain.value=Number.isFinite(r.gain)?r.gain:1;
   const active=r.modules.filter(m=>m.enabled!==false);let previous=x.input;
   for(const m of active){const rt=runtime(m.id,r);disconnectNode(rt.input);disconnectNode(rt.output);if(rt.input){previous.connect(rt.input);previous=rt.output||rt.input;}else if(rt.output){previous=rt.output;}}
   previous.connect(x.output);
  }
  /* Spatial edges: parent output fans to each occupied local child input. */
  for(const edge of g.edges){const a=rackIO.get(edge.from),b=rackIO.get(edge.to);if(a&&b)a.output.connect(b.input);}
  /* Only terminal racks reach the master. Parents are heard through descendants. */
  for(const r of g.racks){const x=rackIO.get(r.id),n=E().neighborhood(r.id);if(x&&n.children.length===0)x.output.connect(master);}
  global.dispatchEvent(new CustomEvent("multisynth-audio-graph",{detail:{type:"rebuilt",racks:g.racks.length,edges:g.edges.length}}));
 }finally{rebuilding=false;}
}
function resume(){ensureContext();return ctx.state==="suspended"?ctx.resume():Promise.resolve();}
function setMaster(v){ensureContext();master.gain.setTargetAtTime(Math.max(0,Math.min(1,Number(v)||0)),ctx.currentTime,.01);}
function noteOn(note,velocity=127){resume();for(const r of E().graph().racks){for(const m of r.modules){if(m.enabled!==false&&m.type==="puresynth")try{MS.PureSynthModule.noteOn(m.id,note,velocity);}catch(_){}}}}
function noteOff(note){for(const r of E().graph().racks)for(const m of r.modules)if(m.enabled!==false&&m.type==="puresynth")try{MS.PureSynthModule.noteOff(m.id,note);}catch(_){}
function panic(){for(const r of E().graph().racks)for(const m of r.modules)if(m.type==="puresynth")try{MS.PureSynthModule.panic(m.id);}catch(_){}
function start(){ensureContext();E().on("graph-changed",rebuild);rebuild();return api;}
const api=Object.freeze({start,rebuild,resume,setMaster,noteOn,noteOff,panic,get context(){return ensureContext();},getRackIO:id=>rackIO.get(id)||null});
MS.RackAudioGraph=api;
})(window);

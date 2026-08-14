"use strict";

/* Spatial rack audio graph: water only flows downhill. */
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{};
const E=()=>MS.RackEngine,C=()=>MS.ModuleContract;
let ctx=null,master=null,limiter=null,collector=null,rebuilding=false,started=false;
const rackIO=new Map();

function ensureContext(){
 if(ctx)return ctx;
 const A=global.AudioContext||global.webkitAudioContext;if(!A)throw new Error("Web Audio unavailable");
 ctx=new A({latencyHint:"interactive"});
 collector=ctx.createGain();collector.gain.value=1;
 master=ctx.createGain();master.gain.value=.82;
 limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-3;limiter.knee.value=3;limiter.ratio.value=20;limiter.attack.value=.002;limiter.release.value=.08;
 collector.connect(master);master.connect(limiter);limiter.connect(ctx.destination);return ctx;
}
function runtime(mid,rack){try{return C().getRuntime(mid);}catch(_){return E().createModuleRuntime(rack.id,mid,{audioContext:ensureContext(),native:MS.rack?.native||null});}}
function disconnect(n){try{n?.disconnect?.();}catch(_){}}
function makeIO(rack){const c=ensureContext();const parentIn=[c.createGain(),c.createGain(),c.createGain()],inputMix=c.createGain(),output=c.createGain(),childOut=[c.createGain(),c.createGain(),c.createGain()];parentIn.forEach(n=>{n.gain.value=1;n.connect(inputMix);});inputMix.gain.value=1;output.gain.value=Number.isFinite(rack.gain)?rack.gain:1;childOut.forEach(n=>n.gain.value=1);return{parentIn,inputMix,output,childOut};}
function io(rack){let x=rackIO.get(rack.id);if(!x){x=makeIO(rack);rackIO.set(rack.id,x);}return x;}
function cleanup(valid){for(const[id,x]of rackIO)if(!valid.has(id)){[...x.parentIn,x.inputMix,x.output,...x.childOut].forEach(disconnect);rackIO.delete(id);}}
function relationSlot(from,to){const dr=to.row-from.row,dc=to.col-from.col;if(dr!==1||dc<-1||dc>1)return null;return dc+1;}
function parentSlot(parent,child){const dc=parent.col-child.col;if(parent.row!==child.row-1||dc<-1||dc>1)return null;return dc+1;}

function rebuild(){
 if(rebuilding)return;rebuilding=true;
 try{
  ensureContext();const g=E().graph(),byId=new Map(g.racks.map(r=>[r.id,r])),valid=new Set(byId.keys());cleanup(valid);disconnect(collector);collector.connect(master);
  for(const r of g.racks){const x=io(r);[...x.parentIn,x.inputMix,x.output,...x.childOut].forEach(disconnect);x.parentIn.forEach(n=>n.connect(x.inputMix));x.output.gain.value=Number.isFinite(r.gain)?r.gain:1;
   const active=r.modules.filter(m=>m.enabled!==false);let previous=x.inputMix;
   for(const m of active){const rt=runtime(m.id,r);disconnect(rt.input);disconnect(rt.output);if(rt.input){previous.connect(rt.input);previous=rt.output||rt.input;}else if(rt.output){previous=rt.output;}}
   previous.connect(x.output);x.childOut.forEach(out=>x.output.connect(out));
  }
  for(const edge of g.edges){const p=byId.get(edge.from),c=byId.get(edge.to);if(!p||!c)continue;const cs=relationSlot(p,c),ps=parentSlot(p,c);if(cs===null||ps===null)continue;const a=rackIO.get(p.id),b=rackIO.get(c.id);a.childOut[cs].connect(b.parentIn[ps]);}
  const leaves=g.racks.filter(r=>E().neighborhood(r.id).children.length===0);
  for(const leaf of leaves)rackIO.get(leaf.id)?.output.connect(collector);
  global.dispatchEvent(new CustomEvent("multisynth-audio-graph",{detail:{type:"rebuilt",racks:g.racks.length,edges:g.edges.length,leaves:leaves.map(r=>r.id)}}));
 }finally{rebuilding=false;}
}
function resume(){ensureContext();return ctx.state==="suspended"?ctx.resume():Promise.resolve();}
function setMaster(v){ensureContext();master.gain.setTargetAtTime(Math.max(0,Math.min(1,Number(v)||0)),ctx.currentTime,.01);}
function start(){ensureContext();if(!started){E().on("graph-changed",rebuild);started=true;}rebuild();return api;}
function noteOn(note,velocity=127){resume();for(const r of E().graph().racks)for(const m of r.modules)if(m.enabled!==false&&m.type==="puresynth")try{MS.PureSynthModule.noteOn(m.id,note,velocity);}catch(_){}}
function noteOff(note){for(const r of E().graph().racks)for(const m of r.modules)if(m.enabled!==false&&m.type==="puresynth")try{MS.PureSynthModule.noteOff(m.id,note);}catch(_){}
function panic(){for(const r of E().graph().racks)for(const m of r.modules)if(m.type==="puresynth")try{MS.PureSynthModule.panic(m.id);}catch(_){}
const api=Object.freeze({start,rebuild,resume,setMaster,noteOn,noteOff,panic,get context(){return ensureContext();},get collector(){ensureContext();return collector;},getRackIO:id=>rackIO.get(id)||null});
MS.RackAudioGraph=api;
})(window);

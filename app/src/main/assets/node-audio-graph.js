"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{},E=()=>MS.NodeGraphEngine,C=()=>MS.ModuleContract,M=()=>MS.ModuleManifest;
let ctx=null,collector=null,master=null,limiter=null,masterAnalyser=null,started=false,queued=false;let links=[];
function ensureContext(){if(ctx)return ctx;const A=global.AudioContext||global.webkitAudioContext;if(!A)throw new Error("Web Audio unavailable");ctx=new A({latencyHint:"interactive"});collector=ctx.createGain();master=ctx.createGain();master.gain.value=.82;limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-3;limiter.ratio.value=20;masterAnalyser=ctx.createAnalyser();masterAnalyser.fftSize=1024;collector.connect(master);master.connect(limiter);limiter.connect(masterAnalyser);limiter.connect(ctx.destination);return ctx}
function caps(m){try{return M()?.get?.(m.type)?.capabilities||[]}catch(_){return[]}}
function has(m,cap){return caps(m).includes(cap)}
function runtime(m){try{return C().getRuntime(m.id)}catch(_){return E().createModuleRuntime(m.id,{audioContext:ensureContext(),native:MS.rack?.native||null,rack:{hasUpstream:false}})}}
function clearLinks(){for(const[a,b]of links)try{a.disconnect(b)}catch(_){}links=[]}
function link(a,b){if(!a||!b)return;try{a.connect(b);links.push([a,b])}catch(e){console.error("Node audio link",e)}}
function rebuildNow(){queued=false;ensureContext();clearLinks();const g=E().graph(),by=new Map(g.modules.map(m=>[m.id,m])),incoming=new Set(),outgoing=new Set();for(const e of g.connections||[]){if(e.type!=="audio")continue;const a=E().parseNode(e.from),b=E().parseNode(e.to);if(a?.signal!=="carrier"||b?.signal!=="carrier")continue;incoming.add(b.id);outgoing.add(a.id)}for(const m of g.modules){const rt=runtime(m);if(rt?.rack)rt.rack.hasUpstream=incoming.has(m.id);try{C().update(m.id,{})}catch(_){}}for(const e of g.connections||[]){if(e.type!=="audio")continue;const a=E().parseNode(e.from),b=E().parseNode(e.to),ma=by.get(a?.id),mb=by.get(b?.id);if(!ma||!mb||a.signal!=="carrier"||b.signal!=="carrier")continue;const ra=runtime(ma),rb=runtime(mb);link(ra?.output,rb?.input)}for(const m of g.modules){if(outgoing.has(m.id))continue;const rt=runtime(m);if(rt?.output)link(rt.output,collector)} }
function rebuild(){if(queued)return;queued=true;queueMicrotask(rebuildNow)}
function start(){ensureContext();if(!started){E().on("graph-changed",rebuild);started=true}rebuild();return api}
function resume(){ensureContext();return ctx.state==="suspended"?ctx.resume():Promise.resolve()}
function eachNote(fn){for(const m of E().graph().modules)if(m.enabled!==false&&has(m,"noteInput")){runtime(m);try{fn(m)}catch(e){console.error(e)}}}
const api=Object.freeze({start,rebuild,resume,noteOn:(n,v=127)=>{resume();let count=0;eachNote(m=>{if(C().noteOn(m.id,n,v))count++});return count},noteOff:n=>{let count=0;eachNote(m=>{if(C().noteOff(m.id,n))count++});return count},panic:()=>eachNote(m=>C().panic(m.id)),sendCV:(source,packet)=>MS.CvBus?.send?.(source,packet),setMaster:v=>{ensureContext();master.gain.setTargetAtTime(Math.max(0,Math.min(1,Number(v)||0)),ctx.currentTime,.01)},get context(){return ensureContext()},get collector(){ensureContext();return collector},get masterAnalyser(){ensureContext();return masterAnalyser}});
MS.NodeAudioGraph=api;
})(window);

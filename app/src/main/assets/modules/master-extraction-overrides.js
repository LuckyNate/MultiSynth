"use strict";
(function(global){
const C=global.MultiSynth?.ModuleContract;if(!C)return;
const types=["puresynth","quadsynth","pulsynth","sinladder","razorback","stinger","noquarter"];
function neutralize(u,type){if(!u)return;const now=u.ctx?.currentTime||0;try{u.master?.gain?.cancelScheduledValues(now);u.master?.gain?.setValueAtTime(1,now);}catch(_){try{u.master.gain.value=1}catch(__){}}if(type==="quadsynth"){try{u.quad?.drive?.gain?.cancelScheduledValues(now);u.quad?.drive?.gain?.setValueAtTime(1,now);}catch(_){try{u.quad.drive.gain.value=1}catch(__){}}try{if(u.quad?.clipper)u.quad.clipper.curve=null;}catch(_){}}}
for(const type of types){let old;try{old=C.getDefinition(type);}catch(_){continue;}const d={...old,version:String(old.version||"")+"-master-extracted",defaults:{...(old.defaults||{})}};delete d.defaults.master;delete d.defaults.masterLevel;if(type==="quadsynth"){delete d.defaults.drive;delete d.defaults.clip;}d.create=api=>{const u=old.create?old.create(api):null;neutralize(u,type);return u;};d.setState=args=>{old.setState?.(args);neutralize(args.runtime?.user,type);};d.restore=({saved})=>{const s=old.restore?old.restore({saved}):{...(saved||{})};delete s.master;delete s.masterLevel;if(type==="quadsynth"){delete s.drive;delete s.clip;}return s;};C.define(d);}
})(window);

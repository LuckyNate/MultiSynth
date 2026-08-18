"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{},C=MS.ModuleContract;
if(!C)return;
C.define({type:"live-wire",displayName:"Live Wire",category:"source",version:"1",color:"#ffd21f",selectorClass:"live-wire",description:"DEVICE AUDIO · HOLD TO SAMPLE",editorUrl:"live-wire.html",defaults:{live:true},create(api){const ctx=api.context;if(!ctx)return{};const out=ctx.createGain(),src=ctx.createBufferSource?ctx.createGain():null;out.gain.value=1;api.setOutput(out);let next=ctx.currentTime,off=null;
function chunk(pcm,rate){if(!pcm?.length)return;const b=ctx.createBuffer(1,pcm.length,rate||ctx.sampleRate);b.getChannelData(0).set(pcm);const s=ctx.createBufferSource();s.buffer=b;s.connect(out);const t=Math.max(ctx.currentTime+.015,next);s.start(t);next=t+b.duration;s.onended=()=>{try{s.disconnect()}catch(_){}}}
off=MS.LiveWireNative?.onChunk(chunk)||null;MS.LiveWireNative?.start?.();return{out,off}},destroy({runtime}){try{runtime.user?.off?.()}catch(_){}try{runtime.user?.out?.disconnect()}catch(_){}}});
})(window);
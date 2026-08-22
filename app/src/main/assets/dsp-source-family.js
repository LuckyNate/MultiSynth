"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{};
const OSC_TYPES=new Set(["sine","square","triangle","sawtooth"]);
function oscillator(ctx,type="sine",frequency=null){if(!ctx?.createOscillator)throw new Error("AudioContext oscillator unavailable");const o=ctx.createOscillator();o.type=OSC_TYPES.has(type)?type:"sine";if(Number.isFinite(Number(frequency)))o.frequency.value=Number(frequency);return o}
function constant(ctx,value=0){if(!ctx?.createConstantSource)throw new Error("AudioContext constant source unavailable");const s=ctx.createConstantSource();s.offset.value=Number(value)||0;return s}
function bufferSource(ctx,buffer=null,loop=false){if(!ctx?.createBufferSource)throw new Error("AudioContext buffer source unavailable");const s=ctx.createBufferSource();if(buffer)s.buffer=buffer;s.loop=!!loop;return s}
function shapedBuffer(ctx,frames,shape){const n=Math.max(1,Math.floor(frames)||1),b=ctx.createBuffer(1,n,ctx.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=shape(i,n);return b}
function noiseBuffer(ctx,color="white",seconds=1){const n=Math.max(128,Math.floor(ctx.sampleRate*Math.max(.001,Number(seconds)||1))),b=ctx.createBuffer(1,n,ctx.sampleRate),a=b.getChannelData(0);let red=0,prev=0,b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;for(let i=0;i<n;i++){const w=Math.random()*2-1;if(color==="red"){red=(red+.02*w)/1.02;a[i]=red*3.5}else if(color==="blue"){a[i]=(w-prev)*.7;prev=w}else if(color==="pink"){b0=.99886*b0+w*.0555179;b1=.99332*b1+w*.0750759;b2=.969*b2+w*.153852;b3=.8665*b3+w*.3104856;b4=.55*b4+w*.5329522;b5=-.7616*b5-w*.016898;a[i]=(b0+b1+b2+b3+b4+b5+b6+w*.5362)*.11;b6=w*.115926}else a[i]=w}return b}
function noise(ctx,color="white",seconds=1,loop=true){return bufferSource(ctx,noiseBuffer(ctx,color,seconds),loop)}
function liveNoise(ctx,bufferSize=1024){if(!ctx?.createScriptProcessor)throw new Error("AudioContext live-noise source unavailable");const n=ctx.createScriptProcessor(bufferSize,1,1);n.onaudioprocess=e=>{const d=e.outputBuffer.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1};return n}
MS.DspSources=Object.freeze({oscillator,constant,bufferSource,shapedBuffer,noiseBuffer,noise,liveNoise});
})(window);

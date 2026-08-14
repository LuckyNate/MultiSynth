"use strict";
(function(){
  const oldButton=document.getElementById("runButton");
  if(!oldButton||!window.MultiSynthNativeMic)return;
  const button=oldButton.cloneNode(true);
  oldButton.replaceWith(button);
  let unsubscribe=null,nextChunkTime=0;

  function feedChunk(pcm,sr){
    if(!running||!ctx||!inputGain||!pcm.length)return;
    const rate=Number(sr)||48000;
    const b=ctx.createBuffer(1,pcm.length,rate);
    b.getChannelData(0).set(pcm);
    const s=ctx.createBufferSource();
    s.buffer=b;
    s.connect(inputGain);
    const now=ctx.currentTime;
    if(nextChunkTime<now-.02||nextChunkTime>now+.18)nextChunkTime=now+.008;
    const when=Math.max(now+.004,nextChunkTime);
    s.start(when);
    nextChunkTime=when+b.duration;
    s.onended=()=>{try{s.disconnect()}catch(_){}};
  }

  async function startNativeTape(){
    if(running)return stopNativeTape();
    try{
      const A=window.AudioContext||window.webkitAudioContext;
      ctx=new A({latencyHint:"interactive"});
      await ctx.resume();
      inputGain=ctx.createGain();
      delay=ctx.createDelay(MAX_DELAY_SECONDS+.2);
      tapeFilter=ctx.createBiquadFilter();tapeFilter.type="lowpass";
      tapeSaturation=ctx.createWaveShaper();tapeSaturation.oversample="2x";
      feedbackGain=ctx.createGain();dryGain=ctx.createGain();echoGain=ctx.createGain();outputGain=ctx.createGain();
      analyser=ctx.createAnalyser();analyser.fftSize=1024;
      inputGain.connect(dryGain);dryGain.connect(outputGain);
      inputGain.connect(delay);delay.connect(tapeFilter);tapeFilter.connect(tapeSaturation);tapeSaturation.connect(echoGain);echoGain.connect(outputGain);
      tapeSaturation.connect(feedbackGain);feedbackGain.connect(delay);
      wowOsc=ctx.createOscillator();wowOsc.type="sine";wowOsc.frequency.value=.55;wowDepth=ctx.createGain();wowOsc.connect(wowDepth);wowDepth.connect(delay.delayTime);wowOsc.start();
      flutterOsc=ctx.createOscillator();flutterOsc.type="sine";flutterOsc.frequency.value=7.3;flutterDepth=ctx.createGain();flutterOsc.connect(flutterDepth);flutterDepth.connect(delay.delayTime);flutterOsc.start();
      hissSource=ctx.createBufferSource();hissSource.buffer=makeNoiseBuffer(ctx);hissSource.loop=true;hissGain=ctx.createGain();hissSource.connect(hissGain);hissGain.connect(tapeFilter);hissSource.start();
      outputGain.connect(analyser);analyser.connect(ctx.destination);
      unsubscribe=MultiSynthNativeMic.subscribe(feedChunk);
      if(!MultiSynthNativeMic.start())throw new Error("native microphone unavailable");
      nextChunkTime=ctx.currentTime+.01;
      running=true;
      button.textContent="STOP TAPE";button.classList.add("active");statusEl.textContent="TAPE RUNNING // NATIVE MIC";
      applyDSP(true);drawScope();
    }catch(error){
      console.error(error);statusEl.textContent="INPUT ERROR";await stopNativeTape(true);
    }
  }

  async function stopNativeTape(preserveError=false){
    try{if(unsubscribe)unsubscribe()}catch(_){}unsubscribe=null;
    try{MultiSynthNativeMic.stop()}catch(_){}
    const wasError=preserveError||statusEl.textContent==="INPUT ERROR";
    await stopTape();
    button.textContent="START TAPE";button.classList.remove("active");
    if(wasError)statusEl.textContent="INPUT ERROR";
  }

  button.addEventListener("click",startNativeTape);
  window.addEventListener("pagehide",()=>{if(running)stopNativeTape()});
})();

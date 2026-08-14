"use strict";
(function(){
  const oldButton=document.getElementById("runButton");
  if(!oldButton||!window.MultiSynthNativeMic)return;

  const button=oldButton.cloneNode(true);
  oldButton.replaceWith(button);

  let unsubscribe=null;
  let streamNode=null;
  let pcmQueue=[];
  let queueOffset=0;
  let queuedFrames=0;

  const TARGET_QUEUE_FRAMES=2048;
  const MAX_QUEUE_FRAMES=16384;

  function clearQueue(){
    pcmQueue=[];
    queueOffset=0;
    queuedFrames=0;
  }

  function trimQueue(){
    while(queuedFrames>MAX_QUEUE_FRAMES&&pcmQueue.length){
      const first=pcmQueue[0];
      const remaining=first.length-queueOffset;
      pcmQueue.shift();
      queuedFrames-=remaining;
      queueOffset=0;
    }
  }

  function feedChunk(pcm,sr){
    if(!running||!ctx||!streamNode||!pcm||!pcm.length)return;

    const sourceRate=Number(sr)||48000;
    let data=pcm;

    // Android currently supplies 48 kHz PCM. Resample only if the WebAudio
    // context is running at a different rate so pitch/timing stay correct.
    if(sourceRate!==ctx.sampleRate){
      const ratio=ctx.sampleRate/sourceRate;
      const outLength=Math.max(1,Math.round(pcm.length*ratio));
      const resampled=new Float32Array(outLength);
      for(let i=0;i<outLength;i++){
        const pos=i/ratio;
        const a=Math.floor(pos);
        const b=Math.min(pcm.length-1,a+1);
        const t=pos-a;
        resampled[i]=pcm[a]*(1-t)+pcm[b]*t;
      }
      data=resampled;
    }

    pcmQueue.push(data);
    queuedFrames+=data.length;
    trimQueue();
  }

  function makeContinuousStreamNode(context){
    // ScriptProcessor is used intentionally here as a continuously pulled PCM
    // sink. Unlike scheduling one AudioBufferSource per Android mic chunk, this
    // presents one uninterrupted live stream to the existing Tapeworm graph.
    const node=context.createScriptProcessor(1024,0,1);
    let primed=false;

    node.onaudioprocess=function(event){
      const out=event.outputBuffer.getChannelData(0);
      out.fill(0);

      if(!running)return;
      if(!primed){
        if(queuedFrames<TARGET_QUEUE_FRAMES)return;
        primed=true;
      }

      let write=0;
      while(write<out.length&&pcmQueue.length){
        const first=pcmQueue[0];
        const available=first.length-queueOffset;
        const count=Math.min(available,out.length-write);
        out.set(first.subarray(queueOffset,queueOffset+count),write);
        write+=count;
        queueOffset+=count;
        queuedFrames-=count;

        if(queueOffset>=first.length){
          pcmQueue.shift();
          queueOffset=0;
        }
      }

      // If Android/JS delivery briefly underruns, output silence rather than
      // replaying old microphone audio. Re-prime a small queue before resuming.
      if(write<out.length)primed=false;
    };

    return node;
  }

  async function startNativeTape(){
    if(running)return stopNativeTape();
    try{
      const A=window.AudioContext||window.webkitAudioContext;
      ctx=new A({latencyHint:"interactive"});
      await ctx.resume();

      clearQueue();
      inputGain=ctx.createGain();
      delay=ctx.createDelay(MAX_DELAY_SECONDS+.2);
      tapeFilter=ctx.createBiquadFilter();
      tapeFilter.type="lowpass";
      tapeSaturation=ctx.createWaveShaper();
      tapeSaturation.oversample="2x";
      feedbackGain=ctx.createGain();
      dryGain=ctx.createGain();
      echoGain=ctx.createGain();
      outputGain=ctx.createGain();
      analyser=ctx.createAnalyser();
      analyser.fftSize=1024;

      streamNode=makeContinuousStreamNode(ctx);
      streamNode.connect(inputGain);

      inputGain.connect(dryGain);
      dryGain.connect(outputGain);
      inputGain.connect(delay);
      delay.connect(tapeFilter);
      tapeFilter.connect(tapeSaturation);
      tapeSaturation.connect(echoGain);
      echoGain.connect(outputGain);
      tapeSaturation.connect(feedbackGain);
      feedbackGain.connect(delay);

      wowOsc=ctx.createOscillator();
      wowOsc.type="sine";
      wowOsc.frequency.value=.55;
      wowDepth=ctx.createGain();
      wowOsc.connect(wowDepth);
      wowDepth.connect(delay.delayTime);
      wowOsc.start();

      flutterOsc=ctx.createOscillator();
      flutterOsc.type="sine";
      flutterOsc.frequency.value=7.3;
      flutterDepth=ctx.createGain();
      flutterOsc.connect(flutterDepth);
      flutterDepth.connect(delay.delayTime);
      flutterOsc.start();

      hissSource=ctx.createBufferSource();
      hissSource.buffer=makeNoiseBuffer(ctx);
      hissSource.loop=true;
      hissGain=ctx.createGain();
      hissSource.connect(hissGain);
      hissGain.connect(tapeFilter);
      hissSource.start();

      outputGain.connect(analyser);
      analyser.connect(ctx.destination);

      running=true;
      unsubscribe=MultiSynthNativeMic.subscribe(feedChunk);
      if(!MultiSynthNativeMic.start())throw new Error("native microphone unavailable");

      button.textContent="STOP TAPE";
      button.classList.add("active");
      statusEl.textContent="TAPE RUNNING // LIVE MIC";
      applyDSP(true);
      drawScope();
    }catch(error){
      console.error(error);
      statusEl.textContent="INPUT ERROR";
      await stopNativeTape(true);
    }
  }

  async function stopNativeTape(preserveError=false){
    try{if(unsubscribe)unsubscribe()}catch(_){}
    unsubscribe=null;
    try{MultiSynthNativeMic.stop()}catch(_){}

    if(streamNode){
      try{streamNode.onaudioprocess=null;streamNode.disconnect()}catch(_){}
      streamNode=null;
    }
    clearQueue();

    const wasError=preserveError||statusEl.textContent==="INPUT ERROR";
    await stopTape();
    button.textContent="START TAPE";
    button.classList.remove("active");
    if(wasError)statusEl.textContent="INPUT ERROR";
  }

  button.addEventListener("click",startNativeTape);
  window.addEventListener("pagehide",()=>{if(running)stopNativeTape()});
})();

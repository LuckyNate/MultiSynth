class HookwormGranularEchoProcessor extends AudioWorkletProcessor {
  constructor(){
    super();
    this.maxSeconds=24;
    this.buffer=new Float32Array(Math.ceil(sampleRate*this.maxSeconds));
    this.write=0;
    this.sampleCounter=0;
    this.state={running:false,segmentLength:80,loopLength:1000,loops:4};
    this.port.onmessage=e=>{
      if(e.data&&e.data.type==='state')Object.assign(this.state,e.data.state||{});
      if(e.data&&e.data.type==='clear'){this.buffer.fill(0);this.write=0;this.sampleCounter=0;}
    };
  }
  clamp(v,a,b){v=Number(v);return Math.max(a,Math.min(b,Number.isFinite(v)?v:0));}
  wrap(i,n){i%=n;if(i<0)i+=n;return i;}
  process(inputs,outputs){
    const input=inputs[0]?.[0],out=outputs[0]?.[0];
    if(!out)return true;
    if(!input){out.fill(0);return true;}
    const s=this.state;
    if(!s.running){out.set(input);return true;}
    const repeatMs=this.clamp(s.loopLength??1000,20,20000);
    const repeatFrames=Math.max(1,Math.floor(repeatMs*sampleRate/1000));
    const repeats=Math.max(1,Math.min(64,Math.round(Number(s.loops)||1)));
    const grainMs=this.clamp(s.segmentLength??80,5,2000);
    const grainFrames=Math.max(2,Math.floor(grainMs*sampleRate/1000));
    const N=this.buffer.length;
    for(let i=0;i<out.length;i++){
      const x=input[i]||0;
      this.buffer[this.write]=x;
      let y=x;
      const phase=(this.sampleCounter%grainFrames)/(grainFrames-1);
      const window=.5-.5*Math.cos(2*Math.PI*phase);
      for(let r=1;r<=repeats;r++){
        const delay=r*repeatFrames;
        if(delay>=N)break;
        const idx=this.wrap(this.write-delay,N);
        const falloff=(repeats-r+1)/(repeats+1);
        y+=this.buffer[idx]*falloff*window;
      }
      out[i]=Math.max(-.95,Math.min(.95,y));
      this.write++;if(this.write>=N)this.write=0;
      this.sampleCounter++;
    }
    return true;
  }
}
registerProcessor('hookworm-granular-echo-processor',HookwormGranularEchoProcessor);

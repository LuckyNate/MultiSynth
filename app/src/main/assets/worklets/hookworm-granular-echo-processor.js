class HookwormGranularEchoProcessor extends AudioWorkletProcessor {
  constructor(){
    super();
    this.maxSeconds=24;
    this.buffer=new Float32Array(Math.ceil(sampleRate*this.maxSeconds));
    this.write=0;
    this.sampleCounter=0;
    this.state={segmentLength:80,repeats:4,stretchBlend:.5,segmentSpeed:1};
    this.port.onmessage=e=>{
      if(e.data&&e.data.type==='state')Object.assign(this.state,e.data.state||{});
      if(e.data&&e.data.type==='clear'){this.buffer.fill(0);this.write=0;this.sampleCounter=0;}
    };
  }
  clamp(v,a,b){v=Number(v);return Math.max(a,Math.min(b,Number.isFinite(v)?v:0));}
  wrap(i,n){i%=n;if(i<0)i+=n;return i;}
  read(pos,n){const a=Math.floor(pos),f=pos-a,i0=this.wrap(a,n),i1=this.wrap(a+1,n);return this.buffer[i0]*(1-f)+this.buffer[i1]*f;}
  process(inputs,outputs){
    const input=inputs[0]?.[0],out=outputs[0]?.[0];
    if(!out)return true;
    if(!input){out.fill(0);return true;}
    const s=this.state;
    const grainMs=this.clamp(s.segmentLength??80,5,2000);
    const grainFrames=Math.max(2,Math.floor(grainMs*sampleRate/1000));
    const repeats=Math.max(1,Math.min(64,Math.round(Number(s.repeats)||1)));
    const speed=this.clamp(s.segmentSpeed??1,.25,4);
    const blend=this.clamp(s.stretchBlend??.5,0,1);
    const N=this.buffer.length;
    for(let i=0;i<out.length;i++){
      const x=input[i]||0;
      this.buffer[this.write]=x;
      let y=x;
      const phase=(this.sampleCounter%grainFrames)/(grainFrames-1);
      const window=.5-.5*Math.cos(2*Math.PI*phase);
      const stretchPhase=phase*speed;
      const tilePhase=(phase*speed)%1;
      const sourcePhase=stretchPhase*(1-blend)+tilePhase*blend;
      for(let r=1;r<=repeats;r++){
        const delay=r*grainFrames;
        if(delay>=N)break;
        const grainStart=this.write-delay-phase*grainFrames;
        const pos=grainStart+sourcePhase*grainFrames;
        const falloff=(repeats-r+1)/repeats;
        y+=this.read(pos,N)*falloff*window;
      }
      out[i]=Math.max(-.95,Math.min(.95,y));
      this.write++;if(this.write>=N)this.write=0;
      this.sampleCounter++;
    }
    return true;
  }
}
registerProcessor('hookworm-granular-echo-processor',HookwormGranularEchoProcessor);

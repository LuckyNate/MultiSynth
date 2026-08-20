class TapewormTapeProcessor extends AudioWorkletProcessor {
  constructor(){
    super();
    this.referenceSeconds=2;
    this.tapeFrames=Math.max(2,Math.floor(sampleRate*this.referenceSeconds));
    this.tape=new Float32Array(this.tapeFrames);
    this.writePos=0;
    this.readPos=0;
    this.state={running:false,length:4,speed:.5,erase:1};
    this.port.onmessage=e=>{
      if(e.data&&e.data.type==='state')Object.assign(this.state,e.data.state||{});
      if(e.data&&e.data.type==='clear'){
        this.tape.fill(0);
        this.writePos=0;
        this.readPos=0;
      }
    };
  }
  clamp(v,a,b){v=Number(v);return Math.max(a,Math.min(b,Number.isFinite(v)?v:0));}
  wrap(p,n){while(p>=n)p-=n;while(p<0)p+=n;return p;}
  process(inputs,outputs){
    const input=inputs[0]?.[0],out=outputs[0]?.[0];
    if(!out)return true;
    if(!input){out.fill(0);return true;}
    const s=this.state;
    if(!s.running){out.set(input);return true;}
    const speed=this.clamp(s.speed??.5,.1,10);
    const erase=this.clamp(s.erase??1,0,1);
    const N=this.tapeFrames;
    let w=this.wrap(this.writePos,N),r=this.wrap(this.readPos,N);
    for(let i=0;i<out.length;i++){
      const r0=Math.floor(r)%N,r1=(r0+1)%N,rf=r-Math.floor(r);
      const playback=this.tape[r0]*(1-rf)+this.tape[r1]*rf;
      out[i]=Math.max(-.95,Math.min(.95,playback));

      // Record head is deliberately fixed at normal 1x tape speed.
      // Playback head is varispeed, so changing speed stretches/compresses
      // both time and pitch in real time against normally recorded material.
      const wi=Math.floor(w)%N;
      const previous=this.tape[wi];
      this.tape[wi]=Math.max(-.95,Math.min(.95,previous*(1-erase)+input[i]));
      w+=1;
      r+=speed;
      w=this.wrap(w,N);
      r=this.wrap(r,N);
    }
    this.writePos=w;
    this.readPos=r;
    return true;
  }
}
registerProcessor('tapeworm-tape-processor',TapewormTapeProcessor);

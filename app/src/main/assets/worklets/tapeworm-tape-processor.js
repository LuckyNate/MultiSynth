class TapewormTapeProcessor extends AudioWorkletProcessor {
  constructor(){
    super();
    this.tapeFrames=Math.max(2,Math.ceil(sampleRate*2));
    this.tape=new Float32Array(this.tapeFrames);
    this.playPos=0;
    this.headGap=Math.max(2,Math.round(sampleRate*.004));
    this.prevRecordPos=this.wrap(this.playPos+this.headGap,this.tapeFrames);
    this.prevInput=0;
    this.state={length:4,speed:.5,erase:1,inputLevel:1,outputLevel:1};
    this.port.onmessage=e=>{
      if(e.data&&e.data.type==='state')Object.assign(this.state,e.data.state||{});
      if(e.data&&e.data.type==='clear'){
        this.tape.fill(0);this.playPos=0;this.prevRecordPos=this.wrap(this.headGap,this.tapeFrames);this.prevInput=0;
      }
    };
  }
  clamp(v,a,b){v=Number(v);return Math.max(a,Math.min(b,Number.isFinite(v)?v:0));}
  wrap(p,n){while(p>=n)p-=n;while(p<0)p+=n;return p;}
  readAt(pos){const n=this.tapeFrames,p=this.wrap(pos,n),i0=Math.floor(p)%n,i1=(i0+1)%n,f=p-Math.floor(p);return this.tape[i0]*(1-f)+this.tape[i1]*f;}
  writeCell(index,value,erase){const n=this.tapeFrames,i=((index%n)+n)%n,old=this.tape[i];this.tape[i]=Math.max(-.95,Math.min(.95,old*(1-erase)+value));}
  recordTravel(from,to,previous,current,erase){const n=this.tapeFrames;let distance=to-from;if(distance<0)distance+=n;if(distance<=0)return;const steps=Math.max(1,Math.ceil(distance));for(let j=1;j<=steps;j++){const t=j/steps,pos=this.wrap(from+distance*t,n),sample=previous+(current-previous)*t;this.writeCell(Math.floor(pos),sample,erase);}}
  process(inputs,outputs){const input=inputs[0]?.[0],out=outputs[0]?.[0];if(!out)return true;const s=this.state,speed=this.clamp(s.speed??.5,.1,10),erase=this.clamp(s.erase??1,0,1),inputLevel=this.clamp(s.inputLevel??1,0,1),outputLevel=this.clamp(s.outputLevel??1,0,1),n=this.tapeFrames;let p=this.wrap(this.playPos,n),prevRec=this.wrap(this.prevRecordPos,n),prevIn=this.prevInput;for(let i=0;i<out.length;i++){out[i]=Math.max(-.95,Math.min(.95,this.readAt(p)*outputLevel));const incoming=(input?.[i]||0)*inputLevel,rec=this.wrap(p+this.headGap,n);this.recordTravel(prevRec,rec,prevIn,incoming,erase);prevRec=rec;prevIn=incoming;p=this.wrap(p+speed,n)}this.playPos=p;this.prevRecordPos=prevRec;this.prevInput=prevIn;return true;}
}
registerProcessor('tapeworm-tape-processor',TapewormTapeProcessor);

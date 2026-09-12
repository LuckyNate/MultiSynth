"use strict";

class MultiSynthPlatterProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors(){
    return [{name:"rate",defaultValue:0,minValue:-16,maxValue:16,automationRate:"a-rate"}];
  }

  constructor(){
    super();
    this.channels=[];
    this.sourceRate=sampleRate;
    this.playhead=0;
    this.active=false;
    this.loop=false;
    this.ended=false;
    this.reportFrames=0;
    this.lastReportedEnded=false;
    this.currentRate=0;
    this.slewSeconds=.004;
    this.halfTaps=12;
    this.port.onmessage=e=>this.handleMessage(e.data||{});
  }

  handleMessage(m){
    const type=String(m.type||"");
    if(type==="buffer"){
      this.channels=Array.isArray(m.channels)?m.channels.map(x=>x instanceof Float32Array?x:new Float32Array(x||0)):[];
      this.sourceRate=Math.max(1,Number(m.sampleRate)||sampleRate);
      const length=this.length;
      this.playhead=length?Math.max(0,Math.min(length-1,this.playhead)):0;
      this.ended=false;
      this.lastReportedEnded=false;
      this.report(true);
    }else if(type==="loop"){
      this.loop=!!m.value;
    }else if(type==="start"){
      if(!this.length)return;
      this.playhead=this.secondsToFrame(m.position);
      this.active=true;
      this.ended=false;
      this.lastReportedEnded=false;
      this.report(true);
    }else if(type==="seek"){
      if(!this.length)return;
      this.playhead=this.secondsToFrame(m.position);
      this.ended=false;
      this.lastReportedEnded=false;
      this.report(true);
    }else if(type==="stop"){
      if(m.position!=null&&this.length)this.playhead=this.secondsToFrame(m.position);
      this.active=false;
      this.currentRate=0;
      this.ended=false;
      this.lastReportedEnded=false;
      this.report(true);
    }
  }

  get length(){return this.channels[0]?.length||0}

  secondsToFrame(seconds){
    const n=this.length;
    if(!n)return 0;
    return Math.max(0,Math.min(n-1,(Number(seconds)||0)*this.sourceRate));
  }

  frameAt(index){
    const n=this.length;
    if(!n)return 0;
    if(this.loop)return((index%n)+n)%n;
    return Math.max(0,Math.min(n-1,index));
  }

  sinc(x){
    if(Math.abs(x)<1e-8)return 1;
    const p=Math.PI*x;
    return Math.sin(p)/p;
  }

  sample(channel,index,step){
    const data=this.channels[Math.min(channel,this.channels.length-1)]||this.channels[0];
    if(!data?.length)return 0;
    const absStep=Math.max(1e-9,Math.abs(step));
    const cutoff=Math.min(1,.94/absStep);
    const center=Math.floor(index);
    let sum=0,norm=0;
    const radius=this.halfTaps;
    for(let k=-radius+1;k<=radius;k++){
      const sourceIndex=center+k;
      const distance=index-sourceIndex;
      if(Math.abs(distance)>=radius)continue;
      const phase=distance/radius;
      const window=.5+.5*Math.cos(Math.PI*phase);
      const weight=cutoff*this.sinc(distance*cutoff)*window;
      sum+=(data[this.frameAt(sourceIndex)]||0)*weight;
      norm+=weight;
    }
    return Math.abs(norm)>1e-9?sum/norm:0;
  }

  finish(forward){
    const n=this.length;
    this.active=false;
    this.currentRate=0;
    this.ended=true;
    this.playhead=forward?Math.max(0,n-1):0;
    if(!this.lastReportedEnded){
      this.lastReportedEnded=true;
      this.port.postMessage({type:"ended",position:this.sourceRate?this.playhead/this.sourceRate:0});
    }
  }

  report(force=false){
    if(!force&&this.reportFrames<512)return;
    this.reportFrames=0;
    this.port.postMessage({type:"state",position:this.sourceRate?this.playhead/this.sourceRate:0,active:this.active,ended:this.ended});
  }

  process(inputs,outputs,parameters){
    const out=outputs[0];
    if(!out?.length)return true;
    const frames=out[0].length;
    for(const channel of out)channel.fill(0);
    if(!this.active||!this.length){this.reportFrames+=frames;this.report();return true}

    const rates=parameters.rate;
    const slew=Math.exp(-1/(Math.max(1e-4,this.slewSeconds)*sampleRate));
    for(let i=0;i<frames;i++){
      const targetRate=Number(rates.length>1?rates[i]:rates[0])||0;
      if(Math.abs(targetRate)<1e-5)this.currentRate=0;
      else this.currentRate=targetRate+(this.currentRate-targetRate)*slew;
      const step=this.currentRate*this.sourceRate/sampleRate;

      if(this.playhead<0||this.playhead>=this.length-1){
        if(this.loop){
          this.playhead=((this.playhead%this.length)+this.length)%this.length;
        }else{
          this.finish(step>=0);
          break;
        }
      }

      if(Math.abs(step)>1e-9){
        for(let c=0;c<out.length;c++)out[c][i]=this.sample(c,this.playhead,step);
        this.playhead+=step;
      }else{
        for(let c=0;c<out.length;c++)out[c][i]=this.sample(c,this.playhead,1);
      }
    }
    this.reportFrames+=frames;
    this.report();
    return true;
  }
}

registerProcessor("multisynth-platter",MultiSynthPlatterProcessor);

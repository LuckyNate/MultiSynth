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

  wrapFrame(index){
    const n=this.length;
    if(!n)return 0;
    if(this.loop)return((index%n)+n)%n;
    return Math.max(0,Math.min(n-1,index));
  }

  cubic(channel,index){
    const data=this.channels[Math.min(channel,this.channels.length-1)]||this.channels[0];
    if(!data?.length)return 0;
    const i1=Math.floor(index),t=index-i1;
    const y0=data[this.wrapFrame(i1-1)]||0;
    const y1=data[this.wrapFrame(i1)]||0;
    const y2=data[this.wrapFrame(i1+1)]||0;
    const y3=data[this.wrapFrame(i1+2)]||0;
    const a0=-.5*y0+1.5*y1-1.5*y2+.5*y3;
    const a1=y0-2.5*y1+2*y2-.5*y3;
    const a2=-.5*y0+.5*y2;
    return ((a0*t+a1)*t+a2)*t+y1;
  }

  finish(forward){
    const n=this.length;
    this.active=false;
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
    for(let i=0;i<frames;i++){
      const rate=Number(rates.length>1?rates[i]:rates[0])||0;
      if(this.playhead<0||this.playhead>=this.length-1){
        if(this.loop){
          this.playhead=((this.playhead%this.length)+this.length)%this.length;
        }else{
          this.finish(rate>=0);
          break;
        }
      }
      if(Math.abs(rate)>1e-6){
        for(let c=0;c<out.length;c++)out[c][i]=this.cubic(c,this.playhead);
        this.playhead+=rate*this.sourceRate/sampleRate;
      }
    }
    this.reportFrames+=frames;
    this.report();
    return true;
  }
}

registerProcessor("multisynth-platter",MultiSynthPlatterProcessor);

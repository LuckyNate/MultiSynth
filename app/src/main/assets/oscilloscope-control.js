"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{};

  function clamp(v,a,b){return Math.max(a,Math.min(b,v))}

  function create(options={}){
    const minScale=Math.max(.000001,Number(options.minScale)||.01);
    const maxScale=Math.max(minScale,Number(options.maxScale)||1);
    const edgeTravel=Math.max(2,Number(options.edgeTravel)||18);
    const sensitivity=Math.max(.000001,Number(options.sensitivity)||.004);
    let scale=clamp(Number(options.scale)||maxScale,minScale,maxScale);
    let edgeOffset=0;

    function drag(deltaX){
      const before=scale;
      // Left drag expands time detail; right drag collapses toward full-fit.
      scale=clamp(scale + deltaX*sensitivity*(maxScale-minScale),minScale,maxScale);
      const blocked=(scale===minScale&&deltaX<0)||(scale===maxScale&&deltaX>0);
      if(blocked){
        const attempted=Math.abs(deltaX);
        const direction=deltaX<0?-1:1;
        edgeOffset=direction*Math.min(edgeTravel,attempted*.28);
      }else edgeOffset=0;
      return Object.freeze({scale,edgeOffset,changed:scale!==before,atMin:scale===minScale,atMax:scale===maxScale});
    }

    function release(){
      const hadEdge=edgeOffset!==0;
      edgeOffset=0;
      return Object.freeze({scale,edgeOffset,snapBack:hadEdge,atMin:scale===minScale,atMax:scale===maxScale});
    }

    function setScale(v){scale=clamp(Number(v)||scale,minScale,maxScale);edgeOffset=0;return scale}
    function snapshot(){return Object.freeze({scale,edgeOffset,minScale,maxScale,atMin:scale===minScale,atMax:scale===maxScale})}

    return Object.freeze({drag,release,setScale,snapshot});
  }

  MS.OscilloscopeControl=Object.freeze({create});
})(window);

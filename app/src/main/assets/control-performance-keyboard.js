"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{};
  const MIDI_MIN=21,MIDI_MAX=108,MIDDLE_C=60;
  const PORTRAIT_VISIBLE=25,LANDSCAPE_VISIBLE=49;
  const OCTAVE_CS=Object.freeze([24,36,48,60,72,84,96]); // C1..C7
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  function visibleCount(orientation){return orientation==="landscape"?LANDSCAPE_VISIBLE:PORTRAIT_VISIBLE}
  function maxStart(count){return MIDI_MAX-count+1}
  function clampStart(start,count){return clamp(Math.round(start),MIDI_MIN,maxStart(count))}
  function middleAnchorIndex(count){return Math.floor((count-1)/2)}
  function startForTarget(targetMidi,count){return clampStart(targetMidi-middleAnchorIndex(count),count)}
  function startForOctave(octave,count){
    const target=OCTAVE_CS[clamp(Math.round(octave),1,7)-1];
    return startForTarget(target,count);
  }
  function initialStart(count){return startForTarget(MIDDLE_C,count)}
  function noteName(midi){const names=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];const n=clamp(Math.round(midi),MIDI_MIN,MIDI_MAX);return names[n%12]+(Math.floor(n/12)-1)}
  function isBlack(midi){return [1,3,6,8,10].includes(midi%12)}

  function createState(orientation="portrait"){
    const count=visibleCount(orientation);
    return {orientation,count,start:initialStart(count),active:new Map()};
  }
  function setOrientation(state,orientation){
    const oldCount=state.count,oldCenter=state.start+middleAnchorIndex(oldCount);
    state.orientation=orientation;state.count=visibleCount(orientation);
    state.start=startForTarget(oldCenter,state.count);return state;
  }
  function jumpOctave(state,octave){state.start=startForOctave(octave,state.count);return state.start}
  function panByNotes(state,delta){state.start=clampStart(state.start+delta,state.count);return state.start}
  function visibleNotes(state){return Array.from({length:state.count},(_,i)=>{const midi=state.start+i;return Object.freeze({midi,name:noteName(midi),black:isBlack(midi)})})}

  // Touch ownership is independent per pointer so chords cannot steal one another.
  function noteOn(state,pointerId,midi){const n=clamp(Math.round(midi),MIDI_MIN,MIDI_MAX);state.active.set(pointerId,n);return n}
  function moveTouch(state,pointerId,midi){const next=clamp(Math.round(midi),MIDI_MIN,MIDI_MAX),prev=state.active.get(pointerId);if(prev===next)return{off:null,on:null};state.active.set(pointerId,next);return{off:prev??null,on:next}}
  function noteOff(state,pointerId){const prev=state.active.get(pointerId);state.active.delete(pointerId);return prev??null}

  MS.PerformanceKeyboard=Object.freeze({
    MIDI_MIN,MIDI_MAX,MIDDLE_C,PORTRAIT_VISIBLE,LANDSCAPE_VISIBLE,OCTAVE_CS,
    visibleCount,middleAnchorIndex,startForTarget,startForOctave,initialStart,noteName,isBlack,
    createState,setOrientation,jumpOctave,panByNotes,visibleNotes,noteOn,moveTouch,noteOff
  });
})(window);

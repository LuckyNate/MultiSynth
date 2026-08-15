"use strict";
(function(){
const q=new URLSearchParams(location.search);if(q.get("embedded")!=="1")return;
let P;try{P=parent.MultiSynth;}catch(_){return;}const C=P?.ModuleContract,E=P?.RackEngine,instance=q.get("instance"),rack=q.get("rack");if(!C||!E||!instance||!rack)return;
const $=id=>document.getElementById(id),clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const ranges=[[20,110],[28,220],[90,520],[70,700],[70,700],[70,700],[300,2000],[300,2000],[300,2000],[600,2000],[600,2000],[400,2000]];
function rt(){try{return C.getRuntime(instance);}catch(_){return null;}}
function patch(p){try{E.setModuleState(rack,instance,p);parent.MultiSynth.RackAudioGraph?.rebuild?.();}catch(e){console.error("Rhythm32 rack bridge",e);}}
function state(){return rt()?.state||{};}
function selected(){const labels=[...document.querySelectorAll('.voiceLabel')],i=labels.findIndex(x=>x.classList.contains('selected'));return i<0?Number(state().selected||0):i;}
function collectPattern(){const p=Array.from({length:12},()=>Array(32).fill(0));document.querySelectorAll('.step.on[data-r][data-s]').forEach(b=>{const r=+b.dataset.r,s=+b.dataset.s;if(p[r]&&s>=0&&s<32)p[r][s]=1;});return p;}
function patchVoice(id,value){const s=state(),i=selected(),voices=(s.voices||[]).map(v=>({...v}));if(!voices[i])return;if(id==='pitch'){const [lo,hi]=ranges[i]||[20,2000];voices[i].pitch=Math.round(lo*Math.pow(hi/lo,clamp(value,0,1000)/1000));}else if(id==='voiceLevel')voices[i].level=+value;else voices[i][id]=+value;patch({voices,selected:i});}
function hydrate(){const s=state();if(!s)return;for(const id of ['bpm','swing','steps'])if($(id)&&s[id]!=null){$(id).value=s[id];$(id).nextElementSibling.textContent=s[id];}const play=$('play');if(play){play.textContent=s.running?'STOP':'PLAY';play.classList.toggle('active',!!s.running);}const sync=$('sync');if(sync)sync.textContent='SYNC: '+String(s.syncMode||'internal').toUpperCase();if(Array.isArray(s.pattern)){document.querySelectorAll('.step[data-r][data-s]').forEach(b=>{b.classList.toggle('on',!!s.pattern[+b.dataset.r]?.[+b.dataset.s]);});}}
/* Transport belongs to the persistent runtime. Stop the standalone page transport before it sees these clicks. */
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.id==='play'){e.preventDefault();e.stopImmediatePropagation();const on=!state().running;patch({running:on});b.textContent=on?'STOP':'PLAY';b.classList.toggle('active',on);return;}if(b.id==='preview'){e.preventDefault();e.stopImmediatePropagation();return;}},true);
/* After the page updates visual pattern/selection controls, mirror the resulting state into the rack instance. */
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;setTimeout(()=>{if(b.classList.contains('step'))patch({pattern:collectPattern()});else if(b.id==='clear')patch({pattern:Array.from({length:12},()=>Array(32).fill(0))});else if(b.id==='sync'){const mode=(b.textContent||'').toLowerCase().includes('external')?'external':'internal';patch({syncMode:mode});}else if(b.classList.contains('voiceLabel'))patch({selected:selected()});},0);},false);
document.addEventListener('input',e=>{const id=e.target?.id;if(!id)return;if(['bpm','swing','steps'].includes(id))patch({[id]:+e.target.value});else if(['pitch','decay','bend','tone','character','voiceLevel'].includes(id))patchVoice(id,e.target.value);},true);
setTimeout(hydrate,0);
})();

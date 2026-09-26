"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{},I=MS.ModuleIds,E=MS.NodeGraphEngine;if(!I||!E)return;
const V=Object.freeze({
[I.LIVE_WIRE]:{job:"WIRELESS AUDIO",art:"radio",glyph:"ϟ"},
[I.FATHER_TIME]:{job:"MASTER CLOCK",art:"clock",glyph:"◷"},
[I.WHITMAN_SAMPLER]:{job:"SAMPLER",art:"tape",glyph:"▣"},
[I.TIME_BANDITS]:{job:"DRUM SEQUENCER",art:"steps",glyph:"••••"},
[I.REARRANGER]:{job:"MIDI ARRANGER",art:"timeline",glyph:"≋"},
[I.THE_CHOPPER]:{job:"SAMPLE CHOPPER",art:"blade",glyph:"╱╲"},
[I.SAMPLE_SURGERY]:{job:"SAMPLE EDITOR",art:"surgery",glyph:"✂"},
[I.SAMPLE_LIBRARY]:{job:"SAMPLE LIBRARY",art:"library",glyph:"▤"},
[I.BIG_DEAL]:{job:"GRANULAR PROCESSOR",art:"grain",glyph:"···"},
[I.BIG_MOUTH]:{job:"VOCAL PROCESSOR",art:"mouth",glyph:"◡"},
[I.GRAIN_LIQOUR]:{job:"GRANULAR SOURCE",art:"grain",glyph:"⁙"},
[I.BEEN_SERVED]:{job:"ADSR ENVELOPE",art:"envelope",glyph:"⌁"},
[I.GARAGE_BAND]:{job:"SIGNAL PROCESSOR",art:"garage",glyph:"▥"},
[I.MASTER_OF_LEVELS]:{job:"MASTER LEVEL",art:"meter",glyph:"▮"},
[I.ALCHEMY_MIXER]:{job:"OUTPUT MIXER",art:"mixer",glyph:"≡"},
[I.PLUS_ONE_SPLITTER]:{job:"ANYTHING SPLITTER",art:"split",glyph:"Y"},
[I.PLUS_ONE_MERGER]:{job:"ANYTHING MERGER",art:"merge",glyph:"Y"},
[I.DENZELS_EQUALIZER]:{job:"EQUALIZER",art:"eq",glyph:"▥"},
[I.ECHO_CANYON]:{job:"DELAY / ECHO",art:"echo",glyph:")))"},
[I.CONTROL_FREAK]:{job:"MIDI CONTROLLER",art:"controller",glyph:"▦"},
[I.LOWRIDER_LFO]:{job:"LFO MODULATOR",art:"lfo",glyph:"∿"},
[I.UNSTABLE_DIFFUSION]:{job:"GENERATIVE INSTRUMENT",art:"diffusion",glyph:"✣"},
[I.KEYLESS88]:{job:"KEYLESS INSTRUMENT",art:"keys",glyph:"▥"},
[I.TEST_MODULE]:{job:"TEST UTILITY",art:"test",glyph:"⚙"},
[I.PURE_SYNTH]:{job:"CONTINUOUS OSCILLATOR",art:"wave",glyph:"∿"},
[I.QUAD_SYNTH]:{job:"FOUR-VOICE SYNTH",art:"quad",glyph:"◇◇"},
[I.HOOK_AND_LADDER]:{job:"FM / STEP SYNTH",art:"ladder",glyph:"╬"},
[I.NO_QUARTER]:{job:"SYNTHESIZER",art:"wave",glyph:"⌁"},
[I.RANDRONE]:{job:"GENERATIVE DRONE",art:"drone",glyph:"◎"},
[I.HOOKWORM]:{job:"LOOPER",art:"loop",glyph:"↻"},
[I.TAPEWORM]:{job:"TAPE LOOPER",art:"tape",glyph:"∞"},
[I.TAIL_GATOR]:{job:"OUTPUT ROUTER",art:"route",glyph:"⇢"},
[I.MIDICHLORIAN]:{job:"MIDI UTILITY",art:"midi",glyph:"M"},
[I.BLUETOOTH_OUTPUT]:{job:"BLUETOOTH OUTPUT",art:"bluetooth",glyph:"ᛒ"}
});
function visual(type){return V[type]||{job:"MODULE",art:"utility",glyph:"◆"}}
function decorate(card){if(!card||card.dataset.nodeVisualReady==="1")return;let m=null;try{m=E.getModule(card.dataset.nodeId)}catch(_){}if(!m)return;const v=visual(m.type),head=card.querySelector(":scope > .nodeHead"),small=head?.querySelector("small");card.dataset.nodeVisualReady="1";card.dataset.nodeType=m.type;card.dataset.nodeArt=v.art;card.style.setProperty("--node-art-glyph",JSON.stringify(v.glyph));card.style.setProperty("--node-accent",MS.ModuleManifest?.get?.(m.type)?.color||"#789");card.classList.add("nodeVisualCard");if(small)small.textContent=v.job;else if(head){const s=document.createElement("small");s.textContent=v.job;head.appendChild(s)}const body=card.querySelector(":scope > .nodeBody");if(body&&body.childElementCount===0){body.textContent="";body.classList.add("nodeArtField")}if(m.type===I.FATHER_TIME&&body){body.textContent="";body.classList.add("nodeArtField")}if(m.type===I.PLUS_ONE_SPLITTER||m.type===I.PLUS_ONE_MERGER){const extra=body?.querySelector("span");if(extra)extra.remove()}const art=document.createElement("div");art.className="nodeStyleArt";art.setAttribute("aria-hidden","true");if(head?.nextSibling)card.insertBefore(art,head.nextSibling);else card.appendChild(art)}
function decorateAll(){document.querySelectorAll(".nodeCard[data-node-id]").forEach(decorate)}
function watch(){decorateAll();if(!document.body||typeof MutationObserver==="undefined")return;new MutationObserver(decorateAll).observe(document.body,{childList:true,subtree:true})}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",watch,{once:true});else watch();
MS.NodeCardVisuals=Object.freeze({visual,decorateAll});
})(window);

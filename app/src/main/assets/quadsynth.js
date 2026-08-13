"use strict";

const TAU = Math.PI * 2;
const OSC_NAMES = ["click", "sine", "saw", "square"];
const STORAGE_KEY = "QuadSynth.PersistentState.v1";
const TOUCH_VELOCITY = 127;
const MAX_VOICES = 12;
const MIN_ATTACK_SECONDS = .001;

let audioCtx = null, masterGain = null, analyser = null, scopeData = null;
let scopeCanvas = null, scopeContext = null;
let keepAliveOscillator = null, keepAliveGain = null;
const waveCache = new Map();
const activeVoices = new Map(), pointerNotes = new Map(), computerHeld = new Set(), midiHeld = new Map();
const voicePool = [];

const synthState = {
    click: { level: 1, octave: 0, tune: 0, phase: 0, mute: false, solo: false },
    sine: { level: 0, octave: 0, tune: 0, phase: 0, mute: false, solo: false },
    saw: { level: 0, octave: 0, tune: 0, phase: 0, mute: false, solo: false },
    square: { level: 0, octave: 0, tune: 0, phase: 0, mute: false, solo: false },
    envelope: { attack: .001, decay: .10, sustain: .75, release: .25 }
};

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function wrap(v, min, max) { const r = max - min; return r <= 0 ? min : ((v - min) % r + r) % r + min; }
function midiToFrequency(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }
function tunedFrequency(base, s) { return base * Math.pow(2, s.octave) * Math.pow(2, s.tune / 1200); }
function savePersistentState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            version: 1, synth: synthState
        }));
    } catch (e) { console.warn("State save failed", e); }
}

function loadPersistentState() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        if (!saved) return;
        OSC_NAMES.forEach(name => {
            const s = saved.synth?.[name]; if (!s) return;
            synthState[name].level = clamp(Number(s.level) || 0, 0, 1);
            synthState[name].octave = clamp(Number(s.octave) || 0, -4, 4);
            synthState[name].tune = clamp(Number(s.tune) || 0, -100, 100);
            synthState[name].phase = clamp(Number(s.phase) || 0, 0, TAU);
            synthState[name].mute = !!s.mute; synthState[name].solo = !!s.solo;
        });
        const e = saved.synth?.envelope;
        if (e) {
            const savedAttack = clamp(Number(e.attack) || 0, 0, 2);
            synthState.envelope.attack = Math.abs(savedAttack - .02) < .000001 ? .001 : savedAttack;
            synthState.envelope.decay = clamp(Number(e.decay) || 0, 0, 2);
            synthState.envelope.sustain = clamp(Number(e.sustain) || 0, 0, 1);
            synthState.envelope.release = clamp(Number(e.release) || 0, 0, 4);
        }
    } catch (e) { console.warn("State load failed", e); }
}

function ensureAudio() {
    if (!audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) { alert("Web Audio is unavailable."); return false; }
        audioCtx = new AC({ latencyHint: "interactive" });
        masterGain = audioCtx.createGain(); masterGain.gain.value = .22;
        analyser = audioCtx.createAnalyser(); analyser.fftSize = 2048; analyser.smoothingTimeConstant = .04;
        masterGain.connect(analyser); analyser.connect(audioCtx.destination);
        primeWaveCache();
        buildVoicePool();
        startAudioKeepAlive();
    }
    if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    return true;
}

function warmAudioEngine() {
    if (!ensureAudio()) return;
    primeWaveCache();
    if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
}

function waveKey(type, phase) { return `${type}:${wrap(Number(phase) || 0, 0, TAU).toFixed(2)}`; }
function cachedPhaseWave(type, phase) {
    const key = waveKey(type, phase);
    let wave = waveCache.get(key);
    if (!wave) { wave = createPhaseWave(type, phase); waveCache.set(key, wave); }
    return wave;
}
function primeWaveCache() { OSC_NAMES.forEach(name => cachedPhaseWave(name, synthState[name].phase)); }

function oscillatorIsAudible(settings, name) {
    if (settings[name].mute) return false;
    const anySolo = OSC_NAMES.some(n => settings[n].solo);
    return !anySolo || settings[name].solo;
}
function oscillatorGain(settings, name) { return oscillatorIsAudible(settings, name) ? clamp(settings[name].level, 0, 1) : 0; }

function createClickWave(phase) {
    const samples = 512, harmonics = 96, count = Math.max(8, Math.round(samples * .16)), segment = count / 4;
    const wave = new Float32Array(samples);
    for (let i = 0; i < count; i++) {
        if (i < segment) wave[i] = -i / segment;
        else if (i < segment * 2) wave[i] = -1 + (i - segment) / segment;
        else if (i < segment * 3) wave[i] = (i - segment * 2) / segment;
        else wave[i] = 1 - (i - segment * 3) / segment;
    }
    const real = new Float32Array(harmonics + 1), imag = new Float32Array(harmonics + 1);
    phase = wrap(phase, 0, TAU);
    for (let h = 1; h <= harmonics; h++) {
        let ct = 0, st = 0;
        for (let i = 0; i < samples; i++) {
            const a = TAU * h * i / samples; ct += wave[i] * Math.cos(a); st += wave[i] * Math.sin(a);
        }
        const br = ct * 2 / samples, bi = st * 2 / samples, a = h * phase, c = Math.cos(a), s = Math.sin(a);
        real[h] = br * c + bi * s; imag[h] = bi * c - br * s;
    }
    return audioCtx.createPeriodicWave(real, imag, { disableNormalization: false });
}

function createStandardWave(type, phase) {
    const real = new Float32Array(65), imag = new Float32Array(65); phase = wrap(phase, 0, TAU);
    for (let h = 1; h <= 64; h++) {
        let br = 0, bi = 0;
        if (type === "sine" && h === 1) bi = 1;
        else if (type === "saw") bi = 1 / h;
        else if (type === "square" && h % 2) bi = 1 / h;
        const a = h * phase, c = Math.cos(a), s = Math.sin(a);
        real[h] = br * c + bi * s; imag[h] = bi * c - br * s;
    }
    return audioCtx.createPeriodicWave(real, imag, { disableNormalization: false });
}
function createPhaseWave(type, phase) { return type === "click" ? createClickWave(phase) : createStandardWave(type, phase); }

function startAudioKeepAlive() {
    keepAliveOscillator = audioCtx.createOscillator();
    keepAliveGain = audioCtx.createGain();
    keepAliveOscillator.frequency.value = 20;
    keepAliveGain.gain.value = .0000001;
    keepAliveOscillator.connect(keepAliveGain);
    keepAliveGain.connect(masterGain);
    keepAliveOscillator.start();
}

function createPooledVoice() {
    const envelopeNode = audioCtx.createGain();
    envelopeNode.gain.value = 0;
    envelopeNode.connect(masterGain);
    const voice = {
        key: null, midi: 69, baseFrequency: 440, envelopeNode,
        sources: {}, locked: false, released: false, release: .25, generation: 0
    };
    OSC_NAMES.forEach(name => {
        const oscillator = audioCtx.createOscillator(), gain = audioCtx.createGain();
        oscillator.frequency.value = 440;
        oscillator.setPeriodicWave(cachedPhaseWave(name, synthState[name].phase));
        gain.gain.value = 0;
        oscillator.connect(gain); gain.connect(envelopeNode); oscillator.start();
        voice.sources[name] = { oscillator, gain };
    });
    return voice;
}

function buildVoicePool() {
    while (voicePool.length < MAX_VOICES) voicePool.push(createPooledVoice());
}

function acquireVoice() {
    const free = voicePool.find(voice => voice.key === null);
    if (free) return free;
    const oldestKey = activeVoices.keys().next().value;
    if (oldestKey !== undefined) {
        killVoice(oldestKey);
        return voicePool.find(voice => voice.key === null);
    }
    return null;
}

function configurePooledVoice(voice, settings, when) {
    OSC_NAMES.forEach(name => {
        const source = voice.sources[name], s = settings[name];
        source.oscillator.frequency.cancelScheduledValues(when);
        source.oscillator.frequency.setValueAtTime(tunedFrequency(voice.baseFrequency, s), when);
        source.oscillator.setPeriodicWave(cachedPhaseWave(name, s.phase));
        source.gain.gain.cancelScheduledValues(when);
        source.gain.gain.setValueAtTime(oscillatorGain(settings, name), when);
    });
}

function noteOn(midi, velocity = TOUCH_VELOCITY, overrideState = null, voiceKey = null, when = null) {
    if (!ensureAudio() || !Number.isFinite(midi = Number(midi))) return;
    const key = voiceKey || `note:${midi}`; if (activeVoices.has(key)) killVoice(key);
    const settings = overrideState ? JSON.parse(JSON.stringify(overrideState)) : synthState;
    const now = Math.max(audioCtx.currentTime, Number.isFinite(when) ? when : audioCtx.currentTime), vg = clamp(Number(velocity) / 127, .001, 1);
    const a = Math.max(MIN_ATTACK_SECONDS, settings.envelope.attack), d = Math.max(.001, settings.envelope.decay);
    const voice = acquireVoice(); if (!voice) return;
    voice.generation++; voice.key = key; voice.midi = midi; voice.baseFrequency = midiToFrequency(midi);
    voice.locked = !!overrideState; voice.released = false; voice.release = Math.max(.01, settings.envelope.release);
    configurePooledVoice(voice, settings, now);
    const env = voice.envelopeNode;
    env.gain.cancelScheduledValues(now); env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(vg, now + a);
    env.gain.linearRampToValueAtTime(Math.max(.0001, vg * settings.envelope.sustain), now + a + d);
    activeVoices.set(key, voice);
}

function noteOffByKey(key) {
    if (!audioCtx) return; const voice = activeVoices.get(key); if (!voice || voice.released) return;
    voice.released = true; const now = audioCtx.currentTime, gain = voice.envelopeNode.gain;
    if (gain.cancelAndHoldAtTime) gain.cancelAndHoldAtTime(now);
    else { gain.cancelScheduledValues(now); gain.setValueAtTime(Math.max(.0001, gain.value), now); }
    gain.exponentialRampToValueAtTime(.0001, now + voice.release);
    const generation = voice.generation;
    setTimeout(() => { if (activeVoices.get(key) === voice && voice.generation === generation) killVoice(key); }, voice.release * 1000 + 100);
}
function killVoice(key) {
    const voice = activeVoices.get(key); if (!voice) return;
    const now = audioCtx ? audioCtx.currentTime : 0;
    voice.envelopeNode.gain.cancelScheduledValues(now);
    voice.envelopeNode.gain.setValueAtTime(0, now);
    Object.values(voice.sources).forEach(source => {
        source.gain.gain.cancelScheduledValues(now);
        source.gain.gain.setValueAtTime(0, now);
    });
    activeVoices.delete(key);
    voice.key = null; voice.released = false; voice.locked = false;
}

function updateAllLiveGains() {
    if (!audioCtx) return; const now = audioCtx.currentTime;
    activeVoices.forEach(v => { if (v.locked || v.released) return; OSC_NAMES.forEach(n => v.sources[n]?.gain.gain.setTargetAtTime(oscillatorGain(synthState, n), now, .008)); });
}
function updateLiveVoices(name, property) {
    if (!audioCtx) return;
    if (["level", "mute", "solo"].includes(property)) { updateAllLiveGains(); return; }
    activeVoices.forEach(v => {
        if (v.locked || v.released || !v.sources[name]) return;
        if (property === "octave" || property === "tune") v.sources[name].oscillator.frequency.setTargetAtTime(tunedFrequency(v.baseFrequency, synthState[name]), audioCtx.currentTime, .008);
        if (property === "phase") v.sources[name].oscillator.setPeriodicWave(cachedPhaseWave(name, synthState[name].phase));
    });
}

function oscConfigs(name) { return {
    [`${name}Level`]: { min: 0, max: 100, value: 0, reset: 0, step: 1, apply(v) { synthState[name].level = v / 100; updateLiveVoices(name, "level"); savePersistentState(); } },
    [`${name}Octave`]: { min: -4, max: 4, value: 0, reset: 0, step: 1, signed: true, apply(v) { synthState[name].octave = v; updateLiveVoices(name, "octave"); savePersistentState(); } },
    [`${name}Tune`]: { min: -100, max: 100, value: 0, reset: 0, step: 1, signed: true, apply(v) { synthState[name].tune = v; updateLiveVoices(name, "tune"); savePersistentState(); } },
    [`${name}Phase`]: { min: 0, max: TAU, value: 0, reset: 0, step: .01, wrap: true, radians: true, apply(v) { synthState[name].phase = v; updateLiveVoices(name, "phase"); savePersistentState(); } }
}; }
const knobConfigs = {
    ...oscConfigs("click"), ...oscConfigs("sine"), ...oscConfigs("saw"), ...oscConfigs("square"),
    attack: { min: 0, max: 2000, value: 1, reset: 0, step: 1, apply(v) { synthState.envelope.attack = v / 1000; savePersistentState(); } },
    decay: { min: 0, max: 2000, value: 100, reset: 0, step: 1, apply(v) { synthState.envelope.decay = v / 1000; savePersistentState(); } },
    sustain: { min: 0, max: 100, value: 75, reset: 0, step: 1, apply(v) { synthState.envelope.sustain = v / 100; savePersistentState(); } },
    release: { min: 0, max: 4000, value: 250, reset: 0, step: 1, apply(v) { synthState.envelope.release = v / 1000; savePersistentState(); } }
};
function syncKnobs() {
    OSC_NAMES.forEach(n => { knobConfigs[n+"Level"].value=synthState[n].level*100; knobConfigs[n+"Octave"].value=synthState[n].octave; knobConfigs[n+"Tune"].value=synthState[n].tune; knobConfigs[n+"Phase"].value=synthState[n].phase; });
    knobConfigs.attack.value=synthState.envelope.attack*1000; knobConfigs.decay.value=synthState.envelope.decay*1000; knobConfigs.sustain.value=synthState.envelope.sustain*100; knobConfigs.release.value=synthState.envelope.release*1000;
}
function formatKnob(c,v) { if(c.radians)return v.toFixed(2); const r=Math.round(v); return c.signed&&r>0?`+${r}`:String(r); }
function setupKnobs() {
    document.querySelectorAll(".knob[data-control]").forEach(knob => {
        const c=knobConfigs[knob.dataset.control], screen=knob.querySelector(".knobScreen"); if(!c)return;
        let dragging=false,pid=null,startY=0,startValue=c.value,lastTap=0;
        function setValue(raw){ let v=c.wrap?wrap(raw,c.min,c.max):clamp(raw,c.min,c.max); v=Math.round(v/c.step)*c.step; if(c.radians){v=Number(v.toFixed(2));if(v>=TAU)v=0;} c.value=v;screen.textContent=formatKnob(c,v);c.apply(v); }
        setValue(c.value);
        knob.addEventListener("pointerdown",e=>{e.preventDefault();e.stopPropagation();ensureAudio();const now=performance.now();if(now-lastTap<300){dragging=false;setValue(c.reset);lastTap=0;return;}lastTap=now;dragging=true;pid=e.pointerId;startY=e.clientY;startValue=c.value;try{knob.setPointerCapture(pid);}catch(_){} });
        knob.addEventListener("pointermove",e=>{if(!dragging||e.pointerId!==pid)return;if(e.cancelable)e.preventDefault();setValue(startValue+(startY-e.clientY)*(c.max-c.min)/180);});
        const stop=e=>{if(pid!==null&&e.pointerId!==pid)return;dragging=false;pid=null;};
        knob.addEventListener("pointerup",stop);knob.addEventListener("pointercancel",stop);knob.addEventListener("lostpointercapture",stop);
    });
}

function refreshSoloMuteButtons(){document.querySelectorAll(".osc[data-osc]").forEach(p=>{const n=p.dataset.osc;p.querySelector(".solo")?.classList.toggle("active",synthState[n].solo);p.querySelector(".mute")?.classList.toggle("active",synthState[n].mute);});}
function setupSoloMute(){document.querySelectorAll(".osc[data-osc]").forEach(p=>{const n=p.dataset.osc;p.querySelector(".solo").onclick=()=>{ensureAudio();synthState[n].solo=!synthState[n].solo;refreshSoloMuteButtons();updateAllLiveGains();savePersistentState();};p.querySelector(".mute").onclick=()=>{ensureAudio();synthState[n].mute=!synthState[n].mute;refreshSoloMuteButtons();updateAllLiveGains();savePersistentState();};});refreshSoloMuteButtons();}

function setVisibleKey(midi,down){document.querySelectorAll(`.key[data-midi="${midi}"]`).forEach(e=>e.classList.toggle("down",down));}
function midiIsStillHeld(midi){for(const h of pointerNotes.values())if(h.midi===midi)return true;for(const k of computerHeld)if(computerKeyMap[k]===midi)return true;return false;}
function refreshVisibleKey(midi){setVisibleKey(midi,midiIsStillHeld(midi));}
function releasePointerNote(id){const h=pointerNotes.get(id);if(!h)return;pointerNotes.delete(id);noteOffByKey(h.voiceKey);refreshVisibleKey(h.midi);}
function setupTouchKeyboard(){document.querySelectorAll("#keyboard .key[data-midi]").forEach(el=>{el.addEventListener("pointerdown",e=>{if(e.pointerType==="mouse"&&e.button!==0)return;if(e.cancelable)e.preventDefault();e.stopPropagation();if(!ensureAudio())return;const midi=Number(el.dataset.midi);releasePointerNote(e.pointerId);const voiceKey=`touch:${e.pointerId}`;pointerNotes.set(e.pointerId,{midi,voiceKey,element:el});el.classList.add("down");noteOn(midi,TOUCH_VELOCITY,null,voiceKey);},{passive:false});});document.addEventListener("pointerup",e=>releasePointerNote(e.pointerId),true);document.addEventListener("pointercancel",e=>releasePointerNote(e.pointerId),true);}

const computerKeyMap={a:60,w:61,s:62,e:63,d:64,f:65,t:66,g:67,y:68,h:69,u:70,j:71,k:72,o:73,l:74,p:75};
function setupComputerKeyboard(){window.addEventListener("keydown",e=>{const k=e.key.toLowerCase(),m=computerKeyMap[k];if(e.repeat||m===undefined||computerHeld.has(k))return;e.preventDefault();ensureAudio();computerHeld.add(k);noteOn(m,TOUCH_VELOCITY,null,`pc:${k}`);setVisibleKey(m,true);});window.addEventListener("keyup",e=>{const k=e.key.toLowerCase(),m=computerKeyMap[k];if(m===undefined)return;computerHeld.delete(k);noteOffByKey(`pc:${k}`);refreshVisibleKey(m);});}

function resizeScope(){if(!scopeCanvas||!scopeContext)return;const r=scopeCanvas.getBoundingClientRect(),d=window.devicePixelRatio||1;scopeCanvas.width=Math.max(1,Math.round(r.width*d));scopeCanvas.height=Math.max(1,Math.round(r.height*d));scopeContext.setTransform(d,0,0,d,0,0);}
function drawTrace(w,h,l,color,glow){scopeContext.beginPath();for(let i=0;i<scopeData.length;i++){const x=i/(scopeData.length-1)*w,y=h/2+(scopeData[i]-128)/128*h*.43;i?scopeContext.lineTo(x,y):scopeContext.moveTo(x,y);}scopeContext.lineWidth=l;scopeContext.strokeStyle=color;scopeContext.shadowColor="#ffb000";scopeContext.shadowBlur=glow;scopeContext.stroke();}
function drawScope(){requestAnimationFrame(drawScope);if(!scopeCanvas||!scopeContext)return;const w=scopeCanvas.clientWidth,h=scopeCanvas.clientHeight;scopeContext.clearRect(0,0,w,h);if(!analyser){scopeContext.beginPath();scopeContext.moveTo(0,h/2);scopeContext.lineTo(w,h/2);scopeContext.strokeStyle="#ffb000";scopeContext.shadowColor="#ffb000";scopeContext.shadowBlur=7;scopeContext.stroke();scopeContext.shadowBlur=0;return;}if(!scopeData||scopeData.length!==analyser.fftSize)scopeData=new Uint8Array(analyser.fftSize);analyser.getByteTimeDomainData(scopeData);drawTrace(w,h,5,"rgba(255,176,0,.18)",10);drawTrace(w,h,1.4,"#ffd76a",4);scopeContext.shadowBlur=0;}
function setupScope(){scopeCanvas=document.getElementById("scopeCanvas");scopeContext=scopeCanvas.getContext("2d");resizeScope();drawScope();}

function releaseAllInputNotes(){[...pointerNotes.keys()].forEach(releasePointerNote);computerHeld.forEach(k=>noteOffByKey(`pc:${k}`));computerHeld.clear();midiHeld.forEach(noteOffByKey);midiHeld.clear();document.querySelectorAll(".key.down").forEach(e=>e.classList.remove("down"));}
window.addEventListener("blur",releaseAllInputNotes);window.addEventListener("pagehide",savePersistentState);window.addEventListener("beforeunload",savePersistentState);
document.addEventListener("visibilitychange",()=>{if(document.hidden){savePersistentState();releaseAllInputNotes();}});
document.addEventListener("touchmove",e=>{const t=e.target instanceof Element?e.target:null;if((t?.closest(".knob")||t?.closest("#keyboard"))&&e.cancelable)e.preventDefault();},{passive:false});

function bootQuadSynth(){loadPersistentState();syncKnobs();setupKnobs();setupSoloMute();setupTouchKeyboard();setupComputerKeyboard();setupScope();ensureAudio();window.addEventListener("resize",resizeScope);savePersistentState();console.log("QuadSynth ready: native Android MIDI bridge enabled.");}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bootQuadSynth,{once:true});else bootQuadSynth();

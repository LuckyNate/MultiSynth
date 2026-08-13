"use strict";

const MAX_VOICES = 12;
const TOUCH_VELOCITY = 127;
const STORAGE_KEY = "PureSynth.PersistentState.v1";
const TAU = Math.PI * 2;
const WAVEFORMS = [
    ["sine", "SINE"],
    ["square", "SQUARE"],
    ["triangle", "TRIANGLE"],
    ["click", "TIME-MATCHED CLICK"],
    ["white", "WHITE NOISE"],
    ["pink", "PINK NOISE"],
    ["brown", "BROWN NOISE"],
    ["blue", "BLUE NOISE"],
    ["violet", "VIOLET NOISE"]
];

const pureState = { waveform: "sine", level: .8, pwm: 50, peak: 50 };
const envelopeState = { attack: .001, decay: .10, sustain: .75, release: .25 };

let audioCtx = null;
let masterGain = null;
let analyser = null;
let keepAlive = null;
let keepAliveGain = null;

const voices = new Map();
const touchNotes = new Map();
const computerNotes = new Map();
const pureWaveCache = new Map();

function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
}

function wrap01(value) {
    value %= 1;
    return value < 0 ? value + 1 : value;
}

function midiToFrequency(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
}

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            pure: pureState,
            envelope: envelopeState,
            master: Number(document.getElementById("master")?.value || .35)
        }));
    } catch (_) {}
}

function loadState() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        if (!saved) return;
        if (saved.pure) {
            if (saved.pure.waveform === "saw") {
                pureState.waveform = "triangle";
                pureState.peak = 100;
            } else if (saved.pure.waveform === "reverseSaw") {
                pureState.waveform = "triangle";
                pureState.peak = 0;
            } else if (WAVEFORMS.some(entry => entry[0] === saved.pure.waveform)) {
                pureState.waveform = saved.pure.waveform;
                pureState.peak = clamp(Number(saved.pure.peak) || 50, 0, 100);
            }
            pureState.level = clamp(Number(saved.pure.level), 0, 1);
            if (!Number.isFinite(pureState.level)) pureState.level = .8;
            pureState.pwm = clamp(Number(saved.pure.pwm) || 50, 1, 99);
        }
        if (saved.envelope) {
            envelopeState.attack = clamp(Number(saved.envelope.attack) || .001, .001, 2);
            envelopeState.decay = clamp(Number(saved.envelope.decay) || .001, .001, 2);
            envelopeState.sustain = clamp(Number(saved.envelope.sustain) || 0, 0, 1);
            envelopeState.release = clamp(Number(saved.envelope.release) || .001, .001, 3);
        }
        if (Number.isFinite(Number(saved.master))) {
            document.getElementById("master").value = String(clamp(Number(saved.master), 0, 1));
        }
    } catch (_) {}
}

function ensureAudio() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return false;
        audioCtx = new AudioContextClass({ latencyHint: "interactive" });
        masterGain = audioCtx.createGain();
        masterGain.gain.value = Number(document.getElementById("master")?.value || .35);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0;
        masterGain.connect(analyser);
        analyser.connect(audioCtx.destination);
        keepAlive = audioCtx.createOscillator();
        keepAliveGain = audioCtx.createGain();
        keepAlive.frequency.value = 20;
        keepAliveGain.gain.value = .0000001;
        keepAlive.connect(keepAliveGain);
        keepAliveGain.connect(masterGain);
        keepAlive.start();
        document.getElementById("status").textContent =
            "AUDIO " + Math.round(audioCtx.sampleRate / 1000) + "K";
    }
    if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    return true;
}

function warmAudioEngine() {
    ensureAudio();
}

function noiseSlope(type) {
    if (type === "pink") return -.5;
    if (type === "brown") return -1;
    if (type === "blue") return .5;
    if (type === "violet") return 1;
    return 0;
}

function seededRandom(seed) {
    let value = seed | 0;
    return function () {
        value ^= value << 13;
        value ^= value >>> 17;
        value ^= value << 5;
        return ((value >>> 0) + 1) / 4294967297;
    };
}

function sampledShape(type, x, pwm, peakPercent) {
    if (type === "sine") return Math.sin(TAU * x);
    if (type === "square") return x < pwm / 100 ? 1 : -1;
    if (type === "triangle") {
        const peak = clamp(peakPercent / 100, 0, 1);
        if (peak <= 0) return 1 - 2 * x;
        if (peak >= 1) return -1 + 2 * x;
        return x < peak
            ? -1 + 2 * x / peak
            : 1 - 2 * (x - peak) / (1 - peak);
    }
    if (type === "click") {
        const width = .16;
        if (x >= width) return 0;
        const segment = width / 4;
        if (x < segment) return -x / segment;
        if (x < segment * 2) return -1 + (x - segment) / segment;
        if (x < segment * 3) return (x - segment * 2) / segment;
        return 1 - (x - segment * 3) / segment;
    }
    return 0;
}

function makePureWave(type, pwm, peak) {
    const harmonics = 96;
    const real = new Float32Array(harmonics + 1);
    const imag = new Float32Array(harmonics + 1);
    if (["white", "pink", "brown", "blue", "violet"].includes(type)) {
        const random = seededRandom(0x50555245 + WAVEFORMS.findIndex(entry => entry[0] === type) * 7919);
        const slope = noiseSlope(type);
        for (let harmonic = 1; harmonic <= harmonics; harmonic++) {
            const amplitude = Math.pow(harmonic, slope);
            const angle = random() * TAU;
            real[harmonic] = Math.cos(angle) * amplitude;
            imag[harmonic] = Math.sin(angle) * amplitude;
        }
    } else {
        const samples = 1024;
        for (let harmonic = 1; harmonic <= harmonics; harmonic++) {
            let cosine = 0;
            let sine = 0;
            for (let index = 0; index < samples; index++) {
                const sample = sampledShape(type, index / samples, pwm, peak);
                const angle = TAU * harmonic * index / samples;
                cosine += sample * Math.cos(angle);
                sine += sample * Math.sin(angle);
            }
            real[harmonic] = cosine * 2 / samples;
            imag[harmonic] = sine * 2 / samples;
        }
    }
    return audioCtx.createPeriodicWave(real, imag, { disableNormalization: false });
}

function getPureWave(type, pwm, peak) {
    const shapeValue = type === "square" ? Math.round(pwm) : type === "triangle" ? Math.round(peak) : 50;
    const key = type + ":" + shapeValue;
    let wave = pureWaveCache.get(key);
    if (!wave) {
        wave = makePureWave(type, pwm, peak);
        pureWaveCache.set(key, wave);
    }
    return wave;
}

class PureVoice {
    constructor(note, velocity, key) {
        this.note = note;
        this.key = key;
        this.frequency = midiToFrequency(note);
        this.releasing = false;
        this.stopped = false;
        this.oscillator = audioCtx.createOscillator();
        this.oscillator.frequency.value = this.frequency;
        this.oscillator.setPeriodicWave(getPureWave(pureState.waveform, pureState.pwm, pureState.peak));
        this.sourceGain = audioCtx.createGain();
        this.sourceGain.gain.value = pureState.level;
        this.voiceGain = audioCtx.createGain();
        this.voiceGain.gain.value = 0;
        this.oscillator.connect(this.sourceGain);
        this.sourceGain.connect(this.voiceGain);
        this.voiceGain.connect(masterGain);

        const now = audioCtx.currentTime;
        const peak = clamp(Number(velocity) / 127, .001, 1);
        const attack = Math.max(.001, envelopeState.attack);
        const decay = Math.max(.001, envelopeState.decay);
        this.voiceGain.gain.setValueAtTime(0, now);
        this.voiceGain.gain.linearRampToValueAtTime(peak, now + attack);
        this.voiceGain.gain.linearRampToValueAtTime(
            Math.max(.0001, peak * envelopeState.sustain),
            now + attack + decay
        );
        this.oscillator.start(now);
    }

    update() {
        if (!audioCtx || this.stopped) return;
        const now = audioCtx.currentTime;
        this.sourceGain.gain.setTargetAtTime(pureState.level, now, .005);
        this.oscillator.setPeriodicWave(getPureWave(pureState.waveform, pureState.pwm, pureState.peak));
    }

    release() {
        if (this.releasing || this.stopped || !audioCtx) return;
        this.releasing = true;
        const now = audioCtx.currentTime;
        const release = Math.max(.005, envelopeState.release);
        const gain = this.voiceGain.gain;
        if (gain.cancelAndHoldAtTime) gain.cancelAndHoldAtTime(now);
        else {
            gain.cancelScheduledValues(now);
            gain.setValueAtTime(Math.max(.0001, gain.value), now);
        }
        gain.exponentialRampToValueAtTime(.0001, now + release);
        this.stopped = true;
        try { this.oscillator.stop(now + release + .06); } catch (_) {}
        setTimeout(() => {
            try { this.voiceGain.disconnect(); } catch (_) {}
        }, (release + .12) * 1000);
    }

    kill() {
        if (this.stopped || !audioCtx) return;
        this.stopped = true;
        try { this.oscillator.stop(audioCtx.currentTime); } catch (_) {}
        try { this.voiceGain.disconnect(); } catch (_) {}
    }
}

function noteOn(note, velocity = TOUCH_VELOCITY, _overrideState = null, voiceKey = null) {
    if (!ensureAudio() || !Number.isFinite(note = Number(note))) return;
    const key = voiceKey || `note:${note}`;
    if (voices.has(key)) {
        voices.get(key).kill();
        voices.delete(key);
    }
    if (voices.size >= MAX_VOICES) {
        const oldestKey = voices.keys().next().value;
        voices.get(oldestKey)?.kill();
        voices.delete(oldestKey);
    }
    voices.set(key, new PureVoice(note, velocity, key));
    setVisibleKey(note, true);
}

function noteOffByKey(key) {
    const voice = voices.get(key);
    if (!voice) return;
    voice.release();
    voices.delete(key);
    refreshVisibleKey(voice.note);
}

function panicAll() {
    voices.forEach(voice => voice.kill());
    voices.clear();
    touchNotes.clear();
    computerNotes.clear();
    document.querySelectorAll(".key.down").forEach(key => key.classList.remove("down"));
    document.querySelectorAll(".knob.active").forEach(knob => knob.classList.remove("active"));
}


function updateAllVoices() {
    voices.forEach(voice => voice.update());
}

function initializePureControls() {
    const waveformPanel = document.getElementById("waveforms");
    waveformPanel.innerHTML = "";
    WAVEFORMS.forEach(entry => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "waveButton";
        button.dataset.waveform = entry[0];
        button.textContent = entry[1];
        button.addEventListener("click", () => {
            ensureAudio();
            pureState.waveform = entry[0];
            refreshPureControls();
            updateAllVoices();
            saveState();
        });
        waveformPanel.appendChild(button);
    });
    document.getElementById("level").value = String(pureState.level);
    document.getElementById("pwm").value = String(pureState.pwm);
    document.getElementById("peak").value = String(pureState.peak);
    bindSlider("level", value => {
        pureState.level = value;
        updateAllVoices();
        return Math.round(value * 100) + "%";
    });
    bindSlider("pwm", value => {
        pureState.pwm = value;
        if (pureState.waveform === "square") updateAllVoices();
        return Math.round(value) + "%";
    });
    bindSlider("peak", value => {
        pureState.peak = value;
        if (pureState.waveform === "triangle") updateAllVoices();
        return Math.round(value) + "%";
    });
    refreshPureControls();
}

function refreshPureControls() {
    document.querySelectorAll(".waveButton").forEach(button => {
        button.classList.toggle("active", button.dataset.waveform === pureState.waveform);
    });
    const pwm = document.getElementById("pwm");
    const peak = document.getElementById("peak");
    const square = pureState.waveform === "square";
    const triangle = pureState.waveform === "triangle";
    pwm.disabled = !square;
    peak.disabled = !triangle;
    document.getElementById("pwmControl").classList.toggle("disabled", !square);
    document.getElementById("peakControl").classList.toggle("disabled", !triangle);
}

function initializeGlobalControls() {
    document.getElementById("attack").value = String(envelopeState.attack);
    document.getElementById("decay").value = String(envelopeState.decay);
    document.getElementById("sustain").value = String(envelopeState.sustain);
    document.getElementById("release").value = String(envelopeState.release);
    bindSlider("attack", value => { envelopeState.attack = value; return timeLabel(value); });
    bindSlider("decay", value => { envelopeState.decay = value; return timeLabel(value); });
    bindSlider("sustain", value => { envelopeState.sustain = value; return `${Math.round(value * 100)}%`; });
    bindSlider("release", value => { envelopeState.release = value; return timeLabel(value); });
    bindSlider("master", value => {
        if (masterGain && audioCtx) masterGain.gain.setTargetAtTime(value, audioCtx.currentTime, .01);
        return `${Math.round(value * 100)}%`;
    });
    document.getElementById("panic").addEventListener("click", panicAll);
}

function bindSlider(id, handler) {
    const slider = document.getElementById(id);
    const output = document.getElementById(`${id}-value`);
    function update() {
        output.textContent = handler(Number(slider.value));
        saveState();
    }
    slider.addEventListener("input", update);
    update();
}

function timeLabel(seconds) {
    return seconds < 1 ? `${Math.round(seconds * 1000)} ms` : `${seconds.toFixed(2)} s`;
}

function buildKeyboard() {
    const keyboard = document.getElementById("keyboard");
    keyboard.innerHTML = "";
    const startNote = 48;
    const endNote = 72;
    const blackClasses = new Set([1, 3, 6, 8, 10]);
    const whiteCount = Array.from({ length: endNote - startNote + 1 }, (_, i) => startNote + i)
        .filter(note => !blackClasses.has(note % 12)).length;
    const whiteWidth = 100 / whiteCount;
    let whiteIndex = 0;

    for (let note = startNote; note <= endNote; note++) {
        const black = blackClasses.has(note % 12);
        const key = document.createElement("div");
        key.className = `key ${black ? "black" : "white"}`;
        key.dataset.note = String(note);
        if (black) {
            const width = whiteWidth * .64;
            key.style.width = `${width}%`;
            key.style.left = `${whiteIndex * whiteWidth - width / 2}%`;
        } else {
            key.style.width = `${whiteWidth}%`;
            key.style.left = `${whiteIndex * whiteWidth}%`;
            whiteIndex++;
        }

        key.addEventListener("pointerdown", event => {
            event.preventDefault();
            event.stopPropagation();
            if (touchNotes.has(event.pointerId)) return;
            const voiceKey = `touch:${event.pointerId}`;
            touchNotes.set(event.pointerId, { note, voiceKey });
            try { key.setPointerCapture(event.pointerId); } catch (_) {}
            noteOn(note, TOUCH_VELOCITY, null, voiceKey);
        });

        function release(event) {
            const held = touchNotes.get(event.pointerId);
            if (!held) return;
            touchNotes.delete(event.pointerId);
            noteOffByKey(held.voiceKey);
        }

        key.addEventListener("pointerup", release);
        key.addEventListener("pointercancel", release);
        key.addEventListener("lostpointercapture", release);
        keyboard.appendChild(key);
    }
}

function setVisibleKey(note, down) {
    document.querySelectorAll(`.key[data-note="${note}"]`).forEach(key => key.classList.toggle("down", down));
}

function noteStillHeld(note) {
    for (const held of touchNotes.values()) if (held.note === note) return true;
    for (const held of computerNotes.values()) if (held.note === note) return true;
    return false;
}

function refreshVisibleKey(note) {
    setVisibleKey(note, noteStillHeld(note));
}

const computerKeyMap = {
    a: 48, w: 49, s: 50, e: 51, d: 52, f: 53, t: 54, g: 55,
    y: 56, h: 57, u: 58, j: 59, k: 60, o: 61, l: 62, p: 63, ";": 64
};

function setupComputerKeyboard() {
    window.addEventListener("keydown", event => {
        if (event.repeat) return;
        const key = event.key.toLowerCase();
        const note = computerKeyMap[key];
        if (note === undefined || computerNotes.has(key)) return;
        event.preventDefault();
        const voiceKey = `pc:${key}`;
        computerNotes.set(key, { note, voiceKey });
        noteOn(note, TOUCH_VELOCITY, null, voiceKey);
    });
    window.addEventListener("keyup", event => {
        const key = event.key.toLowerCase();
        const held = computerNotes.get(key);
        if (!held) return;
        event.preventDefault();
        computerNotes.delete(key);
        noteOffByKey(held.voiceKey);
    });
}

function initializeScope() {
    const canvas = document.getElementById("scope");
    const context = canvas.getContext("2d");
    let data = null;

    function resize() {
        const ratio = Math.max(1, window.devicePixelRatio || 1);
        const rectangle = canvas.getBoundingClientRect();
        canvas.width = Math.floor(rectangle.width * ratio);
        canvas.height = Math.floor(rectangle.height * ratio);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function draw() {
        requestAnimationFrame(draw);
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        context.clearRect(0, 0, width, height);
        context.beginPath();
        context.strokeStyle = analyser ? "#ffffff" : "#555555";
        context.lineWidth = analyser ? 1.6 : 1;
        context.shadowColor = "#ffffff";
        context.shadowBlur = analyser ? 8 : 0;
        if (!analyser) {
            context.moveTo(0, height / 2);
            context.lineTo(width, height / 2);
        } else {
            if (!data || data.length !== analyser.fftSize) data = new Uint8Array(analyser.fftSize);
            analyser.getByteTimeDomainData(data);
            data.forEach((sample, index) => {
                const x = index / (data.length - 1) * width;
                const y = sample / 255 * height;
                index ? context.lineTo(x, y) : context.moveTo(x, y);
            });
        }
        context.stroke();
        context.shadowBlur = 0;
    }

    window.addEventListener("resize", resize);
    resize();
    draw();
}

function shutdownAudioEngine() {
    panicAll();
    if (audioCtx) {
        const closing = audioCtx;
        audioCtx = null;
        masterGain = null;
        analyser = null;
        keepAlive = null;
        keepAliveGain = null;
        pureWaveCache.clear();
        closing.close().catch(() => {});
    }
}

function bootPureSynth() {
    buildKeyboard();
    loadState();
    initializePureControls();
    initializeGlobalControls();
    setupComputerKeyboard();
    initializeScope();
    warmAudioEngine();
    console.log("PureSynth ready: mathematically generated pure waveform engine enabled.");
}

window.addEventListener("blur", panicAll);
window.addEventListener("pagehide", () => { saveState(); shutdownAudioEngine(); });
document.addEventListener("visibilitychange", () => { if (document.hidden) panicAll(); });
document.addEventListener("touchmove", event => {
    const target = event.target instanceof Element ? event.target : null;
    if ((target?.closest(".knob") || target?.closest("#keyboard")) && event.cancelable) event.preventDefault();
}, { passive: false });

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootPureSynth, { once: true });
} else bootPureSynth();

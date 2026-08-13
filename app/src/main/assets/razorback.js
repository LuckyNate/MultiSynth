"use strict";

const MAX_VOICES = 12;
const TOUCH_VELOCITY = 127;
const STORAGE_KEY = "Razorback.PersistentState.v1";
const TAU = Math.PI * 2;

const channelState = [
    { octave: 0, detune: 0, peak: 25, amount: 35, phase: 0 },
    { octave: 0, detune: 0, peak: 50, amount: 25, phase: 120 },
    { octave: 0, detune: 0, peak: 75, amount: 20, phase: 240 }
];

const channelDescriptions = [
    "FIRST MOVABLE-PEAK STAGE",
    "SECOND MOVABLE-PEAK STAGE",
    "FINAL MOVABLE-PEAK STAGE"
];

const parameterDefinitions = [
    { name: "octave", label: "OCTAVE", minimum: -4, maximum: 4, step: 1, circular: false },
    { name: "detune", label: "DETUNE", minimum: -100, maximum: 100, step: 1, circular: false },
    { name: "peak", label: "PEAK", minimum: 0, maximum: 100, step: 1, circular: false },
    { name: "amount", label: "AMOUNT", minimum: 0, maximum: 100, step: 1, circular: false },
    { name: "phase", label: "PHASE", minimum: 0, maximum: 359, step: 1, circular: true }
];

const envelopeState = {
    attack: .001,
    decay: .10,
    sustain: .75,
    release: .25
};

let audioCtx = null;
let masterGain = null;
let analyser = null;
let keepAlive = null;
let keepAliveGain = null;
const voices = new Map();
const touchNotes = new Map();
const computerNotes = new Map();

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

function stageFrequency(baseFrequency, octave, detune) {
    return baseFrequency * Math.pow(2, octave + detune / 1200);
}

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            channels: channelState,
            envelope: envelopeState,
            carrier: Number(document.getElementById("carrier")?.value || 1),
            master: Number(document.getElementById("master")?.value || .35)
        }));
    } catch (_) {}
}

function loadState() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        if (!saved) return;
        saved.channels?.slice(0, 3).forEach((channel, index) => {
            channelState[index].octave = Math.round(clamp(Number(channel.octave) || 0, -4, 4));
            channelState[index].peak = Math.round(clamp(Number(channel.peak) || 0, 0, 100));
            channelState[index].detune = Math.round(clamp(Number(channel.detune) || 0, -100, 100));
            channelState[index].amount = Math.round(clamp(Number(channel.amount) || 0, 0, 100));
            channelState[index].phase = Math.round(clamp(Number(channel.phase) || 0, 0, 359));
        });
        if (saved.envelope) {
            envelopeState.attack = clamp(Number(saved.envelope.attack) || .001, .001, 2);
            envelopeState.decay = clamp(Number(saved.envelope.decay) || .001, .001, 2);
            envelopeState.sustain = clamp(Number(saved.envelope.sustain) || 0, 0, 1);
            envelopeState.release = clamp(Number(saved.envelope.release) || .001, .001, 3);
        }
        if (Number.isFinite(Number(saved.carrier))) {
            document.getElementById("carrier").value = String(clamp(Number(saved.carrier), 0, 1));
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
            `AUDIO ${Math.round(audioCtx.sampleRate / 1000)}K`;
    }
    if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    return true;
}

function warmAudioEngine() {
    ensureAudio();
}

class PureWaveSource {
    constructor(waveType, frequency, shape, phaseDegrees) {
        this.waveType = waveType;
        this.frequencyValue = frequency;
        this.shapeValue = shape;
        this.phaseValue = wrap01(phaseDegrees / 360);
        this.bufferLength = 2048;
        this.output = audioCtx.createGain();
        this.source = null;
        this.started = false;
        this.stopped = false;

        this.frequency = {
            setTargetAtTime: (value, when, timeConstant) =>
                this.setFrequency(value, when, timeConstant)
        };
        this.shape = {
            setTargetAtTime: value => this.setShape(value)
        };
        this.phase = {
            setTargetAtTime: value => this.setPhase(value)
        };
    }

    sample(position) {
        if (this.waveType === "razor") {
            const peak = clamp(this.shapeValue / 100, 0, 1);
            if (peak <= 0) return 1 - 2 * position;
            if (peak >= 1) return -1 + 2 * position;
            return position < peak
                ? -1 + 2 * position / peak
                : 1 - 2 * (position - peak) / (1 - peak);
        }
        const distance = position < .5 ? position * 2 : (1 - position) * 2;
        const drive = clamp(this.shapeValue / 100, 0, 1);
        const exponent = 1 + Math.pow(drive, 1.35) * 7;
        return -1 + 2 * Math.pow(distance, exponent);
    }

    makeBuffer() {
        const buffer = audioCtx.createBuffer(1, this.bufferLength, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let index = 0; index < data.length; index++) {
            const position = wrap01(index / data.length + this.phaseValue);
            data[index] = this.sample(position);
        }
        return buffer;
    }

    createSource(when) {
        const source = audioCtx.createBufferSource();
        source.buffer = this.makeBuffer();
        source.loop = true;
        source.playbackRate.value =
            this.frequencyValue * this.bufferLength / audioCtx.sampleRate;
        source.connect(this.output);
        source.start(when);
        return source;
    }

    rebuild() {
        if (!this.started || this.stopped) return;
        const now = audioCtx.currentTime;
        const previous = this.source;
        this.source = this.createSource(now);
        if (previous) {
            try { previous.stop(now + .002); } catch (_) {}
        }
    }

    setFrequency(value, when = audioCtx.currentTime, timeConstant = .005) {
        this.frequencyValue = value;
        if (this.source) {
            this.source.playbackRate.setTargetAtTime(
                value * this.bufferLength / audioCtx.sampleRate,
                when,
                timeConstant
            );
        }
    }

    setShape(value) {
        if (value === this.shapeValue) return;
        this.shapeValue = value;
        this.rebuild();
    }

    setPhase(value) {
        value = wrap01(value);
        if (value === this.phaseValue) return;
        this.phaseValue = value;
        this.rebuild();
    }

    connect(destination) {
        this.output.connect(destination);
    }

    start(when = audioCtx.currentTime) {
        if (this.started || this.stopped) return;
        this.started = true;
        this.source = this.createSource(when);
    }

    stop(when = audioCtx.currentTime) {
        if (this.stopped) return;
        this.stopped = true;
        if (this.source) {
            try { this.source.stop(when); } catch (_) {}
        }
        const delay = Math.max(0, (when - audioCtx.currentTime) * 1000);
        setTimeout(() => {
            try { this.output.disconnect(); } catch (_) {}
        }, delay + 10);
    }
}

class RazorbackVoice {
    constructor(note, velocity, key) {
        this.note = note;
        this.key = key;
        this.frequency = midiToFrequency(note);
        this.releasing = false;
        this.stopped = false;
        this.stages = [];
        this.modulators = [];

        this.carrier = new PureWaveSource("razor", this.frequency, 50, 0);

        this.carrierGain = audioCtx.createGain();
        this.carrierGain.gain.value = Number(document.getElementById("carrier")?.value || 1);
        this.carrier.connect(this.carrierGain);

        let signal = this.carrierGain;
        for (let index = 0; index < 3; index++) {
            const stage = this.createStage(index);
            signal.connect(stage.input);
            signal = stage.output;
            this.stages.push(stage);
        }

        this.voiceGain = audioCtx.createGain();
        this.voiceGain.gain.value = 0;
        signal.connect(this.voiceGain);
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

        this.carrier.start(now);
        this.modulators.forEach(modulator => modulator.start(now));
    }

    createStage(index) {
        const state = channelState[index];
        const input = audioCtx.createGain();
        const mixer = audioCtx.createGain();
        const modulator = new PureWaveSource(
            "razor",
            stageFrequency(this.frequency, state.octave, state.detune),
            state.peak,
            state.phase
        );
        const amountGain = audioCtx.createGain();

        input.gain.value = 1;
        amountGain.gain.value = state.amount / 100;

        input.connect(mixer);
        modulator.connect(amountGain);
        amountGain.connect(mixer);
        this.modulators.push(modulator);

        return { input, output: mixer, modulator, amountGain };
    }

    update() {
        if (!audioCtx || this.stopped) return;
        const now = audioCtx.currentTime;
        this.stages.forEach((stage, index) => {
            const state = channelState[index];
            stage.modulator.frequency.setTargetAtTime(
                stageFrequency(this.frequency, state.octave, state.detune), now, .005
            );
            stage.amountGain.gain.setTargetAtTime(state.amount / 100, now, .005);
            stage.modulator.shape.setTargetAtTime(state.peak, now, .005);
            stage.modulator.phase.setTargetAtTime(wrap01(state.phase / 360), now, .005);
        });
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
        const stopAt = now + release + .06;
        this.stopSources(stopAt);
        setTimeout(() => this.disconnect(), (release + .12) * 1000);
    }

    kill() {
        if (this.stopped || !audioCtx) return;
        this.stopSources(audioCtx.currentTime);
        this.disconnect();
    }

    stopSources(when) {
        if (this.stopped) return;
        this.stopped = true;
        try { this.carrier.stop(when); } catch (_) {}
        this.modulators.forEach(modulator => {
            try { modulator.stop(when); } catch (_) {}
        });
    }

    disconnect() {
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
    voices.set(key, new RazorbackVoice(note, velocity, key));
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

function buildChannels() {
    const container = document.getElementById("channels");
    container.innerHTML = "";
    channelState.forEach((state, channelIndex) => {
        const channel = document.createElement("article");
        channel.className = "channel";
        const title = document.createElement("h2");
        title.textContent = `RAMP ${channelIndex + 1}`;
        const description = document.createElement("p");
        description.className = "signalLabel";
        description.textContent = channelDescriptions[channelIndex];
        const controls = document.createElement("div");
        controls.className = "controls";
        parameterDefinitions.forEach(definition => {
            controls.appendChild(createControl(channelIndex, definition, state[definition.name]));
        });
        channel.append(title, description, controls);
        container.appendChild(channel);
    });
}

function createControl(channelIndex, definition, initialValue) {
    const control = document.createElement("div");
    control.className = "control";
    const label = document.createElement("label");
    label.textContent = definition.label;
    const plus = document.createElement("button");
    plus.type = "button";
    plus.className = "stepButton plus";
    plus.textContent = "+";
    const knob = document.createElement("div");
    knob.className = "knob";
    knob.setAttribute("role", "slider");
    const output = document.createElement("output");
    const minus = document.createElement("button");
    minus.type = "button";
    minus.className = "stepButton minus";
    minus.textContent = "−";
    control.append(label, plus, knob, output, minus);
    initializeKnob(channelIndex, definition, initialValue, knob, output, plus, minus);
    return control;
}

function initializeKnob(channelIndex, definition, initialValue, knob, output, plus, minus) {
    const { name, minimum, maximum, step, circular } = definition;
    let value = initialValue;
    let dragging = false;
    let pointerId = null;
    let startY = 0;
    let startValue = value;
    let lastTap = 0;

    function applyValue(nextValue) {
        if (circular) {
            const range = maximum - minimum + step;
            while (nextValue > maximum) nextValue -= range;
            while (nextValue < minimum) nextValue += range;
        } else nextValue = clamp(nextValue, minimum, maximum);
        value = Math.round(nextValue / step) * step;
        channelState[channelIndex][name] = value;
        const angle = -135 + (value - minimum) / (maximum - minimum) * 270;
        knob.style.setProperty("--rotation", `${angle}deg`);
        knob.setAttribute("aria-valuemin", String(minimum));
        knob.setAttribute("aria-valuemax", String(maximum));
        knob.setAttribute("aria-valuenow", String(value));
        output.textContent = formatParameter(name, value);
        updateAllVoices();
        saveState();
    }

    knob.addEventListener("pointerdown", event => {
        if (dragging) return;
        event.preventDefault();
        event.stopPropagation();
        ensureAudio();
        const now = performance.now();
        if (now - lastTap < 320) {
            applyValue(initialValue);
            lastTap = 0;
            return;
        }
        lastTap = now;
        dragging = true;
        pointerId = event.pointerId;
        startY = event.clientY;
        startValue = value;
        knob.classList.add("active");
        try { knob.setPointerCapture(pointerId); } catch (_) {}
    });

    knob.addEventListener("pointermove", event => {
        if (!dragging || event.pointerId !== pointerId) return;
        event.preventDefault();
        event.stopPropagation();
        applyValue(startValue + (startY - event.clientY) * (maximum - minimum) / 180);
    });

    function endDrag(event) {
        if (!dragging || event.pointerId !== pointerId) return;
        if (event.cancelable) event.preventDefault();
        event.stopPropagation();
        dragging = false;
        pointerId = null;
        knob.classList.remove("active");
    }

    knob.addEventListener("pointerup", endDrag);
    knob.addEventListener("pointercancel", endDrag);
    knob.addEventListener("lostpointercapture", event => {
        if (event.pointerId === pointerId) {
            dragging = false;
            pointerId = null;
            knob.classList.remove("active");
        }
    });
    plus.addEventListener("click", () => { ensureAudio(); applyValue(value + step); });
    minus.addEventListener("click", () => { ensureAudio(); applyValue(value - step); });
    applyValue(initialValue);
}

function formatParameter(name, value) {
    if (name === "octave") return value > 0 ? `+${value}` : String(value);
    if (name === "detune") return `${value > 0 ? "+" : ""}${value} ct`;
    if (name === "peak" || name === "amount") return `${value}%`;
    if (name === "phase") return `${value}°`;
    return String(value);
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
    bindSlider("carrier", value => {
        if (audioCtx) {
            const now = audioCtx.currentTime;
            voices.forEach(voice => voice.carrierGain.gain.setTargetAtTime(value, now, .005));
        }
        return `${Math.round(value * 100)}%`;
    });
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
        context.strokeStyle = analyser ? "#ff5b5f" : "#5a1114";
        context.lineWidth = analyser ? 1.6 : 1;
        context.shadowColor = "#ff3037";
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
        closing.close().catch(() => {});
    }
}

function bootRazorback() {
    loadState();
    buildChannels();
    initializeGlobalControls();
    buildKeyboard();
    setupComputerKeyboard();
    initializeScope();
    warmAudioEngine();
    console.log("Razorback ready: three-stage movable-peak ramp ladder enabled.");
}

window.addEventListener("blur", panicAll);
window.addEventListener("pagehide", () => { saveState(); shutdownAudioEngine(); });
document.addEventListener("visibilitychange", () => { if (document.hidden) panicAll(); });
document.addEventListener("touchmove", event => {
    const target = event.target instanceof Element ? event.target : null;
    if ((target?.closest(".knob") || target?.closest("#keyboard")) && event.cancelable) event.preventDefault();
}, { passive: false });

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootRazorback, { once: true });
} else bootRazorback();

(function () {
    "use strict";

    const held = new Map();
    const sustained = new Set();
    const sustainByChannel = new Array(16).fill(false);
    let runningStatus = null;
    let midiClockPulses = 0;
    let lastQuarterAt = 0;
    let clockBpm = 120;

    function key(channel, note) { return channel + ":" + note; }
    function MS() { return window.MultiSynth || {}; }

    function clone(value) {
        if (value == null) return value;
        if (typeof structuredClone === "function") return structuredClone(value);
        return JSON.parse(JSON.stringify(value));
    }

    function rootRacks(graph) {
        const children = new Set((graph.edges || []).map(e => e.to));
        const roots = (graph.racks || []).filter(r => !children.has(r.id));
        return roots.length ? roots : (graph.racks || []);
    }

    function routeRack(graph, rackId, packet, seen) {
        if (packet == null || seen.has(rackId)) return;
        seen.add(rackId);
        const rack = (graph.racks || []).find(r => r.id === rackId);
        if (!rack) return;
        let out = packet;
        const C = MS().ModuleContract;
        if (!C) return;
        for (const module of (rack.modules || []).filter(m => m.enabled !== false)) {
            if (out == null) break;
            try {
                try { C.getRuntime(module.id); }
                catch (_) { MS().RackEngine?.createModuleRuntime?.(rack.id, module.id, { audioContext: MS().RackAudioGraph?.context, native: MS().rack?.native || null }); }
                out = C.cv(module.id, out);
            } catch (err) { console.error("USB-C CV", err); }
        }
        if (out == null) return;
        for (const edge of (graph.edges || []).filter(e => e.from === rackId)) {
            routeRack(graph, edge.to, clone(out), new Set(seen));
        }
    }

    function emitCV(packet) {
        const engine = MS().RackEngine;
        if (!engine?.graph || !MS().ModuleContract) return false;
        let graph;
        try { graph = engine.graph(); } catch (_) { return false; }
        const p = Object.assign({ source: "usb-c", transport: "midi", time: MS().RackAudioGraph?.context?.currentTime || 0 }, packet || {});
        for (const root of rootRacks(graph)) routeRack(graph, root.id, clone(p), new Set());
        window.dispatchEvent(new CustomEvent("multisynth-usb-cv", { detail: clone(p) }));
        return true;
    }

    function noteOnNative(channel, note, velocity) {
        const id = "native-midi:" + key(channel, note);
        held.set(key(channel, note), id);
        sustained.delete(key(channel, note));
        if (typeof noteOn === "function") noteOn(note, velocity, null, id);
        else MS().RackAudioGraph?.noteOn?.(note, velocity);
        if (typeof setVisibleKey === "function") setVisibleKey(note, true);
        emitCV({ kind: "trigger", gate: true, value: velocity / 127, velocity, note, channel });
    }

    function release(channel, note) {
        const k = key(channel, note);
        const id = held.get(k) || "native-midi:" + k;
        held.delete(k);
        if (sustainByChannel[channel]) { sustained.add(k); return; }
        if (typeof noteOffByKey === "function") noteOffByKey(id);
        else MS().RackAudioGraph?.noteOff?.(note);
        if (typeof refreshVisibleKey === "function") refreshVisibleKey(note);
        emitCV({ kind: "gate", gate: false, value: 0, note, channel });
    }

    function sustain(channel, down) {
        sustainByChannel[channel] = down;
        emitCV({ kind: "control", control: 64, value: down ? 1 : 0, raw: down ? 127 : 0, channel });
        if (down) return;
        [...sustained].forEach(k => {
            const parts = k.split(":");
            if (+parts[0] !== channel) return;
            sustained.delete(k);
            if (held.has(k)) return;
            if (typeof noteOffByKey === "function") noteOffByKey("native-midi:" + k);
            else MS().RackAudioGraph?.noteOff?.(+parts[1]);
            if (typeof refreshVisibleKey === "function") refreshVisibleKey(+parts[1]);
            emitCV({ kind: "gate", gate: false, value: 0, note: +parts[1], channel });
        });
    }

    function realtime(status) {
        const now = performance.now();
        if (status === 0xfa) {
            midiClockPulses = 0;
            lastQuarterAt = 0;
            emitCV({ kind: "transport", action: "start", value: 1, gate: true, bpm: clockBpm });
            return;
        }
        if (status === 0xfc) {
            emitCV({ kind: "transport", action: "stop", value: 0, gate: false, bpm: clockBpm });
            midiClockPulses = 0;
            lastQuarterAt = 0;
            return;
        }
        if (status !== 0xf8) return;
        midiClockPulses++;
        if (midiClockPulses % 24 !== 0) return;
        if (lastQuarterAt > 0) {
            const ms = now - lastQuarterAt;
            if (ms > 40 && ms < 4000) clockBpm = Math.max(20, Math.min(300, 60000 / ms));
        }
        lastQuarterAt = now;
        emitCV({ kind: "trigger", gate: true, value: 1, clock: true, quarter: Math.floor(midiClockPulses / 24) - 1, bpm: clockBpm });
    }

    function process(bytes) {
        let i = 0;
        while (i < bytes.length) {
            let status = bytes[i] & 0xff;
            if (status >= 0xf8) { realtime(status); i++; continue; }
            if (status & 0x80) { runningStatus = status; i++; }
            else if (runningStatus !== null) status = runningStatus;
            else { i++; continue; }
            const command = status & 0xf0;
            const channel = status & 0x0f;
            const size = (command === 0xc0 || command === 0xd0) ? 1 :
                (command >= 0x80 && command <= 0xe0 ? 2 : 0);
            if (!size) { runningStatus = null; continue; }
            if (i + size > bytes.length) break;
            const d1 = bytes[i++] & 0x7f;
            const d2 = size === 2 ? bytes[i++] & 0x7f : 0;
            if (command === 0x90 && d2 > 0) noteOnNative(channel, d1, d2);
            else if (command === 0x80 || (command === 0x90 && d2 === 0)) release(channel, d1);
            else if (command === 0xb0) {
                if (d1 === 64) sustain(channel, d2 >= 64);
                else if (d1 === 120 || d1 === 123) panicChannel(channel);
                else emitCV({ kind: "control", control: d1, value: d2 / 127, raw: d2, channel });
            } else if (command === 0xe0) {
                const raw = (d2 << 7) | d1;
                emitCV({ kind: "pitch", value: (raw - 8192) / 8192, raw, channel });
            } else if (command === 0xd0) {
                emitCV({ kind: "pressure", value: d1 / 127, raw: d1, channel });
            } else if (command === 0xa0) {
                emitCV({ kind: "poly-pressure", value: d2 / 127, raw: d2, note: d1, channel });
            } else if (command === 0xc0) {
                emitCV({ kind: "program", value: d1, program: d1, channel });
            }
        }
    }

    function panicChannel(channel) {
        [...held.keys(), ...sustained].forEach(k => {
            const parts = k.split(":");
            if (+parts[0] !== channel) return;
            held.delete(k); sustained.delete(k);
            if (typeof noteOffByKey === "function") noteOffByKey("native-midi:" + k);
            else MS().RackAudioGraph?.noteOff?.(+parts[1]);
        });
        sustainByChannel[channel] = false;
        emitCV({ kind: "panic", channel, gate: false, value: 0 });
    }

    function panicAll() {
        for (let channel = 0; channel < 16; channel++) panicChannel(channel);
        document.querySelectorAll(".key.down").forEach(key => key.classList.remove("down"));
    }

    function installButton() {
        if (!window.AndroidMidi || document.getElementById("nativeMidiInput")) return;
        const controls = document.getElementById("connectionControls");
        if (!controls) return;
        const button = document.createElement("button");
        button.id = "nativeMidiInput";
        button.className = "btn";
        button.textContent = "USB-C / MIDI CV";
        button.addEventListener("click", () => {
            if (typeof ensureAudio === "function") ensureAudio();
            MS().RackAudioGraph?.resume?.();
            AndroidMidi.chooseInput();
        });
        controls.appendChild(button);
        const audio = document.createElement("button");
        audio.className = "btn";
        audio.textContent = "AUDIO OUT";
        audio.addEventListener("click", () => AndroidMidi.openAudioSettings());
        controls.appendChild(audio);
    }

    window.MultiSynthNativeMidi = {
        receive: process,
        receiveCV: emitCV,
        devicesChanged: function () {},
        permissionResult: function () {},
        status: function (text, connected) {
            const button = document.getElementById("nativeMidiInput");
            if (!button) return;
            button.textContent = connected ? "USB-C / MIDI CV ON" : "USB-C / MIDI CV";
            button.title = text;
            button.classList.toggle("active", !!connected);
        },
        panic: panicAll
    };

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", installButton);
    else installButton();
})();

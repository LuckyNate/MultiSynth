(function () {
    "use strict";

    const held = new Map();
    const sustained = new Set();
    const sustainByChannel = new Array(16).fill(false);
    let runningStatus = null;

    function key(channel, note) { return channel + ":" + note; }

    function noteOnNative(channel, note, velocity) {
        const id = "native-midi:" + key(channel, note);
        held.set(key(channel, note), id);
        sustained.delete(key(channel, note));
        if (typeof recordNoteIfNeeded === "function") recordNoteIfNeeded(note, velocity);
        if (typeof noteOn === "function") noteOn(note, velocity, null, id);
        if (typeof setVisibleKey === "function") setVisibleKey(note, true);
    }

    function release(channel, note) {
        const k = key(channel, note);
        const id = held.get(k) || "native-midi:" + k;
        held.delete(k);
        if (sustainByChannel[channel]) { sustained.add(k); return; }
        if (typeof noteOffByKey === "function") noteOffByKey(id);
        if (typeof refreshVisibleKey === "function") refreshVisibleKey(note);
    }

    function sustain(channel, down) {
        sustainByChannel[channel] = down;
        if (down) return;
        [...sustained].forEach(k => {
            const parts = k.split(":");
            if (+parts[0] !== channel) return;
            sustained.delete(k);
            if (held.has(k)) return;
            if (typeof noteOffByKey === "function") noteOffByKey("native-midi:" + k);
            if (typeof refreshVisibleKey === "function") refreshVisibleKey(+parts[1]);
        });
    }

    function process(bytes) {
        let i = 0;
        while (i < bytes.length) {
            let status = bytes[i];
            if (status >= 0xf8) { i++; continue; }
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
            else if (command === 0xb0 && d1 === 64) sustain(channel, d2 >= 64);
            else if (command === 0xb0 && (d1 === 120 || d1 === 123)) panicChannel(channel);
        }
    }

    function panicChannel(channel) {
        [...held.keys(), ...sustained].forEach(k => {
            const parts = k.split(":");
            if (+parts[0] !== channel) return;
            held.delete(k); sustained.delete(k);
            if (typeof noteOffByKey === "function") noteOffByKey("native-midi:" + k);
        });
        sustainByChannel[channel] = false;
    }

    function panicAll() {
        for (let channel = 0; channel < 16; channel++) panicChannel(channel);
        document.querySelectorAll(".key.down").forEach(key => key.classList.remove("down"));
    }

    function installButton() {
        if (!window.AndroidMidi || document.getElementById("nativeMidiInput")) return;
        const transport = document.getElementById("transport");
        if (!transport) return;
        const button = document.createElement("button");
        button.id = "nativeMidiInput";
        button.className = "btn";
        button.textContent = "MIDI INPUT";
        button.addEventListener("click", () => {
            if (typeof ensureAudio === "function") ensureAudio();
            AndroidMidi.chooseInput();
        });
        transport.appendChild(button);
        const audio = document.createElement("button");
        audio.className = "btn";
        audio.textContent = "AUDIO OUT";
        audio.addEventListener("click", () => AndroidMidi.openAudioSettings());
        transport.appendChild(audio);
    }

    window.QuadSynthNativeMidi = {
        receive: process,
        devicesChanged: function () {},
        permissionResult: function () {},
        status: function (text, connected) {
            const button = document.getElementById("nativeMidiInput");
            if (!button) return;
            button.textContent = connected ? "MIDI ON" : "MIDI INPUT";
            button.title = text;
            button.classList.toggle("active", !!connected);
        },
        panic: panicAll
    };

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", installButton);
    else installButton();
})();

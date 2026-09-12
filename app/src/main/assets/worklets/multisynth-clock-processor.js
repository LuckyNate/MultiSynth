"use strict";

class MultiSynthClockProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bpm = 120;
    this.running = true;
    this.substep = 0;
    this.generation = 1;
    this.leadSeconds = 0.25;
    this.nextTickFrame = currentFrame + Math.max(128, sampleRate * 0.03);
    this.port.onmessage = event => {
      const msg = event.data || {};
      if (msg.type === "bpm") {
        const next = Number(msg.bpm);
        if (Number.isFinite(next)) {
          this.bpm = Math.max(20, Math.min(300, next));
          this.generation++;
        }
      } else if (msg.type === "running") {
        this.running = msg.running !== false;
        if (this.running && msg.reset === true) {
          this.substep = 0;
          this.nextTickFrame = currentFrame + Math.max(128, sampleRate * 0.03);
          this.generation++;
        }
      } else if (msg.type === "lead") {
        const lead = Number(msg.seconds);
        if (Number.isFinite(lead)) this.leadSeconds = Math.max(0.05, Math.min(1, lead));
      }
    };
  }

  intervalFrames() {
    return sampleRate * (60 / this.bpm) / 4;
  }

  process(inputs, outputs) {
    const output = outputs[0];
    if (output) for (const channel of output) channel.fill(0);
    if (!this.running) return true;

    const leadFrames = sampleRate * this.leadSeconds;
    const horizon = currentFrame + leadFrames;
    while (this.nextTickFrame <= horizon) {
      const frame = this.nextTickFrame;
      const substep = this.substep;
      this.port.postMessage({
        type: "tick",
        frame,
        time: frame / sampleRate,
        substep,
        beat: Math.floor(substep / 4),
        bpm: this.bpm,
        generation: this.generation
      });
      this.substep++;
      this.nextTickFrame += this.intervalFrames();
    }
    return true;
  }
}

registerProcessor("multisynth-clock-processor", MultiSynthClockProcessor);

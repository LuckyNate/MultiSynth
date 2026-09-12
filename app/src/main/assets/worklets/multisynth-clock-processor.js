"use strict";

class MultiSynthClockProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.running = true;
    this.generation = 1;
    this.leadSeconds = 0.25;
    this.pulseFrames = Math.max(128, Math.round(sampleRate * 0.02));
    this.nextPulseFrame = currentFrame + this.pulseFrames;
    this.port.onmessage = event => {
      const msg = event.data || {};
      if (msg.type === "running") {
        this.running = msg.running !== false;
        if (this.running && msg.reset === true) {
          this.nextPulseFrame = currentFrame + this.pulseFrames;
          this.generation++;
        }
      } else if (msg.type === "lead") {
        const lead = Number(msg.seconds);
        if (Number.isFinite(lead)) this.leadSeconds = Math.max(0.05, Math.min(1, lead));
      }
    };
  }

  process(inputs, outputs) {
    const output = outputs[0];
    if (output) for (const channel of output) channel.fill(0);
    if (!this.running) return true;

    if (currentFrame >= this.nextPulseFrame) {
      const frame = currentFrame;
      const time = frame / sampleRate;
      this.port.postMessage({
        type: "tick",
        timebase: true,
        frame,
        time,
        horizon: time + this.leadSeconds,
        generation: this.generation
      });
      while (this.nextPulseFrame <= currentFrame) this.nextPulseFrame += this.pulseFrames;
    }
    return true;
  }
}

registerProcessor("multisynth-clock-processor", MultiSynthClockProcessor);

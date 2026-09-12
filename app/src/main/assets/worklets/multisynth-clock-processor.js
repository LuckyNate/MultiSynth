"use strict";

class MultiSynthClockProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.pulseFrames = Math.max(128, Math.round(sampleRate * 0.02));
    this.nextPulseFrame = currentFrame + this.pulseFrames;
    this.serial = 0;
  }

  process(inputs, outputs) {
    const output = outputs[0];
    if (output) for (const channel of output) channel.fill(0);

    if (currentFrame >= this.nextPulseFrame) {
      const frame = currentFrame;
      this.port.postMessage({
        type: "tick",
        timebase: true,
        frame,
        time: frame / sampleRate,
        serial: ++this.serial
      });
      while (this.nextPulseFrame <= currentFrame) this.nextPulseFrame += this.pulseFrames;
    }
    return true;
  }
}

registerProcessor("multisynth-clock-processor", MultiSynthClockProcessor);

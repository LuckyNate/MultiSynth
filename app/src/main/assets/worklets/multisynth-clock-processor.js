"use strict";

class MultiSynthClockProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.deliver = false;
    this.port.onmessage = event => {
      const msg = event.data || {};
      if (msg.type === "delivery") this.deliver = msg.active === true;
    };
  }

  process(inputs, outputs) {
    const output = outputs[0];
    if (output) for (const channel of output) channel.fill(0);
    if (this.deliver) {
      this.port.postMessage({
        type: "timebase",
        frame: currentFrame,
        time: currentFrame / sampleRate,
        sampleRate
      });
    }
    return true;
  }
}

registerProcessor("multisynth-clock-processor", MultiSynthClockProcessor);

"use strict";

class MultiSynthClockProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const output = outputs[0];
    if (output) for (const channel of output) channel.fill(0);
    this.port.postMessage({
      type: "timebase",
      frame: currentFrame,
      time: currentFrame / sampleRate,
      sampleRate
    });
    return true;
  }
}

registerProcessor("multisynth-clock-processor", MultiSynthClockProcessor);

"use strict";

class MultiSynthPureWaveProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name: "frequency", defaultValue: 440, minValue: 0, maxValue: 24000, automationRate: "a-rate" },
            { name: "shape", defaultValue: 50, minValue: 0, maxValue: 100, automationRate: "k-rate" },
            { name: "phase", defaultValue: 0, minValue: 0, maxValue: 1, automationRate: "k-rate" }
        ];
    }

    constructor(options) {
        super();
        this.waveType = options.processorOptions?.waveType || "razor";
        this.position = 0;
        this.active = true;
        this.port.onmessage = event => {
            if (event.data?.type === "stop") this.active = false;
        };
    }

    razor(position, peakPercent) {
        const peak = Math.max(0, Math.min(1, peakPercent / 100));
        if (peak <= 0) return 1 - 2 * position;
        if (peak >= 1) return -1 + 2 * position;
        return position < peak
            ? -1 + 2 * position / peak
            : 1 - 2 * (position - peak) / (1 - peak);
    }

    spine(position, acceleration) {
        const distance = position < .5 ? position * 2 : (1 - position) * 2;
        const drive = Math.max(0, Math.min(1, acceleration / 100));
        const exponent = 1 + Math.pow(drive, 1.35) * 7;
        return -1 + 2 * Math.pow(distance, exponent);
    }

    process(_inputs, outputs, parameters) {
        const output = outputs[0]?.[0];
        if (!output) return this.active;
        if (!this.active) {
            output.fill(0);
            return false;
        }

        const frequencies = parameters.frequency;
        const shape = parameters.shape[0];
        const phaseOffset = parameters.phase[0];

        for (let index = 0; index < output.length; index++) {
            let position = this.position + phaseOffset;
            position -= Math.floor(position);
            output[index] = this.waveType === "spine"
                ? this.spine(position, shape)
                : this.razor(position, shape);

            const frequency = frequencies.length > 1 ? frequencies[index] : frequencies[0];
            this.position += frequency / sampleRate;
            this.position -= Math.floor(this.position);
        }
        return true;
    }
}

registerProcessor("multisynth-pure-wave", MultiSynthPureWaveProcessor);

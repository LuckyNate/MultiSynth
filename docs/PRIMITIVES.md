# MultiSynth Absolute Primitive Catalog

This document defines the only things that may be called **primitives** in the restart architecture.

A primitive is one irreducible operation or one irreducible control surface. If something is meaningfully assembled from multiple primitives, it is a **module** or a composed part of a module, not another primitive.

This distinction is architectural. The Module Builder may place primitives directly. The Patch Graph may place finished modules only.

## Primitive test

A candidate is a primitive only if all of these are true:

- it performs one fundamental operation or presents one fundamental control;
- it does not contain a useful internal signal graph of smaller MultiSynth parts;
- it does not contain a bank, strip, ladder, sequence, envelope, instrument, processor chain, or other authored combination;
- duplicating it simply gives another instance of the same atomic operation/control;
- any richer behavior is created by wiring multiple primitives together in the Module Builder.

If there is doubt, classify it as a module until proven otherwise.

## Signal / DSP primitives

### Oscillator
One waveform generator. Frequency, detune and waveform/type are parameters of this one generator. A synth, oscillator bank, modulation ladder or voiced instrument is not an oscillator primitive.

### Constant source
One constant signal source. Used for fixed CV/control values and offsets.

### Gain
One scalar multiplication stage. It has one signal path and one gain parameter. A VCA with envelope behavior, mixer, level strip or master section is a module/composition built using gain primitives.

### Filter
One native filter operation. Filter type and its native parameters belong to the primitive. A filter bank, EQ, crossover or named filter instrument is a module.

### Delay
One delay line operation. Feedback, echo networks, tape loops and reverberant structures are modules built around delay and other primitives.

### Buffer source
One playback source for one audio buffer. A sampler, slicer, sequencer, looper or granular instrument is a module.

### Noise source
One noise generator. If implemented through a buffer source internally, it may still be exposed as one atomic source primitive, but it must not smuggle synthesis structure or controls beyond the noise source itself.

### Wave shaper
One transfer-function/nonlinear shaping operation. Distortion chains and larger processors are modules.

### Analyser
One signal-analysis tap. It exposes raw analysis data. An oscilloscope is not the analyser primitive; the displayed scope is a composition of an analyser plus a visual surface.

### Channel splitter
One routing operation that separates channels. It contains no mix logic or authored signal policy.

### Channel merger
One routing operation that combines channels into channel positions. It is not a musical mixer and has no authored level/mix behavior.

### Stereo pan
One pan operation.

### Dynamics compressor
One native dynamics-compression operation. A channel strip, limiter section, mastering chain or compressor instrument with additional processing is a module.

### Carrier input
One external audio boundary input for the module being built.

### Carrier output
One external audio boundary output for the module being built.

### CV input
One external control/CV boundary input for the module being built.

### CV output
One external control/CV boundary output for the module being built.

## Interface / hardware primitives

These are individual physical controls or display surfaces. Banks and compound performance surfaces are not primitives.

### Knob
One rotary scalar control. The canonical rendered form uses the successful hardware language from `main`: circular face, physical tick/indicator and integrated numeric value on the face.

### Dial
One rotary control whose interaction/range semantics differ enough from the normal bounded knob to justify a distinct atomic control. It is still one control, never a bank.

### Fader
One linear scalar control.

### Ribbon
One continuous one-dimensional touch control.

### Button
One discrete press control.

### Momentary switch
One two-state control whose active state exists only while held.

### Toggle switch
One persistent two-state control.

### Pad
One pressure/touch/trigger surface. A pad bank is a module/composition of pads.

### XY surface
One two-dimensional continuous touch surface exposing X and Y.

### Joystick
One two-axis physical control. Spring/return behavior may be part of the control's own interaction semantics.

### Touch surface
One raw touch surface that reports touch position/gesture data without imposing higher-level instrument behavior.

### Turntable / scrub surface
One continuous rotational/scrub interaction surface.

### LED
One indicator light with one state/value source.

### Text label
One non-interactive text element.

### Numeric/text readout
One value-display surface. It displays supplied state; it does not perform analysis or synthesize a larger display by itself.

### Screen / canvas
One generic drawable visual surface. The screen is primitive; an oscilloscope, spectrum display, envelope plot, waveform editor or sequencer display is a module/composition that draws onto it.

### Text input
One editable text field.

### Carrier jack
One visible physical Carrier connection point.

### CV jack
One visible physical CV connection point.

## Explicitly not primitives

The following are combinations and therefore **modules or authored module substructures**, even if an older branch called them primitives, prefabs or controls:

- ADSR/envelope generators;
- VCA-with-envelope behavior;
- mixers/summers with authored channel behavior;
- oscillator banks;
- oscillator strips;
- modulation ladders;
- filter banks;
- EQs;
- clocks/timers;
- dividers/multipliers;
- sequencers;
- step banks;
- selector/button banks;
- track banks;
- pad banks;
- knob banks;
- fader banks;
- LED rings;
- performance keyboards;
- drum grids;
- samplers;
- recorders;
- loopers;
- granular engines;
- scopes/oscilloscopes;
- envelope displays;
- channel strips;
- effect chains;
- synth voices;
- complete oscillators with authored face/control sets such as the historical `open-oscillator`, `square-oscillator` and `triangle-oscillator` module files;
- any prefab;
- any named product module.

Those things are built **from** primitives in the Module Builder.

## Alt salvage rule

The `alt` branch remains the donor for low-level primitive implementation ideas, especially its atomic control interaction work and low-level routing concepts. However, an item does not remain a primitive merely because `alt` labeled it one.

The restart applies the absolute primitive test above. Composite `alt` controls such as banks, selectors made from multiple buttons, envelope displays, sequencer controls and prefabs are not imported as primitives.

The useful part of `alt` is the low-level behavior underneath them: pointer capture, touch dragging, quantization, value/state APIs, individual control mechanics and low-level connection behavior.

## Composition rule

The Module Builder is where complexity begins.

Examples:

- four Gain primitives plus controls can become a mixer module;
- several Oscillator primitives plus Gain primitives can become QuadSynth;
- Button/Pad primitives plus timing/state logic can become Beat Red;
- four Knobs controlling timing segments plus Gain/Constant/control wiring can become an envelope module;
- Analyser + Screen can become an oscilloscope module;
- many individual keys/controls can become a performance-keyboard module;
- Delay + Gain + routing can become an echo module;
- Buffer Source + controls + state can become a sampler module.

No combination created this way is promoted back into the primitive catalog merely for convenience.

## Growth rule

The primitive catalog may grow only when a genuinely irreducible operation/control is missing. New combinations belong in the module catalog or as reusable authored modules, not in this file.

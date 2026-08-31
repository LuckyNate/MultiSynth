# MultiSynth Absolute Primitive Catalog

This document defines the only things that may be called **primitives** in the restart architecture, plus a small library of **authoring prefabs** built from those primitives.

A primitive is one irreducible operation or one irreducible control surface. If something is meaningfully assembled from multiple primitives, it is not another primitive.

A prefab is a reusable authored combination of primitives. In the Module Builder it is inserted for convenience, then expands into ordinary primitive graph content. A prefab is not a new runtime node type, is not a primitive, and never appears directly on the Patch Graph.

The Module Builder may place primitives directly and may insert prefabs that expand into primitives. The Patch Graph may place finished modules only.

## Primitive test

A candidate is a primitive only if all are true:

- it performs one fundamental operation or presents one fundamental control;
- it does not contain a useful internal graph of smaller MultiSynth parts;
- it is not a bank, strip, ladder, sequence, envelope, instrument, processor chain or authored combination;
- duplicating it gives another instance of the same atomic operation/control;
- richer behavior is made by wiring primitives in the Module Builder.

If there is doubt, classify it as a composition/prefab or module until proven otherwise.

## Signal / DSP primitives

### Oscillator
One periodic waveform generator. Its fundamental job is producing a repeating signal from frequency/phase/waveform parameters. Multiple oscillators, voices or modulation ladders are modules/compositions.

### Noise source
One stochastic signal generator producing noise. It is continuous random signal, not event/probability logic.

### Constant source
One constant-valued signal source. It provides offsets, fixed CV and values that can feed automatable parameters.

### Gain / multiply
One multiplication operation: output = input × gain. The gain may itself be driven by a signal/AudioParam. This is the atomic basis of level control, VCA behavior and signal-by-signal multiplication. An envelope-controlled VCA is a composition.

### Sum / add
One arithmetic summing operation. It adds incoming signal/control values. A musical mixer with channels, levels, pan or UI is a module; this primitive is only addition.

### Invert / negate
One arithmetic operation: output = -input. It exists so bipolar modulation and subtraction can be built explicitly; subtraction is addition plus inversion.

### Clamp
One bounded transfer operation that constrains a value to a specified minimum and maximum. It is not a compressor or limiter instrument.

### Comparator
One comparison operation producing a binary/control result according to a threshold relation. It is the atomic basis for threshold logic, gates and event construction.

### Edge detector
One state transition detector. It reports a rising edge, falling edge, or configured transition from an incoming control/gate signal. It does not itself constitute a clock or sequencer.

### Pulse source
One primitive timing source that produces a repeating pulse/phase signal from a rate/period. It is the atomic timing operation from which clocks, dividers and Father Time-style modules can be composed. A complete clock/timer with transport, divisions and UI is a composition/module.

### Trigger / impulse source
One single-event impulse generator. When fired, it emits one defined trigger/impulse. Repeating trigger behavior requires composition with timing/state primitives.

### Sample and hold
One stateful operation that captures an input value when triggered and holds that value until the next trigger. This is the atomic state cell for stepped/random/sequenced control construction.

### Random value source
One discrete random-value operation. On request/trigger it produces a random scalar according to its primitive range/distribution parameters. It is distinct from continuous audio noise and does not contain probability sequencing policy.

### Ramp / slew
One operation that moves an output toward a target over time rather than changing instantaneously. It is the atomic basis for portamento, fades, smoothing, attack/decay/release segments and other time-varying control transitions. A complete envelope is a prefab/composition.

### Filter — biquad
One automatable low-order biquad filter operation. Filter type and native cutoff/Q/gain/detune parameters belong to the primitive. Filter banks, EQs and crossovers are modules.

### IIR filter
One general infinite-impulse-response filtering operation defined by feedforward and feedback coefficients. Coefficients define the primitive instance; authored filter systems built from multiple stages are modules.

### Delay
One delay-line operation: an input signal is reproduced after a specified delay time. Feedback is not hidden inside it; feedback/echo structures are made by explicit graph wiring.

### Convolver
One linear-convolution operation using one impulse-response buffer. Reverbs, cabinets and spaces that add selection, wet/dry, predelay, EQ or other behavior are modules.

### Buffer source
One playback source for one already-available audio buffer. A sampler, slicer, granular engine, looper or sample browser is a module.

### Wave shaper
One transfer-function/nonlinear shaping operation mapping input amplitude through one curve. Distortion/effect chains are modules.

### Analyser
One signal-analysis tap exposing raw time/frequency-domain analysis data. An oscilloscope or spectrum display is a composition of analysis plus a visual surface.

### Channel splitter
One routing operation that separates channels into discrete outputs. It contains no musical mix policy.

### Channel merger
One routing operation that places discrete inputs into output channel positions. It is not a musical mixer.

### Stereo pan
One left/right stereo panning operation.

### Dynamics compressor
One native dynamics-compression operation. A channel strip, mastering chain or compressor device with additional processing is a module.

### Carrier input
One external audio boundary input of the module being authored. It declares where Patch Graph Carrier audio may enter the finished module.

### Carrier output
One external audio boundary output of the module being authored. It declares where Carrier audio leaves the finished module.

### CV input
One external control boundary input. It can carry the control semantics defined by the module contract, including continuous control or explicitly typed timing/event control.

### CV output
One external control boundary output.

## Control/event signal meanings

MultiSynth must not treat every non-audio value as an undifferentiated number. The Module Builder recognizes these semantic forms:

- **continuous CV** — a continuously varying scalar control signal;
- **gate** — a sustained binary/high-low control state;
- **trigger** — a momentary event/impulse representing one occurrence;
- **pulse/clock** — a repeating timing signal whose edges define periodic events;
- **held value** — a scalar retained by state such as Sample and Hold.

These are signal meanings, not automatically separate visual jacks. A module definition declares which semantics each CV boundary accepts/produces. Conversion is explicit when semantics differ.

## AudioParam / modulation contract

A primitive parameter is not merely a JavaScript property. Parameters that participate in DSP must declare their modulation behavior.

Each DSP parameter definition records:

- name and unit;
- default, minimum and maximum where meaningful;
- whether it accepts direct scalar assignment;
- whether it accepts a connected control/audio signal;
- whether it is **a-rate** (evaluated per sample frame) or **k-rate** (evaluated once per render quantum) when the implementation exposes that distinction;
- its automation/scheduling behavior.

Web Audio permits an AudioNode output to connect directly to an AudioParam. The compiler should use that native model where appropriate instead of inventing a disconnected fake CV system. Multiple modulation contributors are combined according to the parameter/graph contract rather than silently replacing one another.

UI controls bind to canonical module state/parameters; they do not own a second DSP value.

## Channel contract

Every audio-bearing primitive declares its channel behavior rather than relying accidentally on browser defaults.

The runtime/compiler tracks:

- input/output channel count where fixed or constrained;
- mono/stereo/multichannel capability;
- channel-count mode where applicable;
- channel interpretation: `speakers` for speaker-layout mixing semantics or `discrete` when channels are independent lanes;
- intentional up-mix/down-mix policy at module boundaries.

Splitter/merger operations use discrete channel semantics. Ordinary musical audio normally uses speaker semantics unless a module explicitly requires discrete lanes.

## Buffer/media ownership

A Buffer Source consumes an AudioBuffer; it does not locate, download, decode, record, name or persist that buffer.

Those responsibilities belong to module/application services and modules such as Sample Library, recorder/sampler modules and source modules. The architecture therefore distinguishes:

1. **audio-buffer data/resource** — persistent/referenced media owned outside the primitive graph;
2. **Buffer Source primitive** — one atomic playback operation consuming that resource.

Microphone/media-stream acquisition and external media acquisition are application/platform boundaries, not hidden behavior inside Buffer Source.

## Custom DSP implementation rule

**AudioWorklet is an implementation mechanism, not a primitive.**

A primitive may be backed by a native Web Audio node when one exists, or by a custom AudioWorkletProcessor when the required atomic operation is not available natively or requires custom sample-level DSP.

A worklet-backed primitive must obey exactly the same primitive contract: one irreducible job, explicit inputs/outputs, explicit parameters, deterministic state interface where applicable, and no hidden instrument/module graph.

This keeps the primitive model based on musical/DSP meaning rather than limiting it to the browser's current native node catalog.

## Interface / hardware primitives

These are individual physical controls or display surfaces. Banks and compound performance surfaces are not primitives.

### Knob
One rotary scalar control. Canonical rendering uses the successful `main` hardware language: circular face, physical tick/indicator and numeric value integrated on the face.

### Dial
One rotary control whose interaction/range semantics differ from the normal bounded knob, such as cyclic rotation. It remains one control.

### Fader
One linear scalar control.

### Ribbon
One continuous one-dimensional touch control.

### Button
One discrete press control producing one press action.

### Momentary switch
One two-state control active only while held.

### Toggle switch
One persistent two-state physical control.

### Pad
One individual touch/trigger surface. A pad bank is composition.

### XY surface
One two-dimensional continuous touch surface exposing X and Y.

### Joystick
One two-axis physical control. Spring/return behavior may be intrinsic interaction behavior.

### Touch surface
One raw touch surface reporting touch position/gesture data without imposing higher-level instrument behavior.

### Turntable / scrub surface
One continuous rotational/scrub interaction surface.

### LED
One indicator light driven by one state/value source.

### Text label
One non-interactive text element.

### Numeric/text readout
One supplied-value display surface. It performs no signal analysis.

### Screen / canvas
One generic drawable visual surface. Oscilloscopes, spectrum displays, waveform editors and sequencer displays are compositions that draw onto it.

### Text input
One editable text field.

### Carrier jack
One visible physical Carrier connection point.

### CV jack
One visible physical CV connection point. Its accepted semantic type is declared by the owning module/port definition.

# Basic Module Builder prefabs

Prefabs are convenience constructions only. Selecting one in the Module Builder expands it into its constituent primitives, connections, bindings and optional starter face layout. After expansion, the author may inspect, move, reconnect, delete or replace every constituent part.

A prefab never becomes a new primitive type and never survives compilation as an opaque hidden graph.

## ADSR envelope prefab

Purpose: generate a conventional attack-decay-sustain-release control envelope from gate/note state.

Typical constituents:

- CV/gate input;
- Edge Detector for gate transitions where required;
- Ramp/Slew stages for Attack, Decay and Release;
- Constant Source for Sustain level/reference values;
- Sample and Hold/state where required for stage state;
- Comparator/state logic as required to advance stages;
- CV output;
- four Knobs labeled Attack, Decay, Sustain and Release.

Meaning: gate-on begins Attack, then Decay falls to Sustain and holds while the gate remains active; gate-off begins Release. The prefab is editable primitive wiring, not a special envelope runtime.

## AR envelope prefab

Purpose: simple attack-release envelope.

Typical constituents: gate input, edge/state logic, Ramp/Slew for attack and release, CV output, Attack and Release knobs.

## VCA prefab

Purpose: voltage/control-driven amplitude stage.

Typical constituents: Carrier Input, Gain/Multiply, CV Input connected to gain parameter, Carrier Output, optional level Knob.

Meaning: incoming Carrier amplitude is multiplied by the supplied control value. It contains no envelope unless the author explicitly patches one in.

## LFO prefab

Purpose: low-frequency modulation source.

Typical constituents: Oscillator, optional Gain/Multiply for depth, optional Constant Source/Sum for offset, CV Output, Rate and Depth knobs, waveform selection UI where desired.

Meaning: it is simply a slow oscillator-based control source. Sync, division, phase-reset policy and elaborate modulation belong to richer authored modules unless explicitly added.

## Clock prefab

Purpose: basic periodic timing source.

Typical constituents: Pulse Source, Rate/Tempo Knob, Button or Toggle for run state where desired, CV Output typed as pulse/clock.

Meaning: produces periodic timing edges. Transport, tap tempo, divisions, swing and synchronization networks are not hidden in this basic prefab.

## Clock divider prefab

Purpose: emit one pulse after a selected number of incoming pulses.

Typical constituents: CV clock input, Edge Detector, primitive state/counter logic implemented from atomic state/custom atomic DSP as required, comparator/reset logic, CV trigger/pulse output, division control.

Meaning: the prefab expresses division explicitly; it is not an absolute primitive.

## Clock multiplier prefab

Purpose: derive faster periodic timing from an incoming clock by estimating period and generating intermediate pulses.

Typical constituents: CV clock input, Edge Detector, held timing state, Pulse/Trigger generation, rate math/state, CV output, multiplication control.

Meaning: because period estimation and generated events require several operations, this is a prefab/composition rather than a primitive.

## Simple mixer prefab

Purpose: combine several Carrier signals with independent levels.

Typical constituents for each channel: Carrier Input + Gain/Multiply + Fader/Knob. Channel outputs feed Sum/Add; Sum feeds Carrier Output. Stereo variants may additionally use Stereo Pan and left/right routing.

Meaning: the Sum primitive performs only arithmetic addition; the prefab supplies the recognizable mixer structure.

## Oscillator voice prefab

Purpose: quickly create the most basic playable oscillator signal path without defining a finished synth identity.

Typical constituents: Oscillator, Gain/Multiply, optional ADSR prefab expanded into primitives, Carrier Output, CV/note/gate inputs, pitch and level controls.

Meaning: this is starter authoring material, not a named synth module and not a primitive.

## Filter stage prefab

Purpose: basic patchable filter section.

Typical constituents: Carrier Input, Biquad Filter, Carrier Output, cutoff/Q controls and optional CV input bound to cutoff or other exposed parameters.

Meaning: one Filter primitive plus hardware/boundary wiring becomes a usable section.

## Delay feedback prefab

Purpose: elementary echo structure.

Typical constituents: Carrier Input, Delay, Gain/Multiply in an explicit feedback loop, Sum/Add for dry/wet combination if desired, Carrier Output, time/feedback/mix controls.

Meaning: feedback is visible graph wiring; it is never hidden inside the Delay primitive.

## Oscilloscope prefab

Purpose: visualize a signal waveform.

Typical constituents: Carrier or CV Input, Analyser, Screen/Canvas.

Meaning: the Analyser supplies data and the Screen renders it. Neither primitive alone is an oscilloscope.

## Spectrum display prefab

Purpose: visualize frequency-domain analysis.

Typical constituents: Carrier Input, Analyser configured for frequency data, Screen/Canvas.

## Performance keyboard prefab

Purpose: provide a reusable playable key surface inside authored instruments.

Typical constituents: individual touch/key hit regions built from Touch Surface/Pad/Button-class atomic controls as appropriate, note/gate state wiring, octave controls, optional velocity/expression Ribbon or Touch Surface controls, pitch control, CV/note/gate outputs/bindings.

Meaning: the keyboard is intentionally a reusable authoring prefab because it is a compound performance surface. It must expand to inspectable constituent controls/logic rather than becoming a hidden primitive.

The useful historical behavior to preserve when rebuilding this prefab includes multitouch, sliding between notes, velocity/expression strategy, pitch interaction and octave navigation.

## Pad grid prefab

Purpose: create a regular set of trigger pads quickly.

Typical constituents: repeated Pad primitives with explicit independent outputs/bindings and optional labels.

Meaning: a grid is layout convenience over individual pads, not a new atomic control.

## Step row prefab

Purpose: provide a reusable row of individually addressable step controls for sequencer modules.

Typical constituents: repeated Button/Toggle/Pad primitives, explicit step state, optional LED primitives for indication.

Meaning: timing/playhead/sequencing policy is not hidden in the row. The prefab only supplies editable step controls and their state bindings.

## Channel strip prefab

Purpose: provide a conventional single mixer-channel construction.

Typical constituents: Carrier Input, Gain/Multiply, optional Stereo Pan, level Fader, mute/solo controls if explicitly requested, Carrier Output or bus connection.

Meaning: a channel strip is a reusable composition. A complete mixer is assembled from channel strips plus explicit summing/output structure.

## Prefab rules

1. A prefab is stored as an authored graph fragment composed exclusively of registered absolute primitives and bindings.
2. Insertion creates real primitive instances with stable IDs in the current module definition.
3. The inserted result is immediately editable; there is no opaque prefab runtime wrapper.
4. The saved module may remember optional provenance such as `createdFromPrefab: "adsr"`, but runtime behavior never depends on the prefab still existing.
5. Updating a prefab definition does not silently mutate existing authored modules.
6. A prefab may contain another prefab only during authoring expansion; nested prefabs must be fully flattened to primitives before the module definition is saved/compiled.
7. Prefabs cannot be placed on the Patch Graph.
8. Named product modules are never demoted into prefabs merely for convenience.

## Explicitly not primitives

The following are combinations and therefore **prefabs, authored module substructures or complete modules**, even if an older branch called them primitives or controls:

- ADSR/envelope generators;
- VCA-with-envelope behavior;
- musical mixers/summers with authored channel behavior;
- oscillator banks/strips;
- modulation ladders;
- filter banks;
- EQs;
- clocks/timers with transport/divisions/UI;
- dividers/multipliers;
- sequencers;
- step banks;
- selector/button banks;
- track banks;
- pad/knob/fader banks;
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
- complete oscillators with authored face/control sets such as historical `open-oscillator`, `square-oscillator` and `triangle-oscillator` module files;
- any prefab;
- any named product module.

## Alt salvage rule

The `alt` branch is the donor for low-level primitive implementation ideas, especially atomic control interaction and low-level routing. An item does not remain a primitive merely because `alt` labeled it one.

Composite `alt` controls are not imported as primitives. What survives is low-level behavior such as pointer capture, touch dragging, quantization, value/state APIs, individual control mechanics and low-level connection behavior.

## Composition examples

- Oscillators + Gain + Sum can become an additive synth.
- Comparator + Edge Detector + Pulse Source + Sample and Hold can build timing/stepped-control behavior.
- Random Value Source + Trigger + Sample and Hold can build probability/random modules.
- ADSR prefab expands to Ramp/Slew, state, gate logic and controls.
- Analyser + Screen can become an oscilloscope prefab/module.
- Delay + Gain + explicit feedback routing can become an echo prefab/module.
- Convolver + Gain + controls can become an impulse-response reverb module.
- Buffer Source + controls + resource state can become a sampler module.

No combination is promoted back into the primitive catalog merely for convenience.

## Growth rule

The primitive catalog grows only when a genuinely irreducible operation/control is missing. Reusable combinations belong in the prefab section or as authored module structures; finished named instruments/effects belong in the module catalog.
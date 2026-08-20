# MultiSynth Module Standard

Core rule: **one feature, one implementation, one contract**.

A rack module should contain only the DSP/behavior that makes that module unique. Shared mechanics belong to framework services or dedicated rack modules and must not be reimplemented locally.

## Module identity: one source of truth

`app/src/main/assets/module-ids.js` is the only place that defines a module's symbolic identity, canonical runtime ID, human-facing display name, and stable theme key.

Each module has one catalog row, for example:

```js
THE_CHOPPER: entry("the-chopper", "The Chopper", "the-chopper")
```

The symbolic key (`THE_CHOPPER`) is what implementation code references. The catalog row owns the actual ID and display name. To rename a module and/or change its canonical ID, edit that catalog row once. Consumers must derive the new values through `ModuleIds`; they must not duplicate literal IDs or display names.

Rules:

- Module implementation files use `type: I.SYMBOLIC_KEY`, never a literal module ID string.
- `displayName` and `selectorClass` supplied by module-local definitions are compatibility-only inputs and are overwritten at the registration boundary from the identity catalog. New modules should omit them when possible.
- `module-manifest.js` derives identity from `ModuleIds`; it owns editor URL, category, color, capabilities, resources, and cascade semantics.
- Theme keys are stable presentation keys and are not implicitly changed when a canonical runtime ID changes.
- Rack persistence, state schemas, routing, selectors, editor dispatch, and audits reference `ModuleIds` constants rather than literal IDs.
- Device-page titles/headings use `module-identity-ui.js` or another catalog-backed binding; visible module identity must not depend on filenames or hard-coded headings.
- Filenames such as `the-chopper.html` are implementation assets, not module identity.
- `module-id-audit.js` and `module-standards-audit.js` must remain clean.

## Shared infrastructure

- `ModuleContract`: runtime lifecycle, audio I/O, CV I/O, standardized trigger dispatch, default serialization/restoration, analyser tap, automatic selector/theme hook.
- `ModuleIds`: authoritative symbolic key -> canonical ID/display name/theme identity catalog.
- `ModuleManifest`: centralized editor URL, category, color, capabilities, resources, and cascade behavior.
- `ModuleCapabilities`: strict routing participation flags.
- `StateSchema`: explicit per-module persistence schema versions keyed through `ModuleIds` constants.
- `RackStandard.capture`: AudioNode -> decoded mono Float32 PCM capture path.
- `CleanMic`: shared cleaned microphone source and capture path.
- `RackStandard.transport`: internal 16th-note scheduler plus external Father Time clock handoff.
- `RackStandard.sampler`: PCM buffer install/playback, pitch, start/end, L/R level, binaural lag, voice cleanup.
- `RackStandard.bindHold`: shared pointer-capture hold/release/cancel gesture.
- `RackStandard.paintScope`: shared oscilloscope renderer.
- `RackUI`: shared controls and step-grid primitives.
- `PCMLibrary`: permanent sampler-agnostic PCM storage referenced by stable sample IDs.
- `RackEngine.serialize/restore`: canonical rack-project persistence.

## Cascade-only routing model

MultiSynth does not expose patch ports. Routing is cascade-only. The rack hierarchy determines where signal, timing, CV, and control data flow. Modules declare how they behave inside that cascade rather than declaring arbitrary input/output sockets.

Every active manifest row exposes normalized `cascade` metadata:

- `audioRole`: `none`, `generator`, `processor`, `passthrough`, or `terminal`.
- `carrierBehavior`: `none`, `replace`, `add`, `transform`, `passthrough`, or `moduleSpecific`.
- `stereoBehavior`: `none`, `mono`, `stereoPreserve`, `monoToStereo`, or `moduleSpecific`.
- `timingRole`: `none`, `source`, `follower`, `sourceFollower`, `dividerConsumer`, or `moduleSpecific`.
- `cvBehavior`: `none`, `source`, `trigger`, `continuous`, `passthrough`, `triggerPassthrough`, `continuousPassthrough`, or `moduleSpecific`.
- `voiceMode`: structured metadata with `mode` (`none`, `mono`, `poly`, `moduleSpecific`), optional `maxVoices`, and voice-steal policy.
- `bypassBehavior`: `passthrough`, `silence`, or `moduleSpecific`.
- `latencySamples`: non-negative integer, default `0`.

The manifest supplies conservative defaults from existing capabilities so older modules remain backward-compatible. A module overrides only the cascade semantics that differ from those defaults. The standards audit validates all cascade metadata.

## Capabilities and routing

Capabilities answer **whether** a module participates in audio, notes, CV, clocks, DIV, mic, PCM, MIDI, or terminal output. Cascade metadata answers **how** that participation behaves in the rack.

Do not infer routing behavior from category names, display names, filenames, or the existence of a handler. If an implementation adds a handler, update its manifest capabilities and cascade semantics in the same coherent change.

## Audio

Processors with neutral controls must preserve incoming carrier according to their declared `carrierBehavior` and `bypassBehavior`. Generators may create audio where declared. The cascade remains the only routing topology.

Stereo behavior is explicit metadata so modules that collapse to mono, preserve stereo, or create stereo from mono can be identified without inspecting DSP code.

`latencySamples` exists now even when zero so future buffering, FFT, convolution, hardware, or lookahead modules can participate in branch-delay compensation without another metadata redesign.

## Timing and CV

Sequenced/time-stepped modules use the shared clock/transport contract. Father Time is the dedicated rack clock source. `timingRole` and `cvBehavior` describe source/follower/divider and CV behavior without introducing patch ports.

Random or physical-model timing intrinsic to a module remains inside that module's DSP.

## Voice behavior

Modules that accept notes declare voice behavior separately from note-input capability. This lets future synths state mono/poly operation, maximum voice count, and stealing policy without each synth inventing a private convention.

## Control descriptors and modulation

Standard controls continue to use `ControlDescriptors`. Descriptors now include modulation metadata:

- `modulatable`: whether the parameter may be driven externally.
- `bipolar`: whether modulation is centered around zero.
- `rate`: `control` or `audio`.

This metadata does not automatically modulate existing controls; it defines the common vocabulary so CV/automation can be added without redesigning each module's controls.

## UI and themes

New editors use shared UI primitives for standard controls. Every sound-producing module uses the standard analyser/scope path.

Every new module has a theme key in the identity catalog and visual metadata in the manifest. The theme key remains independent of canonical ID renames.

## New-module checklist

1. Add one identity catalog row in `module-ids.js`: symbolic key, canonical ID, display name, stable theme key.
2. Add one manifest row using `I.SYMBOLIC_KEY`: editor URL, category, color, capabilities, resources, and any cascade overrides.
3. Add an explicit state-schema version using the same `I.SYMBOLIC_KEY`.
4. Register module behavior with `type: I.SYMBOLIC_KEY`; do not introduce literal module IDs.
5. Bind visible editor/faceplate identity to the catalog rather than hard-coding the module name.
6. Define only unique DSP/behavior and state; use shared infrastructure for common mechanics.
7. Mark standard controls with modulation metadata when external modulation is supported or intended.
8. Verify identity audits, manifest audits, cascade metadata audit, rack serialization, editor dispatch, carrier behavior, clock/CV/DIV behavior, scope output, and touch behavior before considering the module complete.

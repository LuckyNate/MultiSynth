# MultiSynth Module Standard

Core rule: **one feature, one implementation, one contract**.

A rack module should contain only the DSP/behavior that makes that module unique. Shared mechanics belong to framework services or dedicated rack modules and must not be reimplemented locally.

## Shared infrastructure

- `ModuleContract`: runtime lifecycle, audio I/O, CV I/O, standardized trigger dispatch, default serialization/restoration, analyser tap, automatic selector/theme hook.
- `RackStandard.capture`: AudioNode -> MediaRecorder -> decoded mono Float32 PCM.
- `CleanMic`: one cleaned microphone source. `CleanMic.capture` is the only cleaned-mic-to-PCM recording path.
- `RackStandard.transport`: internal 16th-note scheduler plus automatic external Father Time clock handoff.
- `RackStandard.sampler`: PCM buffer install/playback, pitch, start/end, L/R level, binaural lag, voice cleanup.
- `RackStandard.bindHold`: one pointer-capture hold/release/cancel gesture.
- `RackStandard.paintScope`: one oscilloscope renderer for module, rack, and master scopes.
- `RackUI`: shared range, toggle, select, hold, and step-grid controls.
- `PCMLibrary`: permanent sampler-agnostic PCM storage referenced by stable IDs.
- `RackEngine.serialize/restore`: canonical rack-project persistence. Modules override persistence only for exceptional external references.

## Dedicated rack capabilities

- Father Time owns rack clock/CV generation.
- Been Served owns ADSR/envelope behavior.
- Garage Band owns general filtering/EQ.
- Master of Levels owns generic gain/drive/master staging.
- The Chopper owns capture/chop/library creation UI; it uses the shared capture services rather than implementing recording itself.

## CV

Every module has CV input/output and passes CV through by default. A `kind: "trigger"` packet is interpreted by `ModuleContract` and invokes a module's standardized `trigger()` capability. Modules should not parse trigger CV manually unless the CV transformation itself is part of their identity.

## Audio

Every module has carrier input/output. A processor with neutral controls must pass incoming carrier unchanged. Generators may create audio when no carrier is present; fed-carrier behavior must follow the module's declared processing identity.

## Timing

Sequenced/time-stepped modules use `RackStandard.transport`. Father Time automatically replaces internal scheduling downstream when active. Random or physical-model timing that is intrinsic to a sound (for example RanDrone's random event engine or a tape worklet's internal sample motion) remains inside that DSP.

## UI and themes

New editors use `RackUI`; do not hand-roll standard sliders, toggles, selectors, hold buttons, or 32-step grids. Every sound-producing module uses the standard analyser/scope path.

Every new module is themed at creation. `selectorClass` defaults to the module type and rack cards receive a hardware-style baseline automatically. A new module must also define its own visual identity in the editor/rack theme CSS: material, palette, typography/control language, and display treatment. A generic black panel is not considered finished.

## New-module checklist

1. Define only unique DSP/behavior and state.
2. Use existing capture, mic, transport, sampler, trigger, persistence, scope, and UI services.
3. Keep carrier and CV passthrough neutral by default where applicable.
4. Assign display name, category, color, selector/theme identity, and editor URL at creation.
5. Add no generic envelope/filter/master/timing/recording implementation if a standardized capability already exists.
6. Verify rack serialization/restoration, CV cascade, carrier cascade, scope output, and touch behavior before considering the module complete.

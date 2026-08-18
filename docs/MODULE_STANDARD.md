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
- `module-manifest.js` derives `id`, `displayName`, and `themeKey` from `ModuleIds`; it owns editor URL, category, color, capabilities, and resources.
- Theme keys are stable presentation keys and are not implicitly changed when a canonical runtime ID changes.
- Rack persistence, state schemas, routing, selectors, editor dispatch, and audits reference `ModuleIds` constants rather than literal IDs.
- Device-page titles/headings use `module-identity-ui.js` or another catalog-backed binding; visible module identity must not depend on filenames or hard-coded headings.
- Filenames such as `the-chopper.html` are implementation assets, not module identity. They may remain unchanged after a module rename or ID change.
- `module-id-audit.js` and `module-standards-audit.js` must remain clean. Any identity drift is a regression.

## Shared infrastructure

- `ModuleContract`: runtime lifecycle, audio I/O, CV I/O, standardized trigger dispatch, default serialization/restoration, analyser tap, automatic selector/theme hook.
- `ModuleIds`: authoritative symbolic key -> canonical ID/display name/theme identity catalog.
- `ModuleManifest`: centralized editor URL, category, color, capabilities, and resources, with identity derived from `ModuleIds`.
- `ModuleCapabilities`: strict routing participation flags.
- `StateSchema`: explicit per-module persistence schema versions keyed through `ModuleIds` constants.
- `RackStandard.capture`: AudioNode -> decoded mono Float32 PCM capture path.
- `CleanMic`: shared cleaned microphone source and capture path.
- `RackStandard.transport`: internal 16th-note scheduler plus external Father Time clock handoff.
- `RackStandard.sampler`: PCM buffer install/playback, pitch, start/end, L/R level, binaural lag, voice cleanup.
- `RackStandard.bindHold`: shared pointer-capture hold/release/cancel gesture.
- `RackStandard.paintScope`: shared oscilloscope renderer.
- `RackUI`: shared range, toggle, select, hold, and step-grid controls.
- `PCMLibrary`: permanent sampler-agnostic PCM storage referenced by stable sample IDs.
- `RackEngine.serialize/restore`: canonical rack-project persistence.

## Dedicated rack capabilities

- Father Time owns rack clock/CV generation.
- Been Served owns ADSR/envelope behavior.
- Garage Band owns general filtering/EQ.
- Master of Levels owns generic gain/drive/master staging.
- The Chopper owns capture/chop/library creation UI and uses shared capture services.

## Capabilities and routing

Routing is declarative and strict. A module participates in audio, notes, CV, clocks, DIV, mic, PCM, MIDI, or terminal output only when the corresponding centralized manifest capability is declared.

Do not infer routing behavior from category names, display names, filenames, or the existence of a handler. If an implementation adds a handler, update its manifest capabilities in the same coherent change. The standards audit rejects note/CV/clock handlers without the matching capability.

## Audio

Processors with neutral controls must preserve incoming carrier according to their declared behavior. Generators may create audio where their declared capabilities permit it. Do not bypass the shared rack routing boundary.

## Timing

Sequenced/time-stepped modules use the shared clock/transport contract. Father Time is the dedicated rack clock source. Random or physical-model timing intrinsic to a module remains inside that module's DSP.

## UI and themes

New editors use shared UI primitives for standard controls. Every sound-producing module uses the standard analyser/scope path.

Every new module has a theme key in the identity catalog and visual metadata in the manifest. The theme key is deliberately independent of canonical ID renames so changing an ID cannot silently break CSS selectors.

## New-module checklist

1. Add one identity catalog row in `module-ids.js`: symbolic key, canonical ID, display name, stable theme key.
2. Add one manifest row using `I.SYMBOLIC_KEY`: editor URL, category, color, capabilities, resources.
3. Add an explicit state-schema version using the same `I.SYMBOLIC_KEY`.
4. Register module behavior with `type: I.SYMBOLIC_KEY`; do not introduce literal module IDs.
5. Bind visible editor/faceplate identity to the catalog rather than hard-coding the module name.
6. Define only unique DSP/behavior and state; use shared infrastructure for common mechanics.
7. Verify identity audits, manifest audits, rack serialization, editor dispatch, routing, clock/CV/DIV behavior, scope output, and touch behavior before considering the module complete.

# MultiSynth

MultiSynth is an Android-hosted HTML5 modular audio workstation. A small plain-Java Android shell hosts the app in a WebView and provides native MIDI, USB/Bluetooth MIDI transport, microphone capture, file picking, and Android lifecycle/back-navigation integration. The instrument and rack interfaces live in `app/src/main/assets/`.

The current application entry point is the rack system. `index.html` is intentionally retained as a tiny compatibility launcher and redirects immediately to `rackbuilder.html`.

## Current architecture

### Android shell

`MainActivity` owns Android-specific services only:

- WebView hosting and local asset delivery
- USB/Bluetooth MIDI input and output
- MIDI device reconnection
- microphone capture and acoustic echo cancellation when available
- audio-file selection
- Android permission and lifecycle handling
- Android Back integration

The Android application namespace is `audio.multisynth.app` and the application is branded MultiSynth. Instrument names such as QuadSynth and Pulsynth remain instrument identities, not app-shell names.

### Rack application

`rackbuilder.html` is the main interface. The rack grid is a constrained spatial signal graph:

- modules inside one rack execute top-to-bottom
- side-by-side racks are parallel branches
- racks above are parents and racks below are children
- each rack can receive from up to three local parents and feed up to three local children
- sibling relationships are limited to the immediate horizontal neighbors
- terminal rack outputs are mixed into the unified output pool
- the rack keyboard plays the pool through the active rack graph

Routing is determined by rack position rather than patch cables. Do not introduce arbitrary cross-rack wiring as a cleanup shortcut; the neighborhood topology is part of the project design.

### Module contract

`module-contract.js` is the shared runtime contract for rack modules. Module definitions register themselves through `MultiSynth.ModuleContract` and may provide state, lifecycle, audio input/output, note, trigger, clock, CV, serialization, and editor behavior.

Shared rack helpers currently live alongside the contract as `MultiSynth.RackStandard`. They cover PCM capture, transport scheduling, sampler playback, hold-button interaction, and scope painting. They remain in the same file for compatibility with existing module/editor loading paths.

### Rack engine and UI

The rack implementation is intentionally split by responsibility:

- `rack-engine.js` — rack/project graph and module instance state
- `rack-audio-graph.js` — audio/CV/clock routing and pool output
- `rack-builder.js` — rack and cascade interaction helpers
- `rackbuilder-app.js` — application orchestration, persistence, module editor hosting, chooser, and rack keyboard integration
- `rack-grid-overview.js` — grid presentation and navigation
- `rack-keyboard.js` — rack keyboard behavior
- `rack-ui-controls.js` — direct rack/module UI behavior
- `rack-editor-scope.js` — embedded module scope support

Individual rack implementations live under `assets/modules/`. Standalone instrument/editor pages remain available because rack instances can embed them and because they are useful independently.

## Persistence

Rack projects use `multisynth.rack.project.v1` and serialize the complete rack graph plus module state. Rack-module editors synchronize their controls back into the corresponding rack runtime.

The Android shell also provides generic form persistence for standalone pages. The rack builder opts out of that generic layer because the rack serializer is the authoritative source for rack/module state. Existing storage keys are intentionally preserved for backward compatibility.

Do not rename or delete persistence keys merely as cleanup; doing so would discard saved user state.

## Audio and performance rules

MultiSynth requests interactive Web Audio latency, keeps important audio graphs warm where appropriate, and uses hardware-rendered WebView output. Bluetooth A2DP buffering is controlled by Android and the receiving device and cannot be eliminated entirely by the web audio graph.

Rack modules should preserve these project rules:

- incoming carrier audio remains usable unless the module is intentionally a generator-only source
- zero/neutral processing should not unexpectedly destroy the carrier
- CV/trigger/clock behavior must remain independent of audible audio unless the module explicitly generates sound
- oscilloscopes should represent the relevant post-process signal
- modules must clean up audio nodes, timers, microphone subscriptions, and other resources when destroyed
- state changes must remain serializable and restorable

## Standalone instruments and editors

The repository retains standalone HTML/CSS/JS interfaces for instruments and processors including QuadSynth, Pulsynth, SinLadder, Razorback, Stinger, PureSynth, No Quarter, samplers, loopers, processors, and editors. These files are not assumed dead merely because the rack builder is now the main entry point; rack definitions may use them as embedded editors.

The selector/list of rack modules is generated from registered module definitions rather than maintained as a separate hard-coded product list.

## Build

GitHub Actions builds the Android APK through **Build MultiSynth APK**. The uploaded debug artifact is named `MultiSynth-debug-apk`. Minimum Android version is Android 6.0 / API 23.

The project can also be opened in Android Studio.

## MIDI

MultiSynth supports native Android USB/Bluetooth MIDI. The app remembers the selected MIDI device and port and attempts to reconnect when Android exposes the same device again. Native handling includes note on/off, velocity, sustain, all-notes-off behavior, multi-channel note identity, and bidirectional MIDI transport used by rack clock/CV features.

## Cleanup policy

This repository has evolved rapidly, so cleanup should be conservative:

1. preserve every working module and editor unless it is proven unreachable
2. preserve storage keys and serialized schemas unless a migration exists
3. distinguish old app-shell names from valid instrument names before renaming anything
4. avoid combining cleanup with DSP, routing, clock, CV, sampler, or latency behavior changes
5. prefer small behavior-neutral refactors that can be validated independently

Historical-looking filenames may still be compatibility paths. Verify references and module registration before deleting or renaming them.

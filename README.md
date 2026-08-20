# MultiSynth

MultiSynth is an Android-hosted HTML5 modular audio workstation. A plain-Java Android shell hosts the WebView and provides native MIDI, USB/Bluetooth MIDI transport, microphone capture, file picking, and Android lifecycle/back-navigation integration. The instrument, rack, and node-graph interfaces live in `app/src/main/assets/`.

## Application structure

`index.html` is the main menu and exposes three current workspaces:

- **Test Modules** — instantiate and verify individual registered modules.
- **Build Racks** — assemble reusable top-to-bottom internal module chains.
- **Node Graph** — place modules and saved racks on a freeform plane and connect explicit OUT → IN ports.

The node graph is the authoritative external routing model. There is no parent/child rack hierarchy, neighborhood routing, cascade grid, or position-derived signal relationship.

## Android shell

`MainActivity` owns Android-specific services only:

- WebView hosting and local asset delivery
- USB/Bluetooth MIDI input and output
- MIDI device reconnection
- microphone capture and acoustic echo cancellation when available
- audio-file selection
- Android permission and lifecycle handling
- Android Back integration

The current Android application namespace is `audio.multisynth.app`.

## Module architecture

Every active module has one canonical identity in `module-ids.js`, metadata in `module-manifest.js`, an explicit state-schema declaration, and a runtime definition registered through `ModuleContract`.

Module Builder definitions are owned by the module implementation files under `assets/modules/`. `module-builder-definitions.js` is only the shared registry; it does not maintain duplicate module specifications.

Shared control surfaces, state keys, capabilities, events, and faceplate metadata are centralized. New modules should use the standard control descriptors and choose controls according to their actual job rather than reproducing module-specific UI infrastructure unnecessarily.

## Racks

A rack is a reusable unit containing an ordered module chain. Internal rack signal order is top-to-bottom. The rack itself exposes IN and OUT on the node graph and may be patched like any other node.

Rack names are stored through `RackLibrary`. The obsolete hierarchy abstraction is not part of the current architecture.

## Node graph

The node graph is a freeform workspace. Visual position does not imply routing. Connections exist only when an explicit node connection is stored.

Current project serialization uses:

- format: `multisynth-node-graph`
- version: `4`
- routing: `explicit-nodes`

Old spatial/grid project formats are not automatically interpreted by the development build.

## Persistence and compatibility

Current development persistence uses `multisynth.rack.project.v1` for the node/rack project container and `multisynth.racks.v1` for rack names.

The generic module compatibility registry remains available for future released-version migrations. Compatibility migrations must be explicit and intentionally enabled; development startup does not automatically repair or reinterpret obsolete project formats.

Once external users depend on persisted data, migrations should be added deliberately and tested on an experimental branch before release.

## Audio and performance rules

Modules should preserve these project rules:

- incoming carrier audio remains usable unless the module is intentionally generator-only
- neutral processing should not unexpectedly destroy the carrier
- CV, DV, trigger, and clock behavior remain independent of audible audio unless explicitly designed otherwise
- oscilloscopes represent the relevant post-process signal
- modules clean up audio nodes, timers, microphone subscriptions, and other resources when destroyed
- state changes remain serializable and restorable
- modules using the universal performance keyboard inherit its shared keyboard behavior and velocity control

## Module loading

`module-loader.js` loads the canonical catalog from `module-ids.js`. Module scripts are authoritative for their Module Builder definitions and runtime behavior. A module should not have a second parallel implementation or duplicate specification elsewhere.

## Build

GitHub Actions builds the Android APK. Minimum Android version is Android 6.0 / API 23.

## Cleanup policy

The forward architecture is intentionally strict:

1. one canonical identity per active module
2. one authoritative runtime/Module Builder definition per module
3. explicit node connections for external routing
4. ordered chains only inside racks
5. no cascade/grid/hierarchy routing aliases
6. no automatic interpretation of obsolete development save formats
7. retain generic migration infrastructure for future public releases, but enable migrations explicitly
8. remove obsolete aliases rather than allowing them to become permanent architecture

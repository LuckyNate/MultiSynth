# MultiSynth To-Do

This is the canonical project to-do list. Read this file before answering questions about outstanding work. Update it when work is added, completed, deferred, or removed.

## Change-control rule

- Before deleting, renaming, replacing, or broadly refactoring files, present the exact proposed file/change list to the user first and wait for explicit approval.
- Do not infer that a file is unused from a shallow reference search. Verify runtime loading, HTML/script inclusion, DOM/event entry points, manifest/editor mapping, Android/native dependencies, persistence/navigation roles, and indirect framework use.
- For requested implementation work, make only the approved scope of changes. Do not add cleanup or adjacent rewrites unless explicitly approved.

## Active

### TOP PRIORITY — MAKE MODULE BUILDER AUTHORITATIVE

- [ ] A Module Builder module declares components, state binding, layout/group metadata, and theme only; module editors must not reimplement shared component behavior.
- [ ] Every declared supported Module Builder component renders through one shared renderer/component library. No per-module control whitelists, negative gates, silent skips, or duplicated component implementations.
- [ ] Shared-component change = every module using that component changes automatically. Individual modules must not require repair after a shared ADSR, keyboard, scope, knob, selector, or other component change.
- [ ] The shared Module Builder performance keyboard honors `meta.pinned:"bottom"` and stays pinned at the bottom everywhere it is declared.
- [ ] Remove the No Quarter knob/dial-only filter and route No Quarter controls through the same Module Builder renderer as the other source instruments.
- [ ] Keep the existing ADSR DSP/state contract; render its existing UI through the shared Module Builder/RackUI ADSR component only. No second envelope system.
- [ ] Remove the private `renderAdsr()` implementation from `rack-instrument-editor.js`.
- [ ] Stop filtering keyboard/scope out merely to remount them through parallel module-specific paths; placement is renderer/layout metadata.
- [ ] Remove module-name branches from the shared source-instrument editor. Unique grouping belongs in Module Builder metadata, not renderer code.
- [ ] Collapse `rack-module-editor.js` away from hard-coded module exclusion/whitelist branching where Module Builder definitions can positively declare their editor/components.
- [ ] Unknown/unsupported declared Module Builder components must fail visibly/audit loudly; never silently `continue` or disappear.

### TOP PRIORITY — SYNTHESIS CORE CLEANUP

Governing rules for all sound-engine work:

- One DSP owner per module. No redefine/wrap/redefine chains.
- Shared engine handles only routing, graph lifetime, and generic event delivery.
- Each instrument owns its actual synthesis physics and note behavior.
- No silent shims. If something is wrong, fix the source rule instead of adding another layer.
- Fundamental audio sources live at the bottom in `dsp-source-family.js`. Source-family modules must not call oscillator, buffer-source, constant-source, or live-noise constructors directly; they request the primitive source and immediately configure/connect it to their carrier or module DSP.
- Module Builder definitions must mirror the real DSP hierarchy. Their `sources`, `actions`, and `nodes.connections` describe the same `DspSources` primitives and direct carrier/module-DSP connections used at runtime.
- Module Builder is the canonical control/UI definition path. Do not maintain parallel hard-coded editor control banks for Module Builder modules.

- [x] Establish one ModuleContract/DSP owner per synth. For the current synth family, `modules/carrier-synth-modules.js` is the temporary single runtime owner while cleanup is in progress.
- [x] Fold PureSynth noise-wave behavior (white/pink/red/blue) into the owning PureSynth DSP path instead of redefining the runtime from `modules/puresynth.js`.
- [x] Remove runtime `C.define(...)` redefinitions from individual synth files; individual synth files own Module Builder/control/model definitions only unless that module itself is the sole DSP owner.
- [x] Remove `modules/synth-gain-cleanup.js` after confirming no unique required behavior is lost. Its stripping of legitimate `level`/`carrier` state was not preserved.
- [x] Remove every loader/HTML reference to `modules/synth-gain-cleanup.js`, then delete the file.
- [x] Preserve duplicate rejection in both Module Builder and ModuleContract registries so duplicate UI specs and duplicate runtime/DSP definitions fail loudly.
- [x] Add `dsp-source-family.js` as the lowest shared source layer and route the current synthetic-source family through it: carrier synth family (PureSynth, QuadSynth, Pulsynth, SinLadder, Razorback, Stinger, No Quarter), Lowrider, RanDrone, Unstable Diffusion, and Beat Red.
- [x] Align the Module Builder definitions for the current source family with `DspSources`, including explicit bottom-layer source metadata and source-to-action graph connections.
- [x] Use the generic Module Builder-backed rack instrument editor for PureSynth and QuadSynth; no separate hard-coded PureSynth/QuadSynth control path remains.
- [ ] Sweep every remaining generator/procedural-audio module for direct Web Audio source construction and move any true fundamental source constructors to `DspSources` before declaring the source-family migration complete.
- [ ] Smoke-test PureSynth, QuadSynth, Pulsynth, SinLadder, Razorback, Stinger, and No Quarter immediately after ownership/source cleanup. Preserve current sound and controls; do not change DSP equations as part of ownership cleanup.
- [ ] Audit shared voice lifecycle in the true DSP owner: remove arbitrary timed hard-stop behavior and make note termination signal-correct/click-safe, starting with next-zero-crossing termination where appropriate.
- [ ] Audit No Quarter note-off specifically as Rhodes damping behavior after the universal click-safe voice-stop rule is correct. Do not add fake ADSR release behavior.
- [ ] Audit `preserveFedCarrier()` in `rack-audio-graph.js`; determine whether it still has a legitimate target after synth ownership cleanup or is stale compensation for an older voice model.
- [ ] Audit per-module safety compressor plus rack/master limiter stacking; keep only protection that does not unintentionally alter module sound.
- [ ] Audit branch/output gain splitting separately from carrier behavior; routing gain must remain a graph concern and must not mutate module voice state.
- [ ] Continue sound-engine KISS audit from the cleaned core: routing connects, modules synthesize/process, note/CV/DV events control; graph code must not reach into module DSP internals to repair behavior.

- [ ] Populate the current active work list together from the actual project state.
- [ ] Node Graph connector overhaul: render module IN/OUT connectors directly on the module face as convincing 3.5 mm audio jacks. Make patching easy to grab and connect. Draw connections like physical patch cables, with a cable body and a slightly darker circular plug/end-cap at each endpoint to give the impression of a cable plugged into the jack.

## Backlog

- [ ] Snap Crackle Pop: rack-native procedural transient/noise synthesis module based on the No Quarter crackle system, but with deeper sound-generation controls and more independently controllable event families. Use Module Builder controls only.
- [ ] AM/FM Processor: basic combined AM/FM rack processor with independent AM and FM ON/OFF toggles and LEVEL controls. Automatically mix enabled modulation paths into the final waveform. Support ADSR-triggered modulation shaping. Use Module Builder controls only.

## Done

- [x] Created a repository-owned canonical to-do list.
- [x] Consolidated project tasks into `docs/MULTISYNTH_TODO.md`.

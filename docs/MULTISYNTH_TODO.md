# MultiSynth To-Do

This is the canonical project to-do list. Read this file before answering questions about outstanding work. Update it when work is added, completed, deferred, or removed.

Read `docs/ARCHITECTURE_RULES.md` before making architectural, UI-library, Module Builder, rack, or shared-control changes. Those rules govern implementation decisions for this list.

## Change-control rule

- Before deleting, renaming, replacing, or broadly refactoring files, present the exact proposed file/change list to the user first and wait for explicit approval.
- Do not infer that a file is unused from a shallow reference search. Verify runtime loading, HTML/script inclusion, DOM/event entry points, manifest/editor mapping, Android/native dependencies, persistence/navigation roles, and indirect framework use.
- For requested implementation work, make only the approved scope of changes. Do not add cleanup or adjacent rewrites unless explicitly approved.

## Global UI rules

- MultiSynth uses one vertical module layout only. There is no separate landscape arrangement.
- Device rotation is allowed. When rotated sideways, the same vertical layout expands to the available width and remains vertically scrollable; controls must not reorganize into a different landscape-specific composition.
- Shared scope prefab is pinned at the top. Shared performance keyboard prefab is pinned at the bottom when declared with `meta.pinned:"bottom"`.
- Module selector surfaces use full-width rack-strip presentation rather than card grids.
- Rack/module selector faces show only module NAME + FAMILY. Tags remain functional metadata for filtering/search rather than visible faceplate clutter.

## Module taxonomy rules

- Every module has exactly one creator-owned FAMILY. Family is not a user-editable preference.
- Family must be explicitly assigned by the creator in Module Builder / authoring metadata. Do not infer family from category.
- Missing family metadata resolves visibly to `NULL FAMILY` with canonical primary tag `#nullfamily`.
- The canonical primary tag is derived from FAMILY and cannot drift from it, e.g. `SIGNAL SOURCE` → `#signalsource`, `TIMED INSTRUMENT` → `#timedinstrument`.
- Additional `#tags` describe searchable traits such as `#mic`, `#keyboard`, `#sine`, `#pcm`, etc. Test Module authoring may add/remove these extra tags.
- Module Test, Rack Builder Add Module, and Node Graph insert/browser selectors consume the same shared taxonomy and selector UI.
- Node-grid module thumbnails use the same minimal NAME + FAMILY faceplate convention.

## Active

### TOP PRIORITY — SHARED CONTROL/PREFAB OWNERSHIP — DO NOT DEPRIORITIZE UNTIL CLEAN

- [ ] Complete the repo-wide ownership audit across every module, editor, rack surface, library control and prefab. A shared component has exactly one geometry/behavior owner; consumers may configure/theme it but may not reimplement or reposition it.
- [x] Universal performance keyboard owns its viewport pinning and reserved bottom space in `control-performance-keyboard.css`; module/editor styles no longer own keyboard placement or bottom spacing.
- [x] Remove the obsolete rack-specific keyboard implementation from `rackbuilder-app.js` and the obsolete `.rackKeyboard` / `.keyboardKeys` / `.key` stylesheet from `rackbuilder.css`.
- [x] Keep `scripts/audit-shared-control-ownership.mjs` as a manual development diagnostic for locating shared-control ownership violations.
- [x] Do not gate APK production on the ownership audit while architectural cleanup is in progress.
- [ ] Continue removing any remaining competing shared-control geometry discovered by the ownership audit until it passes cleanly for the complete asset tree.
- [ ] Mark this priority complete only after the ownership audit is clean and the resulting APK has been smoke-tested; the audit remains diagnostic rather than an APK build gate.

### TOP PRIORITY — MAKE MODULE BUILDER AUTHORITATIVE

- [ ] A Module Builder module declares components, state binding, layout/group metadata, theme, family, and tags only; module editors must not reimplement shared component behavior.
- [ ] Every declared supported Module Builder component renders through one shared renderer/component library. No per-module control whitelists, negative gates, silent skips, or duplicated component implementations.
- [ ] Shared-component change = every module using that component changes automatically. Individual modules must not require repair after a shared ADSR, keyboard, scope, knob, selector, or other component change.
- [x] Source-instrument family now renders declared controls through shared `RackUI.renderControl()` rather than per-instrument control implementations.
- [x] Shared Module Builder performance keyboard honors `meta.pinned:"bottom"`, loads from the shared editor when declared, and stays pinned at the bottom.
- [x] Shared scope prefab pins at the top.
- [x] Introduce `rack-ui-prefabs.js` as the reusable compound-control layer; keep atomic controls in `rack-ui-primitives.js`.
- [x] ADSR, performance keyboard host/pinning, and scope host are shared prefabs rather than module-specific composites.
- [x] Remove the No Quarter knob/dial-only filter from its execution path by routing No Quarter through the same shared Module Builder instrument renderer.
- [x] Keep the existing ADSR DSP/state contract and render its existing UI through the shared Module Builder/RackUI ADSR component only. No second envelope system.
- [x] Remove the private `renderAdsr()` implementation from `rack-instrument-editor.js`.
- [x] Source instrument keyboard/scope declarations are no longer filtered out and reimplemented by module-specific code; placement follows declaration metadata/shared rendering.
- [x] Remove module-name branches from the shared source-instrument editor. No Quarter grouping is declared in its Module Builder metadata.
- [x] `rack-module-editor.js` now positively uses the shared Module Builder renderer whenever a definition exists.
- [x] Every currently registered module has a Module Builder definition.
- [x] Shared renderer/library implements every currently declared Module Builder control type.
- [x] Shared source-instrument rendering fails visibly on unknown/unsupported declared components instead of silently skipping them.
- [x] Add shared module taxonomy layer with creator FAMILY, primary family hashtag, automatic capability/resource/control tags, and user-added auxiliary tags.
- [x] Missing creator family is deliberately exposed as `NULL FAMILY` / `#nullfamily` instead of inferred from category.
- [x] Add shared rack-strip selector UI with family and `#tag` filtering.
- [x] Apply shared selector/taxonomy behavior to Module Test, Rack Builder Add Module, and Node Graph module insert/browser surfaces.
- [x] Simplify shared module faceplate/node thumbnail presentation to NAME + FAMILY.

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
- [x] Sweep remaining generator/procedural-audio modules for direct fundamental Web Audio source construction. Time Bandits uses `DspSources.bufferSource()` for playback; its `createBuffer()` calls allocate PCM/drum data only. Father Time creates no fundamental audio source. No additional migration target was found.
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

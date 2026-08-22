# MultiSynth To-Do

This file is the canonical project to-do list. Read this file before answering questions about outstanding work. Update it when work is added, completed, deferred, or removed.

## Active

### TOP PRIORITY — SYNTHESIS CORE CLEANUP

- [ ] Establish one ModuleContract/DSP owner per synth. For the current synth family, keep `modules/carrier-synth-modules.js` as the temporary single runtime owner while cleanup is in progress.
- [ ] Fold PureSynth noise-wave behavior (white/pink/red/blue) into the owning PureSynth DSP path instead of redefining the runtime from `modules/puresynth.js`.
- [ ] Remove runtime `C.define(...)` redefinitions from individual synth files; individual synth files should own Module Builder/control/model definitions only unless that module itself is the sole DSP owner.
- [ ] Remove `modules/synth-gain-cleanup.js` after confirming no unique required behavior is lost. Do not preserve its stripping of legitimate `level`/`carrier` state.
- [ ] Remove every loader/HTML reference to `modules/synth-gain-cleanup.js`, then delete the file.
- [ ] Preserve duplicate rejection in both Module Builder and ModuleContract registries so duplicate UI specs and duplicate runtime/DSP definitions fail loudly.
- [ ] Smoke-test PureSynth, QuadSynth, Pulsynth, SinLadder, Razorback, Stinger, and No Quarter immediately after ownership cleanup. Preserve current sound and controls; do not change DSP equations as part of ownership cleanup.
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

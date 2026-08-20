# MultiSynth Running Progress Report

This file records current implementation status against `docs/MULTISYNTH_SPEC.md`.

Status labels:

- **SPECIFIED** — intended behavior is defined.
- **IMPLEMENTED** — code exists for the intended behavior.
- **VERIFIED** — behavior has been exercised successfully.
- **BROKEN** — known not to work as intended.
- **PARTIAL** — some required behavior exists, but the specification is not fully met.
- **LOCKED** — stable; do not alter unless fixing an observed malfunction.

## Architecture

- Explicit freeform Node Graph external routing — **IMPLEMENTED**.
- Saved racks as reusable compound nodes with ordered internal chains — **IMPLEMENTED**.
- Spatial/cascade routing as current architecture — **REMOVED / NOT CURRENT**.
- Canonical architecture documentation — **UPDATED** to explicit node graph.
- Android Back from a loose-module editor on Node Graph returns to Node Graph — **IMPLEMENTED**, device verification pending.
- Android Back from an embedded rack editor on Node Graph returns to Node Graph — **IMPLEMENTED**, device verification pending.
- Rack Builder module editor Android-back interception — **IMPLEMENTED**.
- Module Tester Android-back interception — **IMPLEMENTED**.
- Saved Racks render with Node Graph rack faceplates in touchable rows — **IMPLEMENTED**.
- Rack player-facing identity is **Name**; immutable engine rack ID remains separate and owns routing/persistence references — **IMPLEMENTED**.
- Rack Name appears in selectors and above rack faceplates; unnamed racks display their engine ID as Name — **IMPLEMENTED**, UI/device verification pending.

## Timing and control

- Father Time as top-level timer/CV authority — **SPECIFIED**; downstream propagation requires focused verification.
- CV as persistent downstream parent timing/control signal — **SPECIFIED**; verify runtime propagation end-to-end.
- DV as temporary child CV that does not modify parent CV and does not persist graph-wide — **SPECIFIED**; runtime behavior requires focused verification.
- Time Bandits upstream-clock following with internal fallback clock — **IMPLEMENTED** in runtime.
- Time Bandits probability drum hit behavior — **IMPLEMENTED** in runtime.
- Time Bandits DV emission — **IMPLEMENTED** in runtime.
- Stale `onDiv` compatibility alias in Time Bandits — **REMOVED**.

## Module metadata alignment

- Time Bandits category changed from clock-first to rhythm — **IMPLEMENTED**.
- Unstable Diffusion manifest declares audio input and processor/fallback-generator intent — **IMPLEMENTED metadata only**.
- Remaining manifest/runtime capability audit against canonical module jobs — **TODO**.

## Module Test catalog repairs

- Time Bandits runtime registration failure caused by missing Module Builder definition after the authoritative-definition refactor — **REPAIRED**, device verification pending.
- RanDrone runtime registration failure caused by the same missing Module Builder definition — **REPAIRED**, device verification pending.
- Echo Canyon runtime registration failure caused by a JavaScript brace/parse error in `modules/echo-canyon.js` — **REPAIRED**, device verification pending.
- Unstable Diffusion `FACEPLATE NOT FOUND` caused by missing `unstable-diffusion.html` — **REPAIRED** with an immediate touch-dial faceplate, device verification pending.

## Known module status

### LOCKED / stable

- No Quarter — **LOCKED**; reported working. Do not touch unless malfunction is observed.
- QuadSynth — **LOCKED**; reported working. Do not touch unless malfunction is observed.

### Broken / incomplete

- Big Mouth — **BROKEN/PARTIAL**. Mic input was reportedly repaired, but speech recording still failed in last test; reverse-vocoder behavior is therefore unverified.
- Unstable Diffusion — **PARTIAL**. Faceplate now exists, but runtime still does not yet implement the specified primary behavior of resolving live upstream audio with white-noise fallback.

### Recently repaired / verify on device

- Tapeworm loop time and playback speed were incorrectly independent — **REPAIRED**. They are now one coupled tape-motion parameter with `lengthSeconds = 2 / speed`; 0.1× = 20.0 s, 1× = 2.0 s, and 10× = 0.2 s. Both controls update each other immediately. The worklet no longer runs an independent read-head speed. Device/audio verification pending.

### Requires targeted verification

- Father Time downstream timer/CV authority through loose modules and rack nodes.
- DV locality/non-persistence and preservation of parent CV downstream.
- Control Freak node-input configuration of keyboard/knobs/dials/shared controls.
- Whitman Sampler microphone capture, synth-input capture, sample-library access, sequencing, and persistence.
- The Chopper automatic sound detection, chopping, keep-selection, and save-to-library path.
- Sample Surgery save/delete/library mutation behavior.
- Sample Library sorting/handling behavior.
- Time Bandits stacked-rack probability drum-machine behavior.
- RanDrone single random event per CV/DV click.
- Hookworm granular echo-loop behavior.
- Tapeworm tape-loop echo behavior after coupled-speed repair.
- Tail Gator Bluetooth blocking vs Tailgate Mode behavior.
- Android Back behavior on physical device for Node Graph module editor and embedded rack editor.
- Saved Racks row faceplates and Rack Name editing on physical device.
- Module Test audit cards for Time Bandits, Echo Canyon, RanDrone, and Unstable Diffusion after the repair pass.

## Documentation and maintenance

- `docs/MULTISYNTH_SPEC.md` — **CREATED** as canonical running spec.
- `docs/MULTISYNTH_PROGRESS.md` — **CREATED** as running implementation report.
- `docs/MULTISYNTH_TODO.md` — **CREATED** for actionable alignment work.
- `docs/RACK_ARCHITECTURE.md` — **UPDATED** to remove obsolete spatial routing contract.

## Current next actions

1. Verify Tapeworm coupled loop-time/tape-speed behavior on device.
2. Verify the four repaired Module Test catalog cards on device.
3. Trace the actual DV routing/bus implementation and verify it matches temporary child-CV semantics.
4. Trace Father Time propagation through node edges and rack-contained modules.
5. Implement Unstable Diffusion live upstream-audio analysis/resynthesis with white-noise fallback.
6. Repair Big Mouth recording path and validate reverse-vocoder behavior.
7. Audit remaining manifest capabilities/categories against the canonical module jobs.
8. Run module-by-module regression verification without touching LOCKED modules unless a fault is observed.

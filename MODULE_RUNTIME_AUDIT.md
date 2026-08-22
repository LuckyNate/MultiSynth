# MultiSynth Module Runtime Audit

Audit basis: canonical `ModuleIds`/`ModuleManifest`, Module Builder definitions, module runtime registration files under `assets/modules`, editor faceplates, and the existing `module-test` runtime checks.

This file is intentionally a development audit, not a release filter. All canonical modules stay visible until beta.

## CANONICAL MODULES

The canonical catalog contains 30 modules. Every canonical module must now resolve through `ModuleBuilderDefinitions`; `module-standards-audit.js` treats a missing Module Builder definition as an error.

Existing module faceplates, themes, and module-specific visual identities are preserved during conversion. Module Builder owns the architecture/definition contract; conversion is not permission to flatten modules into a generic visual template.

## RUNS

These modules have a canonical manifest entry, a runtime registration path, and no currently known user-reported repair blocker in the active repair pass.

- Live Wire
- Beat Red
- Father Time
- Whitman Sampler
- Time Bandits
- The Chopper
- Sample Surgery
- Sample Library
- Big Deal
- Big Mouth
- Been Served
- Garage Band
- Master of Levels
- Denzel's Equalizer
- Echo Canyon
- Lowrider LFO
- Unstable Diffusion
- PureSynth
- QuadSynth
- Pulsynth
- SinLadder
- Razorback
- Stinger
- No Quarter
- RanDrone
- Tapeworm
- Tail Gator

## RUNS — UI / BEHAVIOR REPAIR

Runtime exists and the module is not to be removed or hidden. These remain scheduled for deeper discussion/repair rather than being treated as missing modules.

- Control Freak — runtime exists; universal keyboard/control architecture remains deferred for deeper discussion.
- Grain Liqour — runtime exists; grain-as-waveform-source behavior remains a focused repair/design target.
- Hookworm — runtime exists and basic operation was confirmed; control semantics/settings still need a later repair pass.

## NEEDS REPAIR / MISSING RUNTIME

- None currently identified among the 30 canonical modules.

## REMOVED OBSOLETE TIMING IMPLEMENTATION

The retired standalone Time Divider implementation and its compatibility aliases are no longer part of the source tree:

- `assets/time-divider.html`
- `assets/modules/time-divider.js`
- `assets/div-bus.js`
- `assets/div-editor.js`

DV remains the active timing/division protocol. Removing these files does not remove DV behavior from Time Bandits or other current modules.

## Integrity rules now enforced

1. Canonical module identity is centralized in `module-ids.js`.
2. Every canonical module must have a Module Builder definition.
3. Module Builder definitions inherit canonical identity/theme metadata so module aesthetics remain module-specific.
4. Canonical modules remain visible during development until beta.
5. A duplicate Module Builder definition is an error rather than a silent replacement.
6. A duplicate ModuleContract/runtime definition is an error rather than a silent replacement.
7. A module that needs repair stays on the repair schedule; it is not replaced by a duplicate copy or hidden to make an audit pass.
8. `module-test.html` remains the per-module runtime/faceplate test surface.

## Next gate

Run the 30 modules through the module-test surface and convert this static classification into observed PASS / UI REPAIR / RUNTIME REPAIR results. Do not alter DSP or visual identity merely to satisfy the audit.

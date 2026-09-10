# MultiSynth Control Development Workflow

This document defines the build-specific workflow for developing new shared controls without destabilizing the canonical control library.

## Canon is not the development bench

`control-surface-library.js` contains approved canonical controls. New or experimental controls must not be developed directly inside canon.

During development, a control lives in a temporary lab implementation such as `control-lab.js` and is exercised only by Test Module or other explicit development tooling. Production modules must never depend on the lab implementation.

Temporary APIs and namespaces must be unmistakably temporary. For example, an experimental control may use `MultiSynthLab.SomeControl`; it must not create a permanent-looking `MultiSynth.*` API that survives promotion accidentally.

Do not create an empty permanent lab file merely to reserve the architecture. Create the temporary implementation only when a control is actually being developed.

## Promotion to canon

Once Nate approves a new control as canonical, promotion is one deliberate cleanup-complete operation:

1. Move the final approved implementation into `control-surface-library.js` with the other canonical controls.
2. Switch Test Module/development usage to the canonical `ControlSurface` API.
3. Remove the temporary implementation.
4. Remove temporary script includes, exports, namespaces, adapters, compatibility objects and development-only routing created for that control.
5. Search the repository for references to the temporary implementation and remove any leftovers.
6. Delete the lab file if it is empty after promotion.
7. Verify that production modules depend only on canon, never on the lab.

Promotion must leave one implementation and one intended canonical API. Development scaffolding must not remain as loose compatibility architecture.

## Canon lock after promotion

Canonical shared controls are protected across all three control layers:

- `control-surface-library.js` — control contract, shared semantics and generic I/O.
- `control-surface-spec.js` — canonical appearance, geometry, proportions and approved variants.
- `control-surface-renderer.js` — canonical interaction, rendering and binding behavior.

Any change to an existing canonical control in any of those three layers requires two explicit confirmations for that exact proposed change:

1. Nate explicitly authorizes the exact proposed canonical change.
2. The assistant repeats the exact authorized scope, and Nate explicitly confirms it again.

Only after both confirmations may that exact change be executed. Authorization is single-use. It does not authorize cleanup, refactors, adjacent controls, styling, behavior, renderer/spec/library changes, or any other follow-up work outside the confirmed scope.

The lock applies even when another task already requires editing one of the three canonical files. Touching the file does not grant permission to alter unrelated canonical control code.

Module-level theme/CSS may consume supported canonical styling hooks without modifying the control implementation.

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

After promotion, the control is covered by the shared-control canon lock. Existing canonical appearance, geometry, interaction behavior, generic I/O behavior, renderer behavior and approved variants are untouchable by default.

Any later change to an existing canonical control requires the established two-step authorization for that exact change: explicit authorization, exact scope repeated back, then explicit confirmation before execution. Authorization is single-use and does not extend to cleanup, refactors, adjacent controls, styling, behavior or follow-up work.

Module-level theme/CSS may consume supported canonical styling hooks without modifying the control implementation.

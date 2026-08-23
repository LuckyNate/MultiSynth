# MultiSynth Architecture Rules

Read this before making architectural, UI-library, Module Builder, rack, or shared-control changes.

## Design goals

MultiSynth should stay modular, minimal, user-friendly, centralized, and automated where automation reduces maintenance or user burden.

The app should behave predictably without requiring end users to discover internal inconsistencies. Internal diagnostics exist to help development; they must not unnecessarily block normal APK production or shift debugging onto users.

## One authoritative owner

Every shared control, prefab, renderer, routing primitive, state convention, and reusable behavior has one authoritative implementation.

Consumers may declare configuration, state binding, labels, theme tokens, grouping, and supported metadata. They must not recreate, reposition, or independently implement a shared component.

A shared-component change should propagate automatically to every consumer. Fix the authoritative owner rather than patching individual modules around it.

Examples:

- The universal performance keyboard owns its own DOM, sizing, viewport pinning, geometry, interaction behavior, and reserved screen space.
- Modules declare that they use the keyboard; they do not carry keyboard positioning CSS or keyboard-building JavaScript.
- Shared prefabs such as ADSR and scope follow the same rule.
- Module Builder is the canonical UI/control-definition path for Module Builder modules.

## Minimal layers

Do not add wrappers, compatibility shims, duplicate renderers, alternate control implementations, or compensating CSS unless they are proven necessary.

When two layers appear to own the same behavior, stop and determine which one is authoritative before changing code. Remove the competing ownership rather than stacking another correction on top.

## Verify before changing

If ownership, runtime loading, CSS cascade, state flow, routing, or call order is uncertain, inspect it first. Do not guess and patch.

For visual/layout bugs, trace all applicable shared and consumer CSS before modifying geometry. For behavior bugs, trace the actual runtime owner and call path before modifying implementation.

## User-facing reliability

Development safeguards should reduce user-visible failures, not create new ones. APK production should remain usable while architecture cleanup is in progress unless a failure would make the produced APK invalid or unsafe to test.

`scripts/audit-shared-control-ownership.mjs` is a development diagnostic. It is not an APK build gate. Use it to find ownership violations during cleanup, then fix the source architecture.

Device testing is confirmation after internal tracing, not the primary method for discovering repository-level ownership mistakes.

## Change discipline

Before deleting, renaming, replacing, or broadly refactoring files, verify runtime loading, HTML/script inclusion, DOM/event entry points, manifest/editor mapping, Android/native dependencies, persistence/navigation roles, and indirect framework use. Follow the repository change-control rules in `docs/MULTISYNTH_TODO.md`.

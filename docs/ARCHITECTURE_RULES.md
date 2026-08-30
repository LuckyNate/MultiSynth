# MultiSynth Architecture Rules

Read this before making architectural, UI-library, prefab, module, rack, graph, or shared-control changes.

## Final composition hierarchy

`shared controls -> named prefabs -> modules`

Controls are atomic reusable interaction units. Prefabs are named reusable compositions of controls and/or other prefabs. Modules are circuits/DSP assembled from controls and prefabs. ADSR is a prefab, not a control. Pads are triggers. A momentary switch is active only while pressed; there is no separate hold-control concept.

Users may build and name prefabs, then use those prefabs and controls to build modules.

## One Node Graph, multiple graph documents

There is one graph editor implementation: **Node Graph**. Prefab building, module building, rack building, and ordinary patch work are not separate editors.

The workspace may contain multiple Node Graph documents at once as tabs. Each tab owns one persisted graph circuit. Switching tabs changes the active graph document, not the editor implementation.

`Save as Prim` and `Save as Module` are output targets for the active graph. They snapshot the same circuit with different output metadata. Changing output type must never fork graph editing behavior or create a second builder architecture.

Saved graph outputs are reusable graph assets. Their external runtime port/interface contract must be explicit and authoritative before the asset is treated as a routable inserted runtime node. Do not silently guess a different interface rule in individual compilers.

## Final face pipeline

The circuit is authored first. Presentation is compiled afterward:

`Node Graph circuit -> output compile -> declarations -> FaceCompiler -> ordered full-div face -> optional saved reorder -> renderer`

The FaceCompiler proposes the initial usable face. Every top-level control or prefab becomes one full-width div in a vertical stack. Ordinary divs can only be reordered vertically as whole units. No arbitrary positioning, resizing, overlapping, grid packing, manual spans, or module-specific face CSS is permitted.

Each compiled unit has a stable face ID. The Node Graph owns the graph-instance face-order override and persists only the ordered stable IDs. Face order is presentation metadata and must not be stored as DSP/module state. Removing the override restores compiler order.

Performance units may be pinned and excluded from reordering. The performance keyboard is pinned to the bottom by contract.

Prefabs use the same compiler internally. A prefab used by a module remains one top-level module-face div.

## One authoritative owner

Every shared control, prefab registry, face compiler, renderer, routing primitive, state convention, and reusable behavior has one authoritative implementation.

- Shared controls own DOM, geometry, and gestures.
- Prefabs own named composition only.
- FaceCompiler owns initial ordering and pin rules only.
- ControlRenderer owns compiled-face DOM composition and reorder gesture only.
- Node Graph owns graph documents, tabs, routing topology, placement, patch persistence, and instance face-order overrides.
- Graph output compilation owns conversion of a graph document into prim/module/rack/patch assets.
- Modules own unique DSP and canonical module state only.
- Themes own appearance tokens only.

Consumers may declare configuration, state binding, labels, theme tokens, prefab composition, routing metadata, and pin metadata. They must not recreate shared behavior.

## Minimal layers

Do not add separate prefab/module/rack builder implementations, wrappers, compatibility shims, duplicate renderers, alternate control implementations, compensating CSS, second state stores, or module-specific layout systems. When two layers appear to own the same behavior, determine the authoritative owner and fix it there.

## Verify before changing

Trace runtime loading, CSS cascade, state flow, routing and call order before modifying ownership. Device testing confirms internally traced changes; it does not replace repository-level tracing.

## Change discipline

Before deleting, renaming, replacing, or broadly refactoring files, verify runtime loading, script inclusion, DOM/event entry points, persistence/navigation roles, and indirect framework use. Follow `docs/MULTISYNTH_TODO.md`.

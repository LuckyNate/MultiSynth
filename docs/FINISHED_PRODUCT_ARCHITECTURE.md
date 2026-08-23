# MultiSynth Finished Product Architecture

## Purpose

This document defines the target architecture and user-visible behavior for the finished MultiSynth MVP. It is a product contract, not a description of whatever the current implementation happens to do.

The governing rule is:

> One concept, one authoritative implementation, reused everywhere.

MultiSynth is a modular HTML5 audio application. The architecture should remain small enough to understand, predictable enough to test, and centralized enough that fixing a shared component fixes every place that uses it.

## Product hierarchy

The finished product has four structural levels:

`Project -> Node Graph -> Rack or Standalone Module Node -> Module Runtime`

A project owns the complete patch. The Node Graph owns external topology. A rack is a reusable compound node containing an ordered internal module chain. A standalone module is the same module runtime used without a rack wrapper.

These are views and compositions of the same underlying objects, not separate implementations of those objects.

## 1. Node Graph

The Node Graph is the authoritative workspace for connecting complete processing units.

### Graph behavior

- Routing is explicit. A connection exists only when the user connects compatible ports.
- Screen position never implies routing.
- Moving a node changes only its visual position.
- Graph connections are persisted as project data.
- A saved rack appears as one compound graph node with rack-level input/output behavior.
- A standalone module appears as one module node with ports derived from its declared capabilities.
- Graph code routes nodes. It does not reproduce module DSP or rack-internal routing.

### Graph node presentation

A graph node is a card around the canonical thumbnail/faceplate for the object it represents.

For a standalone module, the card uses the canonical full-color module faceplate.

For a rack, the card uses the canonical saved-rack thumbnail: rack identity/header, compact scope, and the rack's ordered module strips using the secondary rack treatment. If the module list exceeds the available card height, the module-list region scrolls inside the card rather than expanding the node beyond its intended bounds.

The graph card adds graph concerns only: selection, movement, ports, and connection interaction. It must not invent a second visual identity for the contained module or rack.

### Opening nodes

Touching/opening a standalone module opens the canonical module editor for that exact module instance.

Touching/opening a rack opens the canonical rack editor for that exact rack instance while preserving the Node Graph as the return context.

The graph must not implement a second module editor or second rack editor. It mounts/invokes the same editor assets used elsewhere.

## 2. Racks

A rack is a reusable compound instrument/processor containing an ordered top-to-bottom chain of module instances.

### Rack behavior

- A rack has one stable internal identity and an optional user-facing name.
- The user-facing name is semantic only; changing it does not change routing identity.
- A rack may contain any number of compatible module instances, including repeated instances of the same module type.
- Each instance owns independent state.
- Internal signal flow follows the rack's ordered module chain and declared module cascade behavior.
- The complete rack exposes compound I/O to the Node Graph.
- External graph routing does not rewrite the rack's internal order.
- Editing a rack changes that same rack object everywhere it is represented.

### Rack editor

There is one canonical Rack Editor implementation.

It is used whether the rack was opened from the rack workspace, a saved-rack library, or the Node Graph. Context may determine the close/back destination, but must not create a different editor runtime or duplicate control system.

The Rack Editor owns rack-specific operations only:

- rack name
- ordered module list
- add/remove/reorder module instances
- open a module instance for editing
- rack-level scope/output feedback where applicable
- rack-level persistence actions that are actually needed by the MVP

It does not duplicate Node Graph routing controls inside the rack. External routing remains on the Node Graph.

### Rack visual treatment

Racked module strips use the canonical secondary treatment: predominantly black/secondary face with the module's identity/accent retained. This distinguishes a module as a component of a compound rack without creating a new module theme.

Saved-rack thumbnails and rack graph-node thumbnails use the same renderer and the same secondary module strips.

## 3. Modules

A module is the smallest user-facing functional audio/control unit.

There is one canonical module definition and one runtime implementation for each active module type.

### Module identity and metadata

Every module has centrally owned metadata for at least:

- canonical ID
- display name
- stable theme key
- editor definition/URL
- family/category
- color/accent
- capabilities/resources
- cascade behavior
- state schema version

Selectors, racks, Node Graph nodes, persistence, routing, and editors consume this metadata. They do not infer it independently from filenames, labels, or duplicated lists.

Initial product families are:

- Signal Source
- Instrument
- Timers
- Samplers
- File Utilities
- Signal Processors
- EFX Processors

Family metadata is descriptive/filtering metadata. It must not be used as a substitute for capability or routing metadata.

### Module Builder

Module Builder is the canonical UI/control-definition system for modules.

A module definition declares its unique controls, state bindings, theme information, DSP-specific behavior, and capabilities. Shared controls and prefabs are referenced, not recreated.

No module may carry a private replacement for a universal control merely to alter its position or appearance.

### Universal module assets

Shared assets have one authoritative owner. Examples include:

- performance keyboard
- ADSR prefab
- oscilloscope/scope renderer
- standard knobs/toggles/selectors
- selector/faceplate renderers
- PCM/library selection surfaces where shared
- common hold/touch behavior

A module declares that it uses a shared asset and supplies configuration/state. The shared asset owns its DOM, geometry, interaction behavior, and common styling.

The universal performance keyboard is pinned to the bottom of the viewport, fills the usable viewport width, reserves the screen space it occupies, and remains in place while module content scrolls behind/above it. Consumers do not reposition it.

### Module presentation

A standalone module selector uses the canonical full-color branded faceplate treatment.

The same module inside a rack uses the canonical secondary rack treatment.

These are two presentation modes of one faceplate renderer, not separate handwritten cards.

## 4. Selectors and thumbnails

Selectors are views over canonical metadata and canonical faceplate renderers.

### Standalone module selectors

Every module selector in every mode uses the same full-width horizontal module strip renderer. A module must look like the same module whether selected from Module Test, Rack Add Module, Node Graph Insert Module, or another MVP selector.

The selector consumer may filter/order the available modules, but it does not restyle the module card.

### Saved rack selectors

Every saved-rack selector uses the same rack-thumbnail renderer.

The thumbnail consists of:

1. rack identity/name header
2. compact horizontal rack scope
3. ordered secondary-treatment module strips

The thumbnail is width-contained by design. If its module stack exceeds the allowed thumbnail height, the module-stack region scrolls internally.

The same rack-thumbnail renderer is used as the visual content of a rack node on the Node Graph.

## 5. Audio and routing ownership

The signal hierarchy is:

`shared DSP sources -> module DSP/runtime -> rack internal chain -> rack compound I/O -> Node Graph -> project output`

Each layer owns only its part of that hierarchy.

### Module layer

The module owns the DSP/behavior that makes that module unique. It accepts and emits only the signals its capabilities declare.

### Rack layer

The rack owns ordered internal composition of its module instances. It does not reimplement their DSP.

### Node Graph layer

The graph owns explicit connections between complete nodes. It does not reach into module internals or reconstruct rack chains.

### Shared audio runtime

Opening another view of an existing module or rack must not create a competing audio graph for the same object. Editors are control surfaces over the canonical runtime/state. UI composition must not duplicate live DSP ownership.

## 6. Timing, CV, and DV

Timing/control behavior is capability-driven, not inferred from visual placement or family names.

CV is the persistent parent timing/control signal. It continues downstream unless a module explicitly transforms it.

DV (Division Voltage) is a derived/local child timing signal used for divided/multiplied/split timing behavior. Creating or consuming DV does not destroy or replace the parent CV.

Father Time is the dedicated rack clock source. Timing-aware modules declare whether they source, follow, divide/consume, or transform timing through canonical capability/cascade metadata.

## 7. Persistence

Persistence is automatic for normal editing operations.

The canonical project save must preserve:

- graph nodes
- graph positions/view state where applicable
- explicit graph connections
- racks
- rack names
- rack module order
- module instance identities
- module state
- referenced PCM/assets by stable IDs
- applicable timing/controller/resource assignments

The same object must not have separate incompatible persistence formats merely because it was edited from a different screen.

UI navigation must not silently reset working state.

## 8. Navigation and editing context

Navigation answers only: "where should Back/Close return?"

It must not determine which implementation of an editor is loaded.

Examples:

- standalone module -> canonical module editor -> return to module selector
- rack module -> canonical module editor -> return to that rack editor
- rack opened from Node Graph -> canonical rack editor -> return to Node Graph

The object being edited and its runtime/state remain the same regardless of entry path.

## 9. Layout and containment

Every shared component is responsible for remaining inside its allocated viewport/container.

Shared UI uses border-box sizing and explicit containment. Width calculations must include padding and borders. Child components use `min-width: 0` where flex/grid shrinkage requires it. Long labels truncate or wrap only according to the component contract.

Scrollable content scrolls inside its intended region. It does not enlarge a card, selector, editor, or viewport until controls run off-screen.

These rules belong in the authoritative shared component, not in per-page repair CSS.

## 10. MVP change discipline

The finished product is reached by reducing competing implementations, not adding compensating layers.

For MVP work:

1. Inspect ownership before changing behavior.
2. Identify the authoritative implementation.
3. Fix that implementation when the problem is shared.
4. Remove or stop using competing ownership where proven safe.
5. Do not add wrappers, shims, alternate renderers, duplicate runtimes, or page-specific CSS to mask an ownership problem.
6. Do not alter stable module DSP while repairing graph/rack/UI architecture.
7. Do not add features unrelated to the blocking MVP behavior.
8. If the correct owner or runtime path is uncertain, inspect it before editing.
9. Device testing confirms a traced fix; it is not a substitute for tracing repository ownership.

## 11. Definition of done for the structural MVP

The graph/rack/module structure is complete when all of the following are true:

- A standalone module can be added to the Node Graph, moved, connected, opened, edited, closed, and reopened without losing state or creating a second runtime.
- A saved rack can be added to the Node Graph as one compound node, moved, connected, opened, edited, closed, and reopened without freezing or duplicating runtime ownership.
- The Rack Editor behaves identically regardless of entry path except for its return destination.
- Opening a module from a rack edits the same module instance and returns to the same rack.
- Module selectors use one canonical full-color strip renderer everywhere.
- Racked module strips use one canonical secondary renderer everywhere.
- Saved-rack selectors and rack graph-node thumbnails use one canonical rack-thumbnail renderer.
- Selector/card/editor content remains within its viewport and scrolls internally where specified.
- The universal keyboard and other shared prefabs have one placement/style owner and behave consistently in every consumer.
- Rack internal routing is ordered and deterministic.
- Node Graph routing is explicit and deterministic.
- CV/DV/timing behavior follows declared contracts.
- Saving/reloading the project reconstructs the same graph, racks, module instances, module state, and connections.
- Existing working module DSP continues to work unchanged after structural standardization.

Once these conditions hold, graph/rack architecture is no longer a module-development concern. New modules can be built against the shared contracts without requiring page-specific integration work.

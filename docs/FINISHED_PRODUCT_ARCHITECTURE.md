# MultiSynth Finished Product Architecture

## Purpose

This document defines the target architecture and user-visible behavior for the finished MultiSynth MVP. It is a product contract, not a description of whatever the current implementation happens to do.

It is subordinate to the project's canonical running behavior specification where a specific module behavior is defined, and it consolidates the structural rules from `MULTISYNTH_SPEC.md`, `RACK_ARCHITECTURE.md`, `MODULE_STANDARD.md`, `ARCHITECTURE_RULES.md`, and `MULTISYNTH_TODO.md` into one finished-product architecture.

The governing rule is:

> One feature, one implementation, one contract.

MultiSynth is an Android-hosted HTML5 modular audio workstation. It must remain modular, minimal, user-friendly, centralized, and automated where automation reduces maintenance or user burden.

## Product hierarchy

`Project -> Node Graph -> Module Node or Rack Node -> Module Runtime`

The Node Graph is the authoritative external routing workspace. A rack is a reusable compound node containing an ordered internal module chain. A loose module may also exist directly on the Node Graph.

Views are control surfaces over canonical project/rack/module objects. Opening another view of an object must not create a competing runtime, DSP graph, state owner, or duplicate editor implementation.

## 1. Node Graph

The Node Graph is a freeform explicit-routing workspace.

### Routing contract

- Signal relationships exist only through explicit stored node connections.
- Visual position has no routing meaning.
- There is no parent/child graph hierarchy.
- There is no neighborhood, grid-derived, or geometry-derived routing.
- Moving a node changes only presentation state.
- Loose modules and saved racks expose graph ports appropriate to their declared capabilities.
- A rack is externally one compound node; the graph does not reconstruct or reinterpret its internal module chain.
- Shared graph code owns graph connections and generic event delivery only. It does not synthesize substitute sources or repair module-local DSP state.

### Node presentation

Node presentation is derived from the same shared identity/taxonomy/faceplate system used by selectors.

A loose module node uses the canonical module thumbnail convention: module NAME + FAMILY with the module's canonical identity/theme treatment. Graph-specific chrome may add selection, movement, jacks, and connection interaction, but it must not create a second module identity renderer.

A rack node uses the canonical saved-rack thumbnail as its visual body: rack Name, compact rack scope, and the ordered stack of racked module strips. Racked strips use the secondary rack treatment while retaining each module's identity/accent.

If a rack's module stack exceeds the available node/thumbnail height, the module-stack region scrolls internally. The node remains contained within its allocated graph card.

### Graph connectors

The finished connector presentation is physical-patch inspired:

- module/rack IN and OUT connectors render on the node face as convincing 3.5 mm audio jacks;
- patch targets are easy to acquire by touch;
- graph connections render as physical-style patch cables;
- each endpoint has a darker circular plug/end-cap that visually reads as plugged into the jack.

Connector appearance does not change routing semantics: connections remain explicit stored graph edges.

### Opening graph nodes

Opening a loose module edits that exact module instance through the canonical Module Builder-backed module editor.

Opening a rack edits that exact rack through the canonical Rack Editor while retaining Node Graph as the return destination.

The Node Graph must not own a second module editor, second Rack Editor, second keyboard, second rack runtime, or second audio runtime. Entry context determines return navigation only.

## 2. Racks

A rack is a reusable compound node containing an ordered top-to-bottom module chain.

### Rack contract

- A rack has an immutable engine identity used for routing/persistence references.
- A rack has a player-facing `Name`.
- `Name` is semantic only and may be changed without changing engine identity.
- An unnamed rack displays its engine ID as its Name.
- A rack may contain multiple module instances, including repeated instances of the same module type.
- Every module instance owns independent serializable state.
- Internal rack routing is sequential according to module order and declared cascade behavior.
- The rack exposes compound IN/OUT behavior to the Node Graph.
- External graph branching is expressed with graph connections, not rack geometry.
- Editing a rack updates the same rack object represented in selectors and on the graph.

### Rack Editor

There is one canonical Rack Editor implementation.

It is reused whether a rack is entered from Build Racks, a saved-rack surface, or the Node Graph. Context may change Back/Close destination; it must not fork the editor implementation or runtime.

The Rack Editor owns only rack concerns required by the MVP:

- rack Name;
- ordered module-instance list;
- add/remove/reorder module instances;
- open a module instance for editing;
- rack-level scope/output feedback;
- automatic persistence of rack edits.

External node connections remain a Node Graph concern.

### Rack visual treatment

Saved-rack selectors and rack graph nodes use the same canonical rack-thumbnail renderer.

The rack thumbnail contains:

1. rack Name;
2. compact horizontal rack scope;
3. ordered module strips.

Racked module strips use the shared secondary treatment: predominantly black/secondary face with the module's canonical accent/identity retained. The thumbnail is width-contained by design and its module-stack region scrolls vertically when necessary.

## 3. Modules

A module is the smallest user-facing functional audio/control unit.

Every active module has one canonical identity, one Module Builder definition, one runtime/DSP owner, one state schema, and one manifest/capability description.

### Canonical identity

`module-ids.js` is the sole symbolic identity catalog for canonical runtime ID, display name, and stable theme key.

Implementation code references symbolic `ModuleIds` keys rather than duplicating literal IDs/display names. Filenames are implementation assets, not identity.

### Manifest and runtime metadata

`module-manifest.js` owns editor URL, category/color metadata, capabilities, resources, and cascade semantics derived from canonical identity.

Capabilities answer whether a module participates in audio, notes, CV, clocks, DIV/DV-related timing, microphone, PCM, MIDI, terminal output, and other shared resources. Cascade metadata answers how that participation behaves inside a rack.

Routing behavior must never be inferred from display name, filename, FAMILY, category, or the mere presence of a handler.

### Creator-owned FAMILY and tags

Every module has exactly one creator-owned FAMILY. FAMILY is explicit authoring metadata and is not inferred from category.

Current taxonomy rules are:

- FAMILY is shown on selector/node faces with NAME;
- missing FAMILY is visibly `NULL FAMILY`;
- the canonical primary hashtag is derived from FAMILY and cannot drift from it;
- additional hashtags describe searchable traits/capabilities and remain filtering/search metadata rather than faceplate clutter.

The current intended family vocabulary includes, as applicable to the catalog:

- SIGNAL SOURCE
- INSTRUMENT
- TIMERS
- SAMPLERS
- FILE UTILITIES
- SIGNAL PROCESSORS
- EFX PROCESSORS

If the active catalog uses a more specific creator-assigned family (for example a timed-instrument family), that explicit creator metadata is authoritative. Do not collapse or infer it merely to fit this list.

### Module Builder

Module Builder is the canonical module UI/control-definition path.

A Module Builder definition declares components, state binding, layout/group metadata, theme, FAMILY, tags, and module-specific behavior/configuration. Shared component behavior is not reimplemented in module editors.

Every declared supported component renders through the shared renderer/component library. There are no per-module control whitelists, negative gates, silent skips, or duplicate component implementations.

Unknown/unsupported declared components fail visibly during development rather than silently disappearing.

### Module DSP ownership

A module owns only the DSP/behavior that makes that module unique.

Fundamental synthesized source primitives are created through the bottom shared `DspSources` layer in `dsp-source-family.js`. Source modules configure/tune/modulate/filter/mix/envelope/route those primitives according to their unique synthesis physics; they do not create parallel primitive-source systems.

Module Builder `sources`, `actions`, and connection metadata must describe the same source hierarchy used by the runtime.

Stable module DSP must not be altered during unrelated graph, rack, selector, or shared-UI work.

## 4. Shared controls and prefabs

Every shared control, prefab, renderer, routing primitive, state convention, and reusable behavior has one authoritative implementation.

Consumers may configure state binding, labels, theme tokens, grouping, and supported metadata. They may not recreate, reposition, or independently implement the shared component.

A shared-component change must propagate automatically to every consumer.

### Universal performance keyboard

The shared performance keyboard owns:

- DOM construction;
- touch/note interaction;
- sizing and geometry;
- viewport pinning;
- usable-width containment;
- reserved bottom screen space.

When a module declares the keyboard with `meta.pinned:"bottom"`, it is pinned to the bottom of the viewport, remains visible while editor content scrolls, and fills the usable viewport width without running off-screen.

Module/editor/rack CSS does not reposition the keyboard or recreate its keys.

### Scope

The shared scope prefab owns its rendering and standard placement. The shared scope is pinned at the top where declared by the Module Builder layout contract. Every sound-producing module uses the standard analyser/scope path.

### ADSR and controls

ADSR is one shared prefab over the existing envelope DSP/state contract; there is no second envelope system. Atomic knobs, toggles, selects, ranges, step controls, and related primitives render through shared RackUI/Module Builder controls.

## 5. Selector and thumbnail system

Module Test, Rack Builder Add Module, and Node Graph module insert/browser surfaces consume the same shared taxonomy and selector UI.

### Module selectors

- One vertical application layout is used in portrait and landscape.
- Module selector surfaces use full-width horizontal rack-strip presentation, not card grids.
- Selector faces show NAME + FAMILY only.
- Tags remain available for filtering/search.
- The selector consumer may filter/order modules but may not create a different faceplate implementation.

Standalone/loose module presentation uses the canonical full themed identity treatment. A module represented as part of a rack uses the canonical secondary rack treatment. These are modes of shared presentation, not handwritten alternatives.

### Rack selectors

Saved-rack surfaces use the canonical rack-thumbnail renderer described above. The same renderer is reused inside rack graph nodes. Rack thumbnails remain width-contained and scroll their module-stack region internally when necessary.

## 6. Application layout

MultiSynth uses one vertical module layout only.

Device rotation is allowed. In landscape, the same vertical composition expands to available width and remains vertically scrollable. Controls do not reorganize into a separate landscape-specific layout.

Every shared component is responsible for remaining inside its allocated viewport/container. Shared UI uses predictable box sizing/containment, and scrollable content scrolls inside its intended region rather than expanding controls off-screen.

Layout ownership belongs to the shared component that owns the geometry. Page-specific repair CSS must not compete with that ownership.

## 7. Audio and routing hierarchy

The architectural signal hierarchy is:

`DspSources -> module DSP/runtime -> rack ordered chain -> compound rack I/O -> Node Graph -> project output`

### Module layer

Modules synthesize/process/control according to their declared capabilities and unique behavior.

### Rack layer

Rack code owns ordered internal composition and routing of module instances. It does not reimplement module DSP.

### Graph layer

Graph code owns explicit connections between complete loose-module or rack nodes. It does not reach into module DSP internals or reconstruct rack chains.

### Runtime ownership

Opening an editor/view of an existing module or rack must not create a competing audio graph for the same object. UI views control canonical state/runtime objects rather than duplicating them.

## 8. Timing, CV, and DV

### Father Time

Father Time is the top-level timer/CV authority for everything reachable downstream, including modules contained inside downstream rack nodes.

### CV

CV is the persistent parent timing/control signal. It continues downstream unchanged unless a module is explicitly designed to transform CV.

### DV

DV means Division Voltage.

DV is a temporary child CV used for local split timing, divided timing, or multiple timing. It does not replace or modify the parent CV and does not become a second persistent graph-wide timing bus.

Creating or consuming DV must leave parent CV available downstream unchanged.

Timing-aware modules declare their source/follower/divider/transform behavior through canonical capabilities/cascade metadata. Intrinsic random or physical-model timing remains inside the owning module DSP.

## 9. Persistence

Persistence is automatic for normal project/rack/module editing.

Current Node Graph project serialization contract:

- format: `multisynth-node-graph`
- version: `4`
- routing: `explicit-nodes`

A project save preserves, as applicable:

- node identities;
- node positions/view state;
- explicit connections;
- rack identities and Names;
- rack module order;
- module instance identities;
- module state;
- referenced PCM/assets by stable IDs;
- applicable controller/resource assignments.

The same object must not gain incompatible persistence merely because it was edited from a different workspace. Navigation must not silently reset working state.

Old spatial/grid project formats are not automatically interpreted as current explicit-node projects.

## 10. Navigation and editing context

Navigation determines only where Back/Close returns.

Examples:

- Module Test module -> canonical module editor -> Module Test selector;
- rack-contained module -> canonical module editor -> that Rack Editor;
- rack opened from Node Graph -> canonical Rack Editor -> Node Graph;
- loose module opened from Node Graph -> canonical module editor -> Node Graph.

Entry path must not determine editor implementation, shared-control implementation, state owner, or DSP owner.

## 11. Android/native resource ownership

Modules do not own Android hardware directly.

Native/shared resources live below the module/rack runtime and are exposed through stable services/bridge APIs, including:

- microphone/input capture;
- MIDI/Bluetooth MIDI;
- file import/export;
- persistent storage;
- Android audio focus/routing/device facilities;
- permissions.

Module instances subscribe to those resources according to declared capabilities/resources.

## 12. MVP change discipline

Structural work must reduce competing ownership rather than stack corrections.

Before architectural, UI-library, Module Builder, rack, or shared-control changes:

1. inspect actual runtime loading, ownership, CSS cascade, state flow, routing, and call order;
2. identify the authoritative owner;
3. fix that owner when the problem is shared;
4. remove competing ownership only after its role is verified;
5. do not add wrappers, compatibility shims, duplicate renderers, alternate controls, duplicate runtimes, or compensating CSS unless proven necessary;
6. do not alter stable module DSP during unrelated structural cleanup;
7. do not add adjacent features or cleanup outside approved scope;
8. if ownership or behavior is uncertain, inspect first rather than guessing;
9. use repository audits as development diagnostics, not as substitutes for tracing behavior;
10. use device testing to confirm internally traced fixes rather than making the user discover repository-level ownership mistakes.

Before deleting, renaming, replacing, or broadly refactoring files, the exact proposed file/change list requires explicit approval.

## 13. Structural MVP definition of done

The graph/rack/module architecture is complete when all of the following are true:

- A loose module can be added to the Node Graph, moved, explicitly connected, opened, edited, closed, and reopened without losing state or creating a duplicate runtime.
- A saved rack can be added as one compound graph node, moved, explicitly connected, opened, edited, closed, and reopened without freezing or creating duplicate runtime/audio ownership.
- Rack Editor behavior is the same regardless of entry path except for return destination.
- Opening a module from a rack edits that exact module instance and returns to that rack.
- Module Test, Rack Builder, and Node Graph selectors consume the same shared taxonomy and module selector renderer.
- Module selector/node faces consistently show NAME + FAMILY.
- Racked module strips use one shared secondary presentation.
- Saved-rack selectors and rack graph nodes use one canonical rack-thumbnail renderer.
- Rack/module cards and editors remain contained within the viewport; specified inner regions scroll rather than overflowing.
- Shared keyboard, scope, ADSR, and control primitives each have one geometry/behavior owner and work consistently in every declaring module.
- Rack internal routing is ordered and deterministic.
- Node Graph routing is explicit and deterministic.
- Father Time/CV/DV behavior follows the canonical timing contract through loose modules and rack-contained modules.
- Saving/reloading reconstructs the same graph, rack contents/order, module instances/state, assets, and connections.
- Existing stable module DSP and controls remain unchanged unless an observed module malfunction is being repaired.
- The repo-wide shared-control ownership audit is clean and the resulting APK passes structural smoke testing.

When these conditions hold, graph/rack/shared-UI integration is infrastructure rather than recurring module-development work. New modules can be authored through Module Builder and the canonical contracts without requiring page-specific selector, keyboard, scope, rack, or graph integration patches.

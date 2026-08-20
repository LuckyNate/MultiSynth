# MultiSynth Node Graph and Rack Architecture

This document is the canonical contract for current external routing and rack composition.

## Application hierarchy

Project -> Node Graph -> Module or Rack Nodes

A rack is a reusable compound node containing an ordered internal module chain. A loose module may also exist directly on the node graph.

## Node graph

The node graph is a freeform, explicit-routing workspace.

- Visual position does not imply signal flow.
- There is no parent/child rack hierarchy.
- There is no neighborhood or grid-derived routing.
- There is no cascade geometry that creates connections automatically.
- Signal relationships exist only through explicit stored node connections.
- Modules and saved racks both expose graph ports appropriate to their capabilities.

The node graph is the authoritative external routing model.

## Rack internals

A rack contains an ordered top-to-bottom module chain.

- A rack exposes IN and OUT as one reusable graph node.
- Internal rack routing is sequential.
- A rack may contain multiple modules, including multiple instances of the same module type.
- Each module instance owns independent serializable state.
- External graph branching happens through explicit node connections, not by changing rack geometry.

## Timing and control

### CV

CV is the persistent primary timing/control signal. A top-level timing source such as Father Time establishes timer/CV authority for everything reachable downstream, including modules inside downstream rack nodes.

The parent CV continues downstream unchanged unless a module is explicitly designed to transform CV.

### DV

DV means Division Voltage.

DV is a temporary child CV used for local split timing, divided timing, or multiple timing. It does not replace or modify the parent CV, and it is not a second persistent graph-wide timing bus. Creating or consuming DV must leave the parent CV available downstream unchanged.

Modules such as Time Bandits may derive DV from incoming timing while still preserving CV behavior. Time Bandits also has an internal fallback clock when no upstream timer is present.

## Module architecture

Every active module has one canonical identity in `module-ids.js`, canonical metadata in `module-manifest.js`, a state schema, and one runtime implementation registered through `ModuleContract`.

Module Builder definitions live with the module implementation files under `assets/modules/`. Shared registries must not become duplicate parallel specifications.

## Resource ownership

Modules do not own Android hardware directly. Native resources are shared services below the module/rack runtime, including:

- microphone/input capture
- MIDI and Bluetooth MIDI
- file import/export
- persistent storage
- Android audio focus/routing/device facilities
- permissions

Module instances subscribe to those resources through stable bridge APIs.

## Persistence

Current node-graph project serialization uses:

- format: `multisynth-node-graph`
- version: `4`
- routing: `explicit-nodes`

Project saves preserve node identities, positions, explicit connections, rack contents, module state, referenced assets, and applicable controller/resource assignments.

Old spatial/grid project formats are not automatically interpreted by the current development build.

## Non-negotiable constraints

1. External routing is explicit node-to-node routing.
2. Visual position never creates an implicit connection.
3. Racks are reusable compound nodes with ordered internal module chains.
4. There is no cascade/grid/hierarchy routing alias in the current architecture.
5. CV is the persistent parent timing/control signal.
6. DV is a temporary child CV for local split/divided/multiple timing and must not modify the parent CV downstream.
7. One canonical runtime/Module Builder definition exists per active module.
8. Stable modules are not altered during unrelated cleanup or architecture work.

# MultiSynth Rack Architecture

This document is the canonical contract for the rack-builder architecture.

## Hierarchy

Project -> Arranger -> Spatial Rack Graph -> Rack Instance -> Ordered Module Instances

The arranger is the root/trunk and owns global transport/song coordination. A rack occupies exactly one cell in a virtual two-dimensional grid regardless of its internal complexity.

## Rack neighborhood

For rack X at `(row, col)`, only the eight immediately adjacent cells are its neighborhood.

```text
P-L   P-C   P-R
      \ | /
S-L -- X -- S-R
      / | \
C-L   C-C   C-R
```

Relationships are directional vertically:

- `(row-1,col-1)`, `(row-1,col)`, `(row-1,col+1)` are X's parents.
- `(row,col-1)` and `(row,col+1)` are X's siblings.
- `(row+1,col-1)`, `(row+1,col)`, `(row+1,col+1)` are X's children.
- Equivalently, a rack reaches its direct descendant and that descendant's two siblings.
- No rack reaches beyond this local neighborhood.
- Siblings are parallel peers and never feed one another merely because they are adjacent.

## Signal rules

Signal travels downward only. One parent may split to as many as three local children. One child may inherit/mix as many as three local parents. Multiple occupied parents are mixed at the child's rack input. A parent's output is split to each occupied child. Geometry therefore creates both fan-out and fan-in without patch cables.

There is no whole-row bus and no automatic connection between non-neighboring rows. Empty cells do not extend reach. Every edge is derived from immediate grid adjacency.

## Rack internals

A rack contains an ordered top-to-bottom module ladder. Module output feeds the next module below it. There are no internal patch cables and no internal branches. If a sound needs a branch, instantiate another rack in the spatial graph.

Every placed module is an independent instance of a reusable module definition. Multiple instances of the same synth/sampler/looper may coexist with independent state.

## Resource ownership

Modules do not own Android hardware. Native resources live below the rack engine and are shared services:

- microphone/input capture
- MIDI and Bluetooth MIDI
- file import/export
- persistent storage
- Android audio focus/routing/device facilities
- permissions

Rack/module instances subscribe to resources through stable bridge APIs. One physical input can therefore serve multiple instances without opening duplicate native hardware resources.

## Persistence

A project save must preserve rack coordinates, rack identities, ordered module instances, module state, resource/MIDI assignments, arranger state, and referenced assets. Routing edges need not be persisted as arbitrary cables because they are deterministically reconstructed from rack coordinates.

## Audio safety

The engine must prevent destructive runaway amplitude at the final/native output and protect feedback-sensitive capture paths. It must not automatically normalize or simplify the synthesis graph. Dense pyramids, recursive-looking fan-in structures, and deliberately chaotic cascades are valid musical structures and should retain their sonic behavior within safe output bounds.

## Non-negotiable constraints

1. Geometry is the routing diagram.
2. Routing is rack-to-rack, not arbitrary module-to-module cabling.
3. Vertical direction is parent -> child.
4. Horizontal adjacency means siblings/parallel peers.
5. Maximum local fan-in is three parents.
6. Maximum local fan-out is three children.
7. Rack internals are a strict top-down ladder.
8. Complexity emerges by adding/moving rack instances, not by bypassing the neighborhood grammar.

# Legacy Salvage Policy

The restart is a new architecture, but it is not a rejection of every useful implementation already present in the repository.

The old branches have different salvage roles and must not be treated as equivalent sources.

## `alt` branch

`alt` is authoritative only as a donor for the best low-level primitive implementations.

Salvage from `alt`:

- low-level DSP/signal primitives;
- low-level UI/control primitives where they are the better underlying implementation;
- primitive-level interaction mechanics and reusable behavior that can cleanly stand alone.

Do not salvage from `alt` as architecture:

- its Patch Graph/node-graph architecture;
- generated or generic module faces;
- adapters and compatibility layers;
- module wrappers;
- routing architecture;
- graph/compiler layering;
- placeholder modules;
- any system that mixes primitives into the user Patch Graph;
- any layout system that turns controls into generic cards.

The rule is simple:

**Take the low-level parts from `alt`; discard the system built around them.**

The primitives are to be extracted into the new primitive library and used only inside the separate Module Builder Graph.

## `main` branch

`main` is the primary donor for proven instrument-level work.

Salvage from `main` where it is genuinely useful:

- module DSP and musical behavior;
- synthesis algorithms and modulation topology;
- note-on/note-off behavior;
- sampler, looper, granular and timing behavior;
- module defaults and meaningful state;
- external Carrier/CV semantics;
- module identities;
- visual themes;
- successful module layouts;
- the successful hardware/control aesthetic;
- integrated-value knob appearance;
- performance-keyboard behavior;
- any other module-specific behavior that is already musically correct and worth preserving.

Do not copy the surrounding old application architecture merely because a useful module is implemented inside it.

A legacy module is migrated by extracting what makes the instrument itself valuable and rebuilding that instrument as a new Module Builder graph using the new primitive library.

## Migration rule

A migrated module should therefore be the combination of:

**best low-level primitives from `alt` + useful instrument behavior/aesthetics from `main` + the new Module Builder/Patch Graph architecture.**

Neither legacy branch is copied wholesale.

For each module migration:

1. inspect the corresponding `main` implementation and identify its actual musical behavior, DSP topology, defaults, state, ports and visual identity;
2. identify reusable low-level primitive implementations in `alt` where they are superior;
3. extract/refactor those primitives into the clean primitive library without carrying their old graph or adapter dependencies;
4. reproduce the module in the Module Builder from those primitives;
5. reproduce or improve the useful `main` face/theme using the shared control language;
6. verify the rebuilt module against the useful behavior of the `main` version;
7. only then mark the module migrated.

## Hard boundary

Legacy code does not get an adapter simply to make it appear compatible with the restart.

If code is worth saving, extract the useful implementation into the new owner. If it cannot be cleanly separated from obsolete architecture, use it as a behavioral reference and implement the behavior cleanly.

`alt` primitives are the exception specifically because their low-level implementations are considered worth preserving.

# MultiSynth

> READ THIS BEFORE WRITING CODE.

MultiSynth is a phone-first Android-hosted HTML5 modular synthesizer and audio workstation.

This restart begins from the product experience, not from the old implementation. Previous code remains in Git history as reference material only. Nothing from the legacy tree is automatically authoritative just because it already exists.

The goal is simple to state and strict to execute:

**MultiSynth must be a playable modular synthesizer whose controls are unified, whose modules actually work, and whose instruments look like believable physical hardware.**

## Product priorities

The priorities are equal parts function and form:

- The synth must make sound and respond immediately.
- Patch cables must really route Carrier and CV.
- Controls must really alter the owning runtime state/DSP.
- Playable instruments must be directly playable.
- Module state and patch state must persist.
- Controls must share one interaction language and one quality standard.
- Modules must not all look the same.
- Every module should look like a real piece of electronic music equipment that could plausibly exist on a desk, in a rack, or in a strange boutique synth shop.
- Aesthetics are part of correctness. A technically functional but visually broken module is not finished.

## What "unified controls" means

Knobs, dials, switches, faders, ribbons, pads, keys, jacks, displays, scopes and other recurring controls come from one shared control library.

That library owns:

- touch behavior;
- value scaling and quantization;
- pointer capture;
- active/pressed states;
- accessibility semantics;
- common physical proportions;
- common jack behavior;
- common rendering quality.

A shared control does **not** force every module into the same panel layout.

The same knob may appear on several instruments, but the surrounding face, grouping, spacing, labeling, materials, color, hierarchy and composition belong to the module.

Shared controls are the parts bin. A module is the designed machine built from those parts.

## Module rule

Every module must have one clear definition that ties together:

- identity;
- default state;
- ports;
- control bindings;
- face composition;
- DSP/runtime behavior;
- note/clock/CV/trigger behavior where applicable;
- persistence.

Do not create placeholder modules that merely expose controls without implementing the named behavior.

Do not create a second fake runtime to make a face appear functional.

Do not create generic PITCH / LEVEL / TONE boilerplate for a module whose actual behavior is something else.

## Visual rule

A module face is intentionally composed.

Controls may be arranged in rows, banks, sections, channels, strips, central clusters or other layouts that make musical and visual sense. Large modules may be larger than the viewport and scroll internally. Performance surfaces may remain pinned or otherwise immediately reachable.

The retired approach where every control becomes a giant independent full-width card is explicitly rejected.

A keyboard instrument must visibly contain a usable keyboard. A drum machine must visually read as a drum machine. A sequencer must expose its sequence. A mixer must read as a mixer. A processor should communicate its signal flow through its controls.

## Patch workspace

The patch workspace is an explicit-routing surface.

- Module position has no routing meaning.
- Carrier and CV are distinct connection types.
- Cables are visible, physical-looking and easy to follow.
- Jacks look and behave like jacks.
- Pan and zoom move the patch field coherently.
- Module faces remain recognizable at useful zoom levels.
- The workspace itself is visually quiet so the instruments and cables dominate.

Every ordinary module exposes the standard external boundary ports unless a module type explicitly requires otherwise:

- Carrier IN
- CV IN
- Carrier OUT
- CV OUT

Additional jacks are declared deliberately.

## Output

Only the output mixer/final-output owner reaches the device destination.

The output mixer grows as needed and always exposes one unused input beyond the number currently connected.

No ordinary module silently connects itself to the device output.

## Playability

Playable instruments expose real note-on/note-off behavior and use a shared performance keyboard/control surface.

The performance keyboard is a primary instrument surface, not a decorative control hidden below an accidental scroll stack.

Touch performance should support the useful behavior preserved from earlier experiments: multi-touch notes, sliding between notes, velocity/expression control, pitch interaction and octave navigation where appropriate.

## Persistence

Normal work persists automatically.

At minimum, save and restore:

- module instances;
- module positions;
- module state;
- graph camera state;
- patch cables;
- saved reusable modules/patches where supported;
- referenced samples/assets by stable identity;
- meaningful presentation state.

Reloading the project should reconstruct the same playable instrument, not merely the same drawing.

## Development order

Do not mass-port the module catalog first.

The first finished vertical slice is:

**one beautiful playable synth -> output mixer -> real patch cable -> audible output -> save -> reload -> still playable**

Then add CV/tempo synchronization and one processor. Only after that foundation is proven should the rest of the module catalog return.

## Documentation

`docs/DESIGN.md` is the product/design contract for the restart and should be read with this README before implementation work.

When implementation and these documents disagree, stop and resolve the disagreement instead of stacking another adapter or compatibility layer on top.

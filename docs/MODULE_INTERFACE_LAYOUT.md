# MultiSynth Module Interface Layout Contract

This document defines the canonical layout rules for every finished MultiSynth module interface.

The architectural model is invariant:

**Patch Graph -> modules -> shared control library.**

A finished module is one intentionally composed face made from shared library controls. Module code arranges, binds and themes those controls. It does not invent another control system.

## 1. Phone viewport is the hard constraint

The module editor is phone-first. At every supported phone width, the entire module face must fit the viewport width.

**Horizontal overflow is a failed layout.**

This applies to the module shell, every bank, every row, every grid, every screen and every library control. A child may never make its parent wider than the available content width.

Before approving a layout, verify `scrollWidth <= clientWidth` for the page and for each major bank.

## 2. Width arithmetic comes before column count

Never choose a column count first and then hope CSS makes it fit.

For a bank with usable width `W`, horizontal padding `P`, column gap `G`, control minimum useful width `C`, and `N` columns, the layout is valid only when:

`N*C + (N-1)*G <= W - 2P`

If that fails, reduce `N`. Do not allow CSS Grid to widen the module.

`minmax(<fixed minimum>, 1fr)` is forbidden when that fixed minimum can make the grid wider than its parent. For phone grids use `minmax(0,1fr)` and explicitly choose a column count that preserves useful control size.

## 3. Outer composition

Canonical hierarchy:

```text
module viewport
  main content inset
    header
    output scope / primary display when applicable
    module shell
      functional bank
      functional bank
      functional bank
```

The module shell is one centered bounded chassis. Banks are regions inside it.

Required behavior:

- 8-16 px page inset;
- shell width `100%` of the available inset content, never wider;
- `box-sizing:border-box` on shell, banks, rows and grids;
- `min-width:0` on grid/flex children that must shrink;
- 10-18 px vertical separation between major regions;
- bottom clearance for persistent app controls and Android safe area.

## 4. Banks are not independent page-width cards

Prefer one module shell containing its functional banks. A bank must remain completely inside the shell.

Bank defaults:

- normal width: 12-18 px internal padding;
- narrow phone: 8-12 px internal padding;
- 12-20 px between banks;
- bank heading inside the bank;
- border/recess/material change may establish grouping.

A bank must never be narrower than its children or allow children to paint outside its border.

## 5. Controls stay inside their cells

Every library control placed in a grid must obey the grid cell width.

Required wrapper rules:

- `min-width:0`;
- `max-width:100%`;
- `width:100%` only for controls designed to fill a cell, such as pads/buttons/steps;
- circular knobs/dials use an approved fixed size that is **smaller than the cell**, never wider than it;
- control faces must not use a hardcoded width larger than their grid cell;
- labels/readouts must not increase intrinsic grid width.

Do not rely on visual overflow being clipped. Fix the geometry.

## 6. Phone grid patterns

These are safe starting patterns, subject to actual width arithmetic.

At approximately 360-430 CSS px viewport width:

- ordinary large knobs/dials: **2 columns**;
- compact knobs: **3 columns only if the measured cell comfortably contains them**;
- transport buttons/switches: **2 columns**;
- sample/drum pads: **2 columns by default; 4 only when each pad remains a useful touch target and labels fit**;
- sequencer steps: **4 columns by default; 8 only for genuinely compact step primitives proven to fit**;
- text-heavy sample/library choices: normally **1 column**.

Do not preserve desktop column counts on a phone merely because the controls technically render.

## 7. Reflow, do not shrink indefinitely

Responsive resolution order:

1. keep page inset;
2. keep bank inset;
3. reduce decorative gaps modestly;
4. reflow to fewer columns;
5. use a smaller approved control size if still useful;
6. grow vertically and scroll.

Never solve width by eliminating margins, overlapping controls, allowing controls to cross bank borders, compressing text into unreadable columns, or shrinking touch targets until they are ornamental.

## 8. Labels are part of geometry

Labels must fit the same cell as their control.

- short hardware labels remain one line when possible;
- a label may wrap only inside its own cell;
- sample names may wrap, but must not overlap adjacent pads;
- long asset names belong in a screen/list row, not under a small pad;
- a loaded sample pad should show a compact slot identity; full sample metadata belongs in the selected-sample/library area;
- labels and values may not extend the intrinsic width of a grid track.

## 9. Screens and lists

A screen is a shared library control mounted inside a bank. Its face must be `width:100%` of the bank's content area and `max-width:100%`.

List content inside the screen must use predictable rows:

- one text/content area;
- fixed-size action controls at the trailing edge;
- text wraps inside the content area;
- action controls never overlap text;
- rows never create horizontal overflow;
- the screen scrolls internally when appropriate.

A library item with a long title must remain a row, not become a narrow tower of words.

## 10. Primary versus secondary controls

Layout follows musical use.

- sampler: sample interaction, pads and sequence are primary;
- drum machine: pads, steps and transport are primary;
- synth: performance surface and principal tone controls are primary;
- mixer: channels and levels are primary;
- timing module: rate/timing controls and indication are primary.

Primary controls receive the best space and easiest reach. Secondary configuration may appear lower in the vertical flow.

## 11. Shared controls only

Interactive hardware comes from the shared control library: knobs, dials, switches, buttons, pads, faders, ribbons, keys, screens, meters, LEDs, jacks and registered primitives.

Module code selects, binds, arranges and themes those controls. Structural DOM is allowed for shells, banks, headings, rows and layout containers.

Module code must not create substitute interactive controls or parallel interaction systems.

## 12. Choosing control type

- knob: set-and-leave parameter with moderate useful range;
- dial: wide range/high sensitivity/high resolution/indexed precision;
- switch: persistent binary state;
- momentary button: press action;
- pad: direct performance/selection target;
- fader: continuous level/position with useful linear relationship;
- ribbon/XY: gesture control;
- screen: bounded information/selection surface;
- LED/meter: status or level indication.

Control choice follows use, not whichever primitive happens to fit a row.

## 13. CSS ownership

Shared control anatomy, geometry limits and interaction belong to the shared control library.

Module CSS owns page material, chassis, banks, grid/flow composition, spacing, theme and responsive arrangement.

Module CSS may size a shared control through supported variables/visual options, but it may not reconstruct the control anatomy.

## 14. Reference principle

No Quarter remains useful as a composition reference for centered content, breathing room, bounded faceplate, internal grouping and responsive reflow. It is **not** a template whose desktop grid counts are copied blindly.

Every new module must run its own width arithmetic against its actual controls and labels.

## 15. Required narrow-phone review

A module is not complete until it is visually reviewed at a narrow phone width and all of these are true:

- no horizontal page overflow;
- shell is fully visible between left/right insets;
- every bank is fully inside the shell;
- every control is fully inside its bank;
- no knob/dial crosses a bank border;
- no pad/button crosses a bank border;
- no label overlaps a neighboring cell;
- long text remains readable;
- screens/lists remain useful widths;
- primary controls are easy to reach;
- touch targets remain useful;
- vertical scrolling is deliberate;
- persistent bottom UI does not cover the last usable control.

If any item fails, the column count or composition is wrong. Fix the layout; do not add another layer.

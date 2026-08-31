# MultiSynth Theme Authoring

## Purpose

Every module owns a four-color hardware theme:

- `background` — deepest chassis/cavity color;
- `panel` — primary faceplate/material color;
- `accent` — active/identity color;
- `text` — primary labeling/readout color.

Module authors should not have to hand-pick all four values. The theme authoring tool accepts one, two, three or four seed colors, or a natural-language description, and resolves a complete usable four-color theme.

The result is always editable. Generated colors are suggestions, not irreversible choices.

## Authoring surface

The theme editor presents four large color wells labeled Background, Panel, Accent and Text, plus a live hardware preview using the canonical MultiSynth knob, button, display, jack and small faceplate sample.

Each well has:

- color swatch;
- editable color value;
- role label;
- lock/unlock control;
- direct color picker.

The editor also provides:

- description field;
- Generate/Regenerate action;
- Shuffle unlocked colors;
- Reset;
- contrast/status indicators;
- preview on both normal and active control states.

Regeneration never changes a locked color.

## Input modes

### One seed color

The supplied color becomes the identity anchor. The system chooses its most plausible role, normally `accent`, unless the user explicitly drops or assigns it to another role.

From that anchor it derives:

- a chassis/background value;
- a faceplate/panel value;
- a readable text value.

The derived theme should preserve the hue character of the seed without simply producing four lighter/darker copies.

### Two seed colors

The two colors are preserved and assigned to the most useful semantic roles based on luminance, chroma and contrast.

Typical behavior:

- vivid + dark -> accent + background;
- vivid + light -> accent + text/panel;
- dark + light -> background + text;
- two chromatic colors -> identity/accent plus panel or secondary structural role.

The other two semantic colors are generated around them.

The author can explicitly assign either seed to a role before generation. Explicit role assignments always win over automatic role inference.

### Three seed colors

The three supplied colors are preserved and mapped to semantic roles. The missing fourth color is derived to complete the hardware theme and maintain usable contrast.

### Four seed colors

All four colors may be supplied directly. The tool does not replace them unless asked.

It still evaluates the palette and warns about unreadable or visually collapsed combinations.

Authors may reorder colors between semantic roles by dragging or assigning them.

### Natural-language description

A description may be used alone or together with any number of seed colors.

Examples:

- `aged brass laboratory clock with warm cream lettering`;
- `cheap red 1980s drum machine`;
- `black anodized aerospace panel with toxic green indicators`;
- `blue and silver electric piano, polished but slightly worn`;
- `stark mathematical black and white instrument`.

Description parsing produces palette intent, not arbitrary per-control styling. It resolves toward the same four semantic colors.

When seed colors are also supplied, the description guides the generated missing colors around those fixed anchors.

## Color model

Palette generation should operate in a perceptual color model, preferably OKLCH/OKLab, rather than performing raw RGB addition/subtraction.

Generation uses perceptual properties explicitly:

- lightness;
- chroma;
- hue;
- perceptual color distance.

This makes derived colors remain visually related while still occupying distinct hardware roles.

Generated RGB/hex values are outputs of the perceptual process, not the calculation space.

## Role solver

The theme solver evaluates supplied colors and produces one value for each semantic role.

### Background

Normally the deepest structural value. It should provide visual depth behind the faceplate and controls without swallowing jack holes, shadows or dark hardware detail.

### Panel

The primary device material. It must be sufficiently separated from Background that the module reads as a mounted physical object.

Panel may be lighter or darker than Background depending on the requested material/style, but the two must remain perceptually distinct.

### Accent

The strongest identity/action color. It drives active indicators, tick marks, LEDs, selected states, focus feedback and other high-information elements.

Accent should normally have more chroma or stronger contrast than the structural colors.

### Text

The primary label/readout color. It is selected for legibility against Panel and relevant screen/control surfaces while still belonging to the palette.

Pure black or white are allowed when they best serve the theme; Text does not have to be hue-derived from Accent.

## Derived hardware colors

Only the four semantic theme colors are authored/stored as the core palette.

The control system derives secondary materials from them, including:

- panel highlight/shadow;
- trim/edge color;
- recessed cavity color;
- dim/inactive label color;
- control body and knob body;
- fader track;
- display background;
- display text;
- active glow;
- jack metal/rim treatment;
- shadow color.

These are deterministic theme derivatives so every shared control automatically follows the module theme.

A module may later expose carefully controlled material overrides, but the four-color theme is always the foundation.

## Contrast and usability rules

The generator should optimize for usable hardware, not merely attractive palette swatches.

At minimum it checks:

- Text against Panel;
- Text/readout against screen surfaces;
- Accent against Panel;
- active Accent state against inactive control state;
- Panel against Background;
- jack/hole visibility against the surrounding faceplate.

A weak combination is not silently changed when the user supplied and locked it. Instead the editor displays a clear warning and offers a generated correction.

Unlocked generated colors may be adjusted automatically to satisfy the visual requirements.

## Locking workflow

Any semantic color can be locked.

This is central to the workflow.

Example:

1. author enters `#d71920`;
2. generator produces a red hardware palette;
3. author likes Background and Accent but wants another Panel;
4. Background and Accent are locked;
5. Regenerate changes only Panel and Text;
6. author locks Panel and tweaks Text manually.

The same workflow applies when starting from a description.

## Multiple candidate themes

Generation should normally return several candidate solutions rather than pretending there is one mathematically correct palette.

A useful first version is four candidates:

- conservative;
- vivid;
- dark hardware;
- light hardware.

All candidates honor locked colors and description intent.

Choosing a candidate loads it into the four editable semantic wells.

## Hardware preview

Palette approval must happen on hardware, not on isolated rectangles.

The live preview should contain at least:

- module faceplate/background boundary;
- canonical main-style knob with integrated numeric value;
- inactive and active button;
- small display/readout;
- Carrier/CV jack treatment;
- label typography;
- LED/active indicator.

The preview uses the real shared control CSS once that library exists.

A theme is not considered successful merely because its four swatches look good together.

## Storage contract

A saved module stores only the resolved semantic theme plus optional authoring provenance:

```text
theme
  background
  panel
  accent
  text
  source
    description?
    seeds?
```

The runtime does not require the description or seed history; those are optional authoring metadata useful for later editing/regeneration.

## Design requirement

The theme generator is part of module authoring, not a global app skin chooser.

Each module may have its own theme.

The shared control library consumes that module theme so the same beautiful knob, switch, screen, keyboard and jack construction automatically belongs visually to whichever instrument uses it.

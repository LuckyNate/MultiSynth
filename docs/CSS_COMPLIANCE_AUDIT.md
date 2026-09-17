# MultiSynth CSS Compliance Audit

Status: historical audit reference; **not an active project backlog**.

The original stylesheet-by-stylesheet audit was useful while the canonical control/layout system was being established, but its per-file statuses no longer define current work. The canonical control-family audit is complete and the architecture contracts now live in:

- `docs/CSS_STYLE_CONTRACT.md`
- `docs/MODULE_INTERFACE_LAYOUT.md`
- `docs/CONTROL_DEVELOPMENT.md`
- `docs/devcontrols.md`

## Current rule

CSS/control compliance is verified as part of each module's full real-MIDI rebuild. It is not a separate project-level TODO.

For every rebuilt production module:

- interactive hardware comes from canonical controls/prefabs;
- ordinary containment/reflow comes from shared layout infrastructure;
- module CSS owns identity, material, color, typography, artwork and genuinely specialized composition;
- module CSS does not recreate canonical control anatomy or interaction;
- module-local geometry is not used to patch around a missing shared layout rule;
- phone-width containment and touch usability are part of the module completion gate;
- existing canonical control visuals remain locked unless the exact two-confirmation canon-change process is satisfied.

## Completion relationship

A module cannot be marked COMPLETE in `modules.md` merely because its MIDI runtime works. Its rebuilt surface must also comply with the current control/layout contracts, have relevant behavioral smoke coverage, and pass the full CI/build.

The only active project-level TODO remains finishing the full real-MIDI rebuild across the current production roster. Any CSS/control migration still required by an individual module is completed inside that rebuild, not tracked as a second catalog-wide cleanup project.

## Legacy note

Older audit references to retired control layers, rack-era styles, private module control systems, and the former fixed ladder-synth family describe historical migration state. They are not current architecture and must not be restored as compatibility paths.

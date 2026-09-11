# MultiSynth User Controls

MultiSynth uses one shared set of controls across its modules. A control keeps the same physical behavior wherever it appears; the module decides only what that control means.

## Rotary controls

### Knob
Drag vertically to change the value. A tap locks or unlocks the knob. A locked knob is protected from accidental movement and shows the shared locked-state feedback.

### Encoder
Turn with a circular drag. Encoders may rotate continuously and are commonly used for indexed choices or cyclic values. A tap may select or activate the current choice when the module assigns that action.

### Turntable
Press and drag the platter to scrub. Release it to let the shared platter motion settle back into normal rotation.

## Linear and performance controls

### Fader
Press and drag along the fader axis. Vertical faders move up/down; horizontal variants move left/right.

### Ribbon
Press or tap a position on the ribbon, then drag along its axis for continuous control.

### Expression
Used like a ribbon, but returns toward center after release. It is intended for temporary expressive movement rather than a value that stays where released.

### XY
Press and drag anywhere on the surface to control two values at once. The shared XY performance control returns to center when released.

### Pad
Press the pad for a performance/action input. Shared pad feedback lights while it is being touched.

### Button
Tap or press the button for the action assigned by the module. Buttons may be momentary, selectable, or stateful depending on the module action they are bound to.

### Switch
Tap to change between its two states.

## Displays

### Readout
A non-interactive shared text/value display. Readouts may be fixed-width and may use the shared segmented display presentation.

### Screen
A shared display surface for richer information. Scroll variants can be dragged/scrolled through when their content exceeds the visible area.

### Oscilloscope
Displays a changing signal waveform. Signal interaction belongs to the module/scope feature using it rather than changing the physical scope presentation.

### Meter
Displays a live level or other continuously changing measurement.

### LED
Displays status, activity, timing, or another module state.

## Node features

### Jack
Jacks belong to the node graph rather than the module-control set. Dragging/patching a jack is handled by the node-routing system.

### Decal
A non-interactive artwork feature used on node/module surfaces. It does not accept control gestures.

## General behavior

Controls use the same shared appearance and touch behavior throughout MultiSynth. Module code supplies the meaning, value range, saved state, and audio/control destination. When a control changes context, its visible state should immediately reflect the newly selected saved target.

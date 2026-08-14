# MultiSynth Android — Minimal Java Shell

Native Android wrapper for the MultiSynth instrument collection. One plain-Java Activity contains a WebView for the selector and instruments, while Android `MidiManager` handles USB/Bluetooth MIDI. It has no AndroidX, Kotlin, Web MIDI, or Web Bluetooth dependency.

## Interface contract

Every instrument keeps its oscilloscope fixed at the top and its playable keyboard fixed at the bottom while the controls scroll independently between them. PureSynth and No Quarter also ship static keyboard markup as a visible fallback before JavaScript initializes.

## Included instruments

The selector and known-working QuadSynth files are already installed in `app/src/main/assets/`:

- `index.html` — synth selector and app entry point
- `selector.css` — selector theme and future synth slots
- `quadsynth.html` — QuadSynth instrument interface
- `quadsynth.css`
- `quadsynth.js`
- `pulsynth.html` — Pulsynth three-stage PWM ladder interface
- `pulsynth.css`
- `pulsynth.js`
- `sinladder.html` — SinLadder three-stage sine harmonic ladder interface
- `sinladder.css`
- `sinladder.js`
- `stinger.html` — Stinger three-stage overlapping cycloid click ladder
- `stinger.css`
- `stinger.js`
- `razorback.html` — Razorback three-stage movable-peak ramp ladder
- `razorback.css`
- `razorback.js`
- `puresynth.html` — PureSynth mathematically generated waveform instrument with movable triangle peak
- `puresynth.css`
- `puresynth.js`
- `noquarter.html` — No Quarter velocity-responsive electric piano
- `noquarter.css`
- `noquarter.js`

`quadsynth.html` loads the native bridge immediately after `quadsynth.js`:

```html
<script src="native-midi.js"></script>
```

The browser-only `BT MIDI` / Web MIDI implementation has been removed; native MIDI replaces it.

## Latency work

MultiSynth requests Web Audio's interactive latency mode, holds the Android WebView renderer at high priority, uses hardware rendering, keeps the audio graph warm, and prebuilds each instrument's current waveform data before the first MIDI note. Bluetooth A2DP codec buffering remains controlled by Android and the receiving device.

## Launcher icon

The adaptive launcher icon uses seven signal bars representing the seven included instruments and falls back to a vector icon on pre-Android 8 devices.

## Future architecture — spatial rack builder

Implement this after the individual MultiSynth units are finished. The rack builder deliberately uses a constrained spatial routing grammar instead of patch cables or arbitrary module-to-module wiring. The goal is simplicity without sacrificing complex composition.

### Core model

- The arranger is the trunk/root of the signal structure and owns global transport/song coordination.
- A rack is one routing node (one "house on the block") regardless of how many modules or how much internal complexity it contains.
- Modules inside a rack form one ordered ladder and execute top-to-bottom. There are no internal patch cables.
- If a patch needs an internal branch, instantiate another rack node instead of adding an exception to the ladder rule.
- Routing exists between rack nodes, never directly between synths/modules.
- The resulting project is a tree/branching-ladder structure whose geometry is also its routing diagram.

### Neighborhood routing

Treat rack positions like a local cellular neighborhood. Signal direction runs from parent racks above to child racks below. Each rack may have up to three local parents and up to three local children (upper-left/upper-center/upper-right and lower-left/lower-center/lower-right where occupied).

For this layout:

```text
[A] [B] [C]
[D] [E] [F]
```

local connectivity is:

```text
A -> D, E
B -> D, E, F
C -> E, F
```

A does not reach F and C does not reach D. There are no long-range connections outside the local neighborhood.

### Mixing, splitting, and parallel paths

Neighborhood geometry creates routing operations automatically:

- One parent touching several child positions splits its output to those child racks.
- Several parent positions feeding one child combine/mix at that child's input.
- Side-by-side racks represent simultaneous/parallel branches rather than one feeding the other.
- A square of two parents over two children creates crossing paths: both children receive both parents because each child is in the local neighborhood of both parents.

Example:

```text
[P1] [P2]
[C1] [C2]
```

means:

```text
P1 -> C1
P1 -> C2
P2 -> C1
P2 -> C2
```

Thus C1 processes P1 + P2 and C2 independently processes P1 + P2. Larger blocks extend the same local rule; adjacency determines connectivity rather than explicit cables or a routing matrix.

### Design constraint

This topology is intentionally limited. Do not later "fix" it by introducing arbitrary internal cables. Complexity should emerge by composing and instantiating additional rack nodes. Rack contents may be simple or extremely complex, but every rack still occupies exactly one neighborhood cell and follows the same external routing rules.

## Build online from a phone

Upload the complete project to a GitHub repository. Open **Actions**, choose **Build MultiSynth APK**, press **Run workflow**, then download the `MultiSynth-debug-apk` artifact. The workflow installs Java/Gradle and builds the APK in GitHub's cloud runner. Minimum Android version is 6.0 (API 23).

The same project also opens normally in Android Studio if a computer is available.

## GO:88 connection

1. Pair the GO:88 as a Bluetooth audio device in Android so normal app audio plays from the piano speakers.
2. Pair its Bluetooth MIDI connection in Android. MultiSynth can explicitly open a paired Bluetooth device through Android's native `openBluetoothDevice()` API, so Roland Piano App does not need to remain open. USB MIDI is also supported directly.
3. Open MultiSynth, choose an instrument, and tap **MIDI INPUT**.
4. Select the GO:88 output port.
5. Tap **AUDIO OUT** if you need to change Android's Bluetooth output.

The app remembers the selected MIDI device and port and reconnects when Android presents the same device again. CC64 sustain, velocity, note on/off, all-notes-off, and multi-channel note identity are supported.

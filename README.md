# MultiSynth Android — Minimal Java Shell

Native Android wrapper for the MultiSynth instrument collection. One plain-Java Activity contains a WebView for the selector and instruments, while Android `MidiManager` handles USB/Bluetooth MIDI. It has no AndroidX, Kotlin, Web MIDI, or Web Bluetooth dependency.

## Interface contract

Every instrument keeps its oscilloscope fixed at the top and its playable keyboard fixed at the bottom while the controls scroll independently between them. PureSynth also ships static keyboard markup as a visible fallback before JavaScript initializes.

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

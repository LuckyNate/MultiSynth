package audio.quadsynth.app;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanFilter;
import android.bluetooth.le.ScanResult;
import android.bluetooth.le.ScanSettings;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.media.AudioManager;
import android.media.midi.MidiDevice;
import android.media.midi.MidiDeviceInfo;
import android.media.midi.MidiManager;
import android.media.midi.MidiOutputPort;
import android.media.midi.MidiReceiver;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.ParcelUuid;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class MainActivity extends Activity {
    private static final int PERMISSION_REQUEST = 44;
    private static final String BLE_MIDI_SERVICE = "03b80e5a-ede8-4b33-a751-6ce34ec4c700";

    private WebView webView;
    private MidiManager midiManager;
    private BluetoothAdapter bluetoothAdapter;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final List<Choice> choices = new ArrayList<>();
    private final Map<String, BluetoothDevice> scannedBluetooth = new LinkedHashMap<>();
    private MidiDevice openDevice;
    private MidiOutputPort openPort;
    private SharedPreferences preferences;

    private final MidiReceiver midiReceiver = new MidiReceiver() {
        @Override public void onSend(byte[] data, int offset, int count, long timestamp) {
            JSONArray bytes = new JSONArray();
            for (int i = offset; i < offset + count; i++) bytes.put(data[i] & 0xff);
            runJs("window.QuadSynthNativeMidi&&window.QuadSynthNativeMidi.receive(" + bytes + ");");
        }
    };

    private final MidiManager.DeviceCallback deviceCallback = new MidiManager.DeviceCallback() {
        @Override public void onDeviceAdded(MidiDeviceInfo info) { publishDeviceChange(); }
        @Override public void onDeviceRemoved(MidiDeviceInfo info) {
            if (openDevice != null && openDevice.getInfo().getId() == info.getId()) disconnectMidi();
            publishDeviceChange();
        }
    };

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        setVolumeControlStream(AudioManager.STREAM_MUSIC);
        preferences = getSharedPreferences("quadsynth-midi", MODE_PRIVATE);
        midiManager = (MidiManager) getSystemService(Context.MIDI_SERVICE);
        BluetoothManager bm = (BluetoothManager) getSystemService(Context.BLUETOOTH_SERVICE);
        bluetoothAdapter = bm == null ? null : bm.getAdapter();

        webView = new WebView(this);
        setContentView(webView);
        configureWebView();
        midiManager.registerDeviceCallback(deviceCallback, main);
        webView.loadUrl("file:///android_asset/index.html");
    }

    private void configureWebView() {
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
        webView.getSettings().setOffscreenPreRaster(true);
        webView.getSettings().setAllowFileAccess(true);
        webView.getSettings().setAllowContentAccess(false);
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                return !("file".equals(uri.getScheme()) && "/android_asset/".equals(uri.getPathSegments().isEmpty() ? "" : "/" + uri.getPathSegments().get(0) + "/"));
            }
            @Override public void onPageFinished(WebView view, String url) {
                runJs("window.warmAudioEngine&&window.warmAudioEngine();");
                publishDeviceChange();
                reconnectRememberedMidi();
            }
        });
        webView.addJavascriptInterface(new Bridge(), "AndroidMidi");
    }

    private final class Bridge {
        @JavascriptInterface public void chooseInput() { runOnUiThread(MainActivity.this::beginMidiSelection); }
        @JavascriptInterface public void disconnect() { runOnUiThread(MainActivity.this::disconnectMidi); }
        @JavascriptInterface public void openAudioSettings() {
            runOnUiThread(() -> startActivity(new Intent(Settings.ACTION_BLUETOOTH_SETTINGS)));
        }
        @JavascriptInterface public String listInputs() { return midiChoicesJson().toString(); }
    }

    private boolean hasBluetoothPermission() {
        if (Build.VERSION.SDK_INT < 31) return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        return checkSelfPermission(Manifest.permission.BLUETOOTH_SCAN) == PackageManager.PERMISSION_GRANTED &&
                checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED;
    }

    private void beginMidiSelection() {
        if (!hasBluetoothPermission()) {
            if (Build.VERSION.SDK_INT >= 31) requestPermissions(new String[]{Manifest.permission.BLUETOOTH_SCAN, Manifest.permission.BLUETOOTH_CONNECT}, PERMISSION_REQUEST);
            else requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION}, PERMISSION_REQUEST);
            return;
        }
        scanAndShowMidiInputs();
    }

    @Override public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(requestCode, permissions, results);
        if (requestCode == PERMISSION_REQUEST && hasBluetoothPermission()) scanAndShowMidiInputs();
        else status("MIDI PERMISSION DENIED", false);
    }

    private void scanAndShowMidiInputs() {
        scannedBluetooth.clear();
        status("SCANNING MIDI...", false);
        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) {
            showChoices();
            return;
        }
        BluetoothLeScanner scanner = bluetoothAdapter.getBluetoothLeScanner();
        if (scanner == null) { showChoices(); return; }
        ScanFilter filter = new ScanFilter.Builder().setServiceUuid(ParcelUuid.fromString(BLE_MIDI_SERVICE)).build();
        ScanSettings settings = new ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).build();
        ScanCallback callback = new ScanCallback() {
            @Override public void onScanResult(int type, ScanResult result) {
                BluetoothDevice d = result.getDevice();
                scannedBluetooth.put(d.getAddress(), d);
            }
            @Override public void onBatchScanResults(List<ScanResult> results) {
                for (ScanResult r : results) scannedBluetooth.put(r.getDevice().getAddress(), r.getDevice());
            }
        };
        try {
            scanner.startScan(java.util.Collections.singletonList(filter), settings, callback);
            main.postDelayed(() -> {
                try { scanner.stopScan(callback); } catch (SecurityException ignored) {}
                showChoices();
            }, 3500);
        } catch (SecurityException e) { showChoices(); }
    }

    private void rebuildChoices() {
        choices.clear();
        for (MidiDeviceInfo info : midiManager.getDevices()) {
            String name = info.getProperties().getString(MidiDeviceInfo.PROPERTY_NAME);
            if (name == null) name = info.getProperties().getString(MidiDeviceInfo.PROPERTY_PRODUCT);
            if (name == null) name = "MIDI " + info.getId();
            for (MidiDeviceInfo.PortInfo port : info.getPorts()) {
                if (port.getType() == MidiDeviceInfo.PortInfo.TYPE_OUTPUT)
                    choices.add(Choice.port(info, port.getPortNumber(), name + " — " + (port.getName() == null ? "Input " + (port.getPortNumber() + 1) : port.getName())));
            }
        }
        for (BluetoothDevice device : scannedBluetooth.values()) {
            String name;
            try { name = device.getName(); } catch (SecurityException e) { name = null; }
            choices.add(Choice.bluetooth(device, "Bluetooth MIDI — " + (name == null ? device.getAddress() : name)));
        }
    }

    private void showChoices() {
        rebuildChoices();
        if (choices.isEmpty()) {
            new AlertDialog.Builder(this).setTitle("MIDI INPUT")
                    .setMessage("No MIDI controller was found. Turn on the GO:88 Bluetooth MIDI function or connect USB MIDI, then try again.")
                    .setPositiveButton("TRY AGAIN", (d, w) -> scanAndShowMidiInputs())
                    .setNeutralButton("BLUETOOTH SETTINGS", (d, w) -> startActivity(new Intent(Settings.ACTION_BLUETOOTH_SETTINGS)))
                    .setNegativeButton("CLOSE", null).show();
            status("MIDI INPUT", false);
            return;
        }
        String[] labels = new String[choices.size()];
        for (int i = 0; i < choices.size(); i++) labels[i] = choices.get(i).label;
        new AlertDialog.Builder(this).setTitle("MIDI INPUT").setItems(labels, (dialog, which) -> connectChoice(choices.get(which)))
                .setNegativeButton("CANCEL", null).show();
    }

    private void connectChoice(Choice choice) {
        if (choice.bluetooth != null) openBluetoothMidi(choice.bluetooth, choice.label);
        else openMidiDevice(choice.info, choice.port, choice.label);
    }

    private void openMidiDevice(MidiDeviceInfo info, int port, String label) {
        closeOpenMidi(false);
        midiManager.openDevice(info, device -> finishOpen(device, port, label), main);
    }

    private void openBluetoothMidi(BluetoothDevice bluetooth, String label) {
        closeOpenMidi(false);
        try {
            midiManager.openBluetoothDevice(bluetooth, device -> {
                if (device == null) { status("BLUETOOTH MIDI FAILED", false); return; }
                int port = firstOutputPort(device.getInfo());
                if (port < 0) { try { device.close(); } catch (IOException ignored) {} status("NO MIDI PORT", false); return; }
                preferences.edit().putString("bluetooth", bluetooth.getAddress()).apply();
                finishOpen(device, port, label);
            }, main);
        } catch (SecurityException e) { status("MIDI PERMISSION REQUIRED", false); }
    }

    private int firstOutputPort(MidiDeviceInfo info) {
        for (MidiDeviceInfo.PortInfo p : info.getPorts()) if (p.getType() == MidiDeviceInfo.PortInfo.TYPE_OUTPUT) return p.getPortNumber();
        return -1;
    }

    private void finishOpen(MidiDevice device, int port, String label) {
        if (device == null) { status("MIDI OPEN FAILED", false); return; }
        MidiOutputPort opened = device.openOutputPort(port);
        if (opened == null) { try { device.close(); } catch (IOException ignored) {} status("MIDI PORT FAILED", false); return; }
        opened.connect(midiReceiver);
        openDevice = device; openPort = opened;
        preferences.edit().putInt("device", device.getInfo().getId()).putInt("port", port).apply();
        status(label, true);
    }

    private void reconnectRememberedMidi() {
        int id = preferences.getInt("device", -1), port = preferences.getInt("port", -1);
        if (id < 0 || port < 0) return;
        for (MidiDeviceInfo info : midiManager.getDevices()) if (info.getId() == id) { openMidiDevice(info, port, "MIDI ON"); return; }
    }

    private void disconnectMidi() { closeOpenMidi(true); }
    private void closeOpenMidi(boolean notify) {
        try { if (openPort != null) openPort.disconnect(midiReceiver); } catch (Exception ignored) {}
        try { if (openPort != null) openPort.close(); } catch (IOException ignored) {}
        try { if (openDevice != null) openDevice.close(); } catch (IOException ignored) {}
        openPort = null; openDevice = null;
        if (notify) status("MIDI INPUT", false);
    }

    private JSONArray midiChoicesJson() {
        rebuildChoices(); JSONArray result = new JSONArray();
        for (Choice c : choices) { JSONObject o = new JSONObject(); try { o.put("name", c.label); } catch (Exception ignored) {} result.put(o); }
        return result;
    }

    private void publishDeviceChange() { runJs("window.QuadSynthNativeMidi&&window.QuadSynthNativeMidi.devicesChanged(" + midiChoicesJson() + ");"); }
    private void status(String text, boolean connected) { runJs("window.QuadSynthNativeMidi&&window.QuadSynthNativeMidi.status(" + JSONObject.quote(text) + "," + connected + ");"); }
    private void runJs(String script) { main.post(() -> { if (webView != null) webView.evaluateJavascript(script, null); }); }

    @Override protected void onPause() {
        runJs("window.QuadSynthNativeMidi&&window.QuadSynthNativeMidi.panic();");
        super.onPause();
    }

    @Override protected void onResume() {
        super.onResume();
        runJs("window.warmAudioEngine&&window.warmAudioEngine();");
    }

    @Override protected void onDestroy() {
        closeOpenMidi(false);
        midiManager.unregisterDeviceCallback(deviceCallback);
        webView.removeJavascriptInterface("AndroidMidi");
        webView.destroy(); webView = null;
        super.onDestroy();
    }

    private static final class Choice {
        final MidiDeviceInfo info; final int port; final BluetoothDevice bluetooth; final String label;
        private Choice(MidiDeviceInfo i, int p, BluetoothDevice b, String l) { info=i;port=p;bluetooth=b;label=l; }
        static Choice port(MidiDeviceInfo i,int p,String l){return new Choice(i,p,null,l);}
        static Choice bluetooth(BluetoothDevice b,String l){return new Choice(null,-1,b,l);}
    }
}

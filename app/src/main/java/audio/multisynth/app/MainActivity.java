package audio.multisynth.app;

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
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class MainActivity extends Activity {
    private static final int MIDI_PERMISSION_REQUEST = 44;
    private static final int MIC_PERMISSION_REQUEST = 45;
    private static final int FILE_CHOOSER_REQUEST = 46;
    private static final String BLE_MIDI_SERVICE = "03b80e5a-ede8-4b33-a751-6ce34ec4c700";
    private static final String APP_HOST = "appassets.androidplatform.net";
    private static final String APP_PREFIX = "/assets/";
    private static final String APP_START = "https://" + APP_HOST + APP_PREFIX + "index.html";

    private WebView webView;
    private MidiManager midiManager;
    private BluetoothAdapter bluetoothAdapter;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final List<Choice> choices = new ArrayList<>();
    private final Map<String, BluetoothDevice> scannedBluetooth = new LinkedHashMap<>();
    private MidiDevice openDevice;
    private MidiOutputPort openPort;
    private SharedPreferences preferences;
    private ValueCallback<Uri[]> fileChooserCallback;
    private PermissionRequest pendingMicRequest;

    private final MidiReceiver midiReceiver = new MidiReceiver() {
        @Override public void onSend(byte[] data, int offset, int count, long timestamp) {
            JSONArray bytes = new JSONArray();
            for (int i = offset; i < offset + count; i++) bytes.put(data[i] & 0xff);
            runJs("window.MultiSynthNativeMidi&&window.MultiSynthNativeMidi.receive(" + bytes + ");");
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
        preferences = getSharedPreferences("multisynth-midi", MODE_PRIVATE);
        midiManager = (MidiManager) getSystemService(Context.MIDI_SERVICE);
        BluetoothManager bm = (BluetoothManager) getSystemService(Context.BLUETOOTH_SERVICE);
        bluetoothAdapter = bm == null ? null : bm.getAdapter();
        webView = new WebView(this);
        setContentView(webView);
        configureWebView();
        midiManager.registerDeviceCallback(deviceCallback, main);
        webView.loadUrl(APP_START);
    }

    private void configureWebView() {
        webView.setLayerType(android.view.View.LAYER_TYPE_HARDWARE, null);
        if (Build.VERSION.SDK_INT >= 26) webView.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT, false);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setDatabaseEnabled(true);
        webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
        webView.getSettings().setOffscreenPreRaster(true);
        webView.getSettings().setAllowFileAccess(false);
        webView.getSettings().setAllowContentAccess(true);

        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileChooserCallback != null) fileChooserCallback.onReceiveValue(null);
                fileChooserCallback = callback;
                Intent intent;
                try { intent = params.createIntent(); }
                catch (Exception e) { intent = new Intent(Intent.ACTION_OPEN_DOCUMENT); intent.addCategory(Intent.CATEGORY_OPENABLE); intent.setType("audio/*"); }
                if (intent.getType() == null || "*/*".equals(intent.getType())) intent.setType("audio/*");
                try { startActivityForResult(intent, FILE_CHOOSER_REQUEST); }
                catch (Exception e) { fileChooserCallback.onReceiveValue(null); fileChooserCallback = null; }
                return true;
            }

            @Override public void onPermissionRequest(PermissionRequest request) {
                runOnUiThread(() -> {
                    boolean wantsMic = false;
                    for (String resource : request.getResources()) if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) wantsMic = true;
                    if (!wantsMic) { request.deny(); return; }
                    if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                        request.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
                    } else {
                        pendingMicRequest = request;
                        requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, MIC_PERMISSION_REQUEST);
                    }
                });
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse local = localAssetResponse(request.getUrl());
                return local != null ? local : super.shouldInterceptRequest(view, request);
            }

            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                return !("https".equals(uri.getScheme()) && APP_HOST.equals(uri.getHost()) && uri.getPath() != null && uri.getPath().startsWith(APP_PREFIX));
            }

            @Override public void onPageFinished(WebView view, String url) {
                runJs("window.warmAudioEngine&&window.warmAudioEngine();");
                installAutoPersistence();
                publishDeviceChange();
                reconnectRememberedMidi();
            }
        });
        webView.addJavascriptInterface(new Bridge(), "AndroidMidi");
    }

    private WebResourceResponse localAssetResponse(Uri uri) {
        if (uri == null || !"https".equals(uri.getScheme()) || !APP_HOST.equals(uri.getHost())) return null;
        String path = uri.getPath();
        if (path == null || !path.startsWith(APP_PREFIX)) return null;
        String assetPath = path.substring(APP_PREFIX.length());
        if (assetPath.isEmpty() || assetPath.contains("..")) return null;
        try {
            InputStream stream = getAssets().open(assetPath);
            return new WebResourceResponse(mimeType(assetPath), "UTF-8", stream);
        } catch (IOException e) {
            return null;
        }
    }

    private String mimeType(String path) {
        String p = path.toLowerCase();
        if (p.endsWith(".html") || p.endsWith(".htm")) return "text/html";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".js")) return "application/javascript";
        if (p.endsWith(".json")) return "application/json";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
        if (p.endsWith(".webp")) return "image/webp";
        if (p.endsWith(".mp3")) return "audio/mpeg";
        if (p.endsWith(".mp4")) return "video/mp4";
        return "application/octet-stream";
    }

    private void installAutoPersistence() {
        String js = "(function(){if(window.__multiSynthAutoSave)return;window.__multiSynthAutoSave=true;" +
                "var key='multisynth-autostate:'+location.pathname;" +
                "function id(e,i){return e.id||e.name||('auto-'+i)};" +
                "function save(){try{var a=[];document.querySelectorAll('input,select,textarea').forEach(function(e,i){if(e.type==='file')return;a.push({k:id(e,i),v:(e.type==='checkbox'||e.type==='radio')?e.checked:e.value,t:e.type});});localStorage.setItem(key,JSON.stringify(a));}catch(x){}}" +
                "function restore(){try{var raw=localStorage.getItem(key);if(!raw)return;var a=JSON.parse(raw),els=[].slice.call(document.querySelectorAll('input,select,textarea'));a.forEach(function(s){var e=els.find(function(x,i){return id(x,i)===s.k});if(!e||e.type==='file')return;if(e.type==='checkbox'||e.type==='radio')e.checked=!!s.v;else e.value=s.v;try{e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}catch(x){}});}catch(x){}}" +
                "restore();document.addEventListener('input',save,true);document.addEventListener('change',save,true);document.addEventListener('click',function(){setTimeout(save,0)},true);window.addEventListener('pagehide',save);window.MultiSynthSaveNow=save;})();";
        runJs(js);
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != FILE_CHOOSER_REQUEST || fileChooserCallback == null) return;
        Uri[] result = null;
        if (resultCode == RESULT_OK) result = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
        fileChooserCallback.onReceiveValue(result);
        fileChooserCallback = null;
    }

    private final class Bridge {
        @JavascriptInterface public void chooseInput() { runOnUiThread(MainActivity.this::beginMidiSelection); }
        @JavascriptInterface public void disconnect() { runOnUiThread(MainActivity.this::disconnectMidi); }
        @JavascriptInterface public void openAudioSettings() { runOnUiThread(() -> startActivity(new Intent(Settings.ACTION_BLUETOOTH_SETTINGS))); }
        @JavascriptInterface public String listInputs() { return midiChoicesJson().toString(); }
    }

    private boolean hasBluetoothPermission() {
        if (Build.VERSION.SDK_INT < 31) return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        return checkSelfPermission(Manifest.permission.BLUETOOTH_SCAN) == PackageManager.PERMISSION_GRANTED && checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED;
    }

    private void beginMidiSelection() {
        if (!hasBluetoothPermission()) {
            if (Build.VERSION.SDK_INT >= 31) requestPermissions(new String[]{Manifest.permission.BLUETOOTH_SCAN, Manifest.permission.BLUETOOTH_CONNECT}, MIDI_PERMISSION_REQUEST);
            else requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION}, MIDI_PERMISSION_REQUEST);
            return;
        }
        scanAndShowMidiInputs();
    }

    @Override public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(requestCode, permissions, results);
        if (requestCode == MIC_PERMISSION_REQUEST) {
            if (pendingMicRequest != null) {
                if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED) pendingMicRequest.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
                else pendingMicRequest.deny();
                pendingMicRequest = null;
            }
            return;
        }
        if (requestCode == MIDI_PERMISSION_REQUEST) {
            if (hasBluetoothPermission()) scanAndShowMidiInputs();
            else status("MIDI PERMISSION DENIED", false);
        }
    }

    private void scanAndShowMidiInputs() {
        scannedBluetooth.clear(); status("SCANNING MIDI...", false);
        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) { showChoices(); return; }
        BluetoothLeScanner scanner = bluetoothAdapter.getBluetoothLeScanner();
        if (scanner == null) { showChoices(); return; }
        ScanFilter filter = new ScanFilter.Builder().setServiceUuid(ParcelUuid.fromString(BLE_MIDI_SERVICE)).build();
        ScanSettings settings = new ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).build();
        ScanCallback callback = new ScanCallback() {
            @Override public void onScanResult(int type, ScanResult result) { BluetoothDevice d=result.getDevice(); scannedBluetooth.put(d.getAddress(),d); }
            @Override public void onBatchScanResults(List<ScanResult> results) { for(ScanResult r:results) scannedBluetooth.put(r.getDevice().getAddress(),r.getDevice()); }
        };
        try {
            scanner.startScan(java.util.Collections.singletonList(filter), settings, callback);
            main.postDelayed(() -> { try { scanner.stopScan(callback); } catch (SecurityException ignored) {} showChoices(); }, 3500);
        } catch (SecurityException e) { showChoices(); }
    }

    private void rebuildChoices() {
        choices.clear();
        for (MidiDeviceInfo info : midiManager.getDevices()) {
            String name=info.getProperties().getString(MidiDeviceInfo.PROPERTY_NAME);
            if(name==null)name=info.getProperties().getString(MidiDeviceInfo.PROPERTY_PRODUCT);
            if(name==null)name="MIDI "+info.getId();
            for(MidiDeviceInfo.PortInfo port:info.getPorts()) if(port.getType()==MidiDeviceInfo.PortInfo.TYPE_OUTPUT) choices.add(Choice.port(info,port.getPortNumber(),name+" — "+(port.getName()==null?"Input "+(port.getPortNumber()+1):port.getName())));
        }
        for(BluetoothDevice device:scannedBluetooth.values()) {
            String name; try{name=device.getName();}catch(SecurityException e){name=null;}
            choices.add(Choice.bluetooth(device,"Bluetooth MIDI — "+(name==null?device.getAddress():name)));
        }
    }

    private void showChoices() {
        rebuildChoices();
        if(choices.isEmpty()) {
            new AlertDialog.Builder(this).setTitle("MIDI INPUT").setMessage("No MIDI controller was found. Turn on the GO:88 Bluetooth MIDI function or connect USB MIDI, then try again.").setPositiveButton("TRY AGAIN",(d,w)->scanAndShowMidiInputs()).setNeutralButton("BLUETOOTH SETTINGS",(d,w)->startActivity(new Intent(Settings.ACTION_BLUETOOTH_SETTINGS))).setNegativeButton("CLOSE",null).show();
            status("MIDI INPUT",false); return;
        }
        String[] labels=new String[choices.size()]; for(int i=0;i<choices.size();i++)labels[i]=choices.get(i).label;
        new AlertDialog.Builder(this).setTitle("MIDI INPUT").setItems(labels,(dialog,which)->connectChoice(choices.get(which))).setNegativeButton("CANCEL",null).show();
    }

    private void connectChoice(Choice choice){if(choice.bluetooth!=null)openBluetoothMidi(choice.bluetooth,choice.label);else openMidiDevice(choice.info,choice.port,choice.label);}
    private void openMidiDevice(MidiDeviceInfo info,int port,String label){closeOpenMidi(false);midiManager.openDevice(info,device->finishOpen(device,port,label),main);}
    private void openBluetoothMidi(BluetoothDevice bluetooth,String label){closeOpenMidi(false);try{midiManager.openBluetoothDevice(bluetooth,device->{if(device==null){status("BLUETOOTH MIDI FAILED",false);return;}int port=firstOutputPort(device.getInfo());if(port<0){try{device.close();}catch(IOException ignored){}status("NO MIDI PORT",false);return;}preferences.edit().putString("bluetooth",bluetooth.getAddress()).apply();finishOpen(device,port,label);},main);}catch(SecurityException e){status("MIDI PERMISSION REQUIRED",false);}}
    private int firstOutputPort(MidiDeviceInfo info){for(MidiDeviceInfo.PortInfo p:info.getPorts())if(p.getType()==MidiDeviceInfo.PortInfo.TYPE_OUTPUT)return p.getPortNumber();return -1;}
    private void finishOpen(MidiDevice device,int port,String label){if(device==null){status("MIDI OPEN FAILED",false);return;}MidiOutputPort opened=device.openOutputPort(port);if(opened==null){try{device.close();}catch(IOException ignored){}status("MIDI PORT FAILED",false);return;}opened.connect(midiReceiver);openDevice=device;openPort=opened;preferences.edit().putInt("device",device.getInfo().getId()).putInt("port",port).apply();status(label,true);}
    private void reconnectRememberedMidi(){int id=preferences.getInt("device",-1),port=preferences.getInt("port",-1);if(id<0||port<0)return;for(MidiDeviceInfo info:midiManager.getDevices())if(info.getId()==id){openMidiDevice(info,port,"MIDI ON");return;}}
    private void disconnectMidi(){closeOpenMidi(true);}
    private void closeOpenMidi(boolean notify){try{if(openPort!=null)openPort.disconnect(midiReceiver);}catch(Exception ignored){}try{if(openPort!=null)openPort.close();}catch(IOException ignored){}try{if(openDevice!=null)openDevice.close();}catch(IOException ignored){}openPort=null;openDevice=null;if(notify)status("MIDI INPUT",false);}
    private JSONArray midiChoicesJson(){rebuildChoices();JSONArray result=new JSONArray();for(Choice c:choices){JSONObject o=new JSONObject();try{o.put("name",c.label);}catch(Exception ignored){}result.put(o);}return result;}
    private void publishDeviceChange(){runJs("window.MultiSynthNativeMidi&&window.MultiSynthNativeMidi.devicesChanged("+midiChoicesJson()+");");}
    private void status(String text,boolean connected){runJs("window.MultiSynthNativeMidi&&window.MultiSynthNativeMidi.status("+JSONObject.quote(text)+","+connected+");");}
    private void runJs(String script){main.post(()->{if(webView!=null)webView.evaluateJavascript(script,null);});}

    @Override protected void onPause(){runJs("window.MultiSynthSaveNow&&window.MultiSynthSaveNow();window.MultiSynthNativeMidi&&window.MultiSynthNativeMidi.panic();");super.onPause();}
    @Override protected void onResume(){super.onResume();runJs("window.warmAudioEngine&&window.warmAudioEngine();");}
    @Override public void onBackPressed(){if(webView!=null&&webView.canGoBack())webView.goBack();else super.onBackPressed();}
    @Override protected void onDestroy(){closeOpenMidi(false);if(midiManager!=null)midiManager.unregisterDeviceCallback(deviceCallback);if(fileChooserCallback!=null){fileChooserCallback.onReceiveValue(null);fileChooserCallback=null;}if(pendingMicRequest!=null){pendingMicRequest.deny();pendingMicRequest=null;}if(webView!=null){webView.removeJavascriptInterface("AndroidMidi");webView.destroy();webView=null;}super.onDestroy();}

    private static final class Choice {
        final MidiDeviceInfo info;final int port;final BluetoothDevice bluetooth;final String label;
        private Choice(MidiDeviceInfo i,int p,BluetoothDevice b,String l){info=i;port=p;bluetooth=b;label=l;}
        static Choice port(MidiDeviceInfo i,int p,String l){return new Choice(i,p,null,l);}
        static Choice bluetooth(BluetoothDevice b,String l){return new Choice(null,-1,b,l);}
    }
}

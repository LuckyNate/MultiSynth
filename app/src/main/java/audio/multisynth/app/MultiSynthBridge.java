package audio.multisynth.app;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * Shared native services for every MultiSynth HTML instrument.
 *
 * JS name: AndroidBridge
 * Events: window.dispatchEvent(new CustomEvent('multisynth-native', {detail:{type,payload}}))
 *
 * MainActivity owns lifecycle-sensitive MIDI/mic implementation; this class centralizes
 * common Android capabilities so future instruments do not need native code changes.
 */
public final class MultiSynthBridge {
    public interface Host {
        boolean startMic();
        void stopMic();
        String listMidiInputs();
        void chooseMidiInput();
        void disconnectMidi();
        void openFile(String mimeType);
        void saveFile(String suggestedName, String mimeType, byte[] data);
    }

    private final Activity activity;
    private final WebView webView;
    private final Host host;
    private final SharedPreferences prefs;
    private final AudioManager audio;
    private AudioFocusRequest focusRequest;

    public MultiSynthBridge(Activity activity, WebView webView, Host host) {
        this.activity = activity;
        this.webView = webView;
        this.host = host;
        this.prefs = activity.getSharedPreferences("multisynth-bridge", Context.MODE_PRIVATE);
        this.audio = (AudioManager) activity.getSystemService(Context.AUDIO_SERVICE);
    }

    private void event(String type, String payloadJson) {
        final String js = "window.dispatchEvent(new CustomEvent('multisynth-native',{detail:{type:" +
                JSONObject.quote(type) + ",payload:" + (payloadJson == null ? "null" : payloadJson) + "}}));";
        activity.runOnUiThread(() -> webView.evaluateJavascript(js, null));
    }

    @JavascriptInterface public String version() { return "1.0.0"; }
    @JavascriptInterface public int sdk() { return Build.VERSION.SDK_INT; }

    @JavascriptInterface public boolean hasMicrophonePermission() {
        return activity.checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
    }

    @JavascriptInterface public void requestMicrophonePermission() {
        activity.runOnUiThread(() -> activity.requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, 144));
    }

    @JavascriptInterface public boolean hasBluetoothPermission() {
        if (Build.VERSION.SDK_INT >= 31) {
            return activity.checkSelfPermission(Manifest.permission.BLUETOOTH_SCAN) == PackageManager.PERMISSION_GRANTED &&
                    activity.checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED;
        }
        return activity.checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    @JavascriptInterface public void requestBluetoothPermission() {
        activity.runOnUiThread(() -> {
            if (Build.VERSION.SDK_INT >= 31) {
                activity.requestPermissions(new String[]{Manifest.permission.BLUETOOTH_SCAN, Manifest.permission.BLUETOOTH_CONNECT}, 145);
            } else {
                activity.requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION}, 145);
            }
        });
    }

    @JavascriptInterface public boolean startMic() { return host.startMic(); }
    @JavascriptInterface public void stopMic() { host.stopMic(); }
    @JavascriptInterface public String listMidiInputs() { return host.listMidiInputs(); }
    @JavascriptInterface public void chooseMidiInput() { activity.runOnUiThread(host::chooseMidiInput); }
    @JavascriptInterface public void disconnectMidi() { activity.runOnUiThread(host::disconnectMidi); }

    @JavascriptInterface public void openBluetoothSettings() {
        activity.runOnUiThread(() -> activity.startActivity(new Intent(Settings.ACTION_BLUETOOTH_SETTINGS)));
    }

    @JavascriptInterface public void openAudioSettings() {
        activity.runOnUiThread(() -> activity.startActivity(new Intent(Settings.ACTION_SOUND_SETTINGS)));
    }

    @JavascriptInterface public void openFile(String mimeType) {
        activity.runOnUiThread(() -> host.openFile(mimeType == null || mimeType.isEmpty() ? "*/*" : mimeType));
    }

    @JavascriptInterface public void saveBase64File(String suggestedName, String mimeType, String base64) {
        try {
            byte[] data = Base64.decode(base64, Base64.DEFAULT);
            activity.runOnUiThread(() -> host.saveFile(
                    suggestedName == null || suggestedName.isEmpty() ? "multisynth.bin" : suggestedName,
                    mimeType == null || mimeType.isEmpty() ? "application/octet-stream" : mimeType,
                    data));
        } catch (Exception e) {
            event("file-error", JSONObject.quote("Invalid base64 data"));
        }
    }

    @JavascriptInterface public void putString(String key, String value) {
        if (key != null) prefs.edit().putString(key, value == null ? "" : value).apply();
    }

    @JavascriptInterface public String getString(String key, String fallback) {
        return key == null ? fallback : prefs.getString(key, fallback);
    }

    @JavascriptInterface public void remove(String key) { if (key != null) prefs.edit().remove(key).apply(); }
    @JavascriptInterface public void clearStorage() { prefs.edit().clear().apply(); }

    @JavascriptInterface public int musicVolume() {
        return audio == null ? 0 : audio.getStreamVolume(AudioManager.STREAM_MUSIC);
    }

    @JavascriptInterface public int musicVolumeMax() {
        return audio == null ? 0 : audio.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
    }

    @JavascriptInterface public void setMusicVolume(int value) {
        if (audio == null) return;
        int v = Math.max(0, Math.min(value, audio.getStreamMaxVolume(AudioManager.STREAM_MUSIC)));
        audio.setStreamVolume(AudioManager.STREAM_MUSIC, v, 0);
    }

    @JavascriptInterface public boolean requestAudioFocus() {
        if (audio == null) return false;
        try {
            if (Build.VERSION.SDK_INT >= 26) {
                focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                        .setAudioAttributes(new AudioAttributes.Builder()
                                .setUsage(AudioAttributes.USAGE_MEDIA)
                                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build())
                        .setOnAudioFocusChangeListener(change -> event("audio-focus", Integer.toString(change)))
                        .build();
                return audio.requestAudioFocus(focusRequest) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
            }
            return audio.requestAudioFocus(change -> event("audio-focus", Integer.toString(change)),
                    AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
        } catch (Exception e) { return false; }
    }

    @JavascriptInterface public void abandonAudioFocus() {
        if (audio == null) return;
        try { if (Build.VERSION.SDK_INT >= 26 && focusRequest != null) audio.abandonAudioFocusRequest(focusRequest); }
        catch (Exception ignored) {}
        focusRequest = null;
    }

    /** Called by MainActivity after a document picker result. */
    public void deliverOpenedFile(Uri uri) {
        if (uri == null) { event("file-cancel", "null"); return; }
        new Thread(() -> {
            try (InputStream in = activity.getContentResolver().openInputStream(uri);
                 ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                if (in == null) throw new Exception("Unable to open file");
                byte[] buf = new byte[32768];
                int n;
                while ((n = in.read(buf)) >= 0) out.write(buf, 0, n);
                JSONObject p = new JSONObject();
                p.put("uri", uri.toString());
                p.put("mime", activity.getContentResolver().getType(uri));
                p.put("base64", Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP));
                event("file-opened", p.toString());
            } catch (Exception e) { event("file-error", JSONObject.quote(e.getMessage())); }
        }, "MultiSynthFileRead").start();
    }

    /** Called by MainActivity after CREATE_DOCUMENT. */
    public void writeSavedFile(Uri uri, byte[] data) {
        if (uri == null) { event("file-save-cancel", "null"); return; }
        new Thread(() -> {
            try (OutputStream out = activity.getContentResolver().openOutputStream(uri, "w")) {
                if (out == null) throw new Exception("Unable to create file");
                out.write(data); out.flush();
                JSONObject p = new JSONObject(); p.put("uri", uri.toString()); p.put("bytes", data.length);
                event("file-saved", p.toString());
            } catch (Exception e) { event("file-error", JSONObject.quote(e.getMessage())); }
        }, "MultiSynthFileWrite").start();
    }
}

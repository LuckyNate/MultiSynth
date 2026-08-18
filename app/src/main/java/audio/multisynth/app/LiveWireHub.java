package audio.multisynth.app;

import android.util.Base64;
import android.webkit.WebView;

import org.json.JSONObject;

import java.lang.ref.WeakReference;

final class LiveWireHub {
    private static WeakReference<WebView> web = new WeakReference<>(null);

    private LiveWireHub() {}

    static synchronized void attach(WebView view) { web = new WeakReference<>(view); }
    static synchronized void detach(WebView view) {
        WebView current = web.get();
        if (current == view) web.clear();
    }

    private static void js(String script) {
        WebView view = web.get();
        if (view == null) return;
        view.post(() -> {
            try { view.evaluateJavascript(script, null); }
            catch (Exception ignored) {}
        });
    }

    static void status(String text) {
        js("window.MultiSynthLiveWire&&window.MultiSynthLiveWire.status(" + JSONObject.quote(text == null ? "" : text) + ");");
    }

    static void pcm(short[] src, int frames, int sampleRate) {
        if (src == null || frames <= 0) return;
        byte[] bytes = new byte[frames * 2];
        for (int i = 0, j = 0; i < frames; i++, j += 2) {
            int v = src[i];
            bytes[j] = (byte) (v & 0xff);
            bytes[j + 1] = (byte) ((v >>> 8) & 0xff);
        }
        String b64 = Base64.encodeToString(bytes, Base64.NO_WRAP);
        js("window.MultiSynthLiveWire&&window.MultiSynthLiveWire.receive(" + JSONObject.quote(b64) + "," + sampleRate + ");");
    }

    static void searchResult(int requestId, String json) {
        js("window.MultiSynthLiveWire&&window.MultiSynthLiveWire.searchResult(" + requestId + "," + JSONObject.quote(json == null ? "{\"items\":[]}" : json) + ");");
    }
}

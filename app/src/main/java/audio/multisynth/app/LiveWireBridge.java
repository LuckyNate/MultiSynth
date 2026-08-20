package audio.multisynth.app;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

final class LiveWireBridge {
    private final Activity activity;
    private final WebView webView;
    private final LiveWirePlayerHost playerHost;

    LiveWireBridge(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
        LiveWireHub.attach(webView);
        playerHost = new LiveWirePlayerHost(activity, this);
    }

    @JavascriptInterface public boolean startLiveWire() {
        if (Build.VERSION.SDK_INT < 29) { LiveWireHub.status("LIVE WIRE REQUIRES ANDROID 10+"); return false; }
        if (activity.checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            activity.runOnUiThread(() -> activity.requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, 147));
            LiveWireHub.status("RECORD AUDIO PERMISSION REQUIRED"); return false;
        }
        if (LiveWireProjectionService.isActive()) return true;
        activity.runOnUiThread(() -> { try { activity.startActivity(new Intent(activity, LiveWirePermissionActivity.class)); } catch (Exception e) { LiveWireHub.status("CAPTURE PERMISSION WINDOW FAILED"); } });
        return true;
    }

    @JavascriptInterface public void stopLiveWire() { LiveWireProjectionService.stop(activity); }
    @JavascriptInterface public void youtubeSearch(String query, int requestId, boolean random, int max) { YouTubeSearch.execute(query, requestId, random, max); }
    @JavascriptInterface public void liveWirePlay(String id) { playerHost.play(id); }
    @JavascriptInterface public void liveWirePause() { playerHost.pause(); }
    @JavascriptInterface public void liveWireResume() { playerHost.resume(); }
    @JavascriptInterface public void liveWireSeek(double seconds) { playerHost.seek(seconds); }
    @JavascriptInterface public void liveWirePlayerEvent(String type, String json) { activity.runOnUiThread(() -> webView.evaluateJavascript("window.MultiSynthLiveWire&&window.MultiSynthLiveWire.playerEvent(" + org.json.JSONObject.quote(type) + "," + org.json.JSONObject.quote(json) + ");", null)); }

    void destroy() { LiveWireHub.detach(webView); playerHost.destroy(); }
}

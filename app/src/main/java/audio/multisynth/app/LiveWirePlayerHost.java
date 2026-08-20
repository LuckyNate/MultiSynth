package audio.multisynth.app;

import android.app.Activity;
import android.graphics.Color;
import android.view.Gravity;
import android.view.ViewGroup;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

/** Persistent, attached YouTube playback surface owned by the Activity rather than a module editor iframe. */
final class LiveWirePlayerHost {
    private final Activity activity;
    private final WebView player;

    LiveWirePlayerHost(Activity activity) {
        this.activity = activity;
        player = new WebView(activity);
        player.setBackgroundColor(Color.TRANSPARENT);
        player.getSettings().setJavaScriptEnabled(true);
        player.getSettings().setDomStorageEnabled(true);
        player.getSettings().setMediaPlaybackRequiresUserGesture(false);
        player.setWebChromeClient(new WebChromeClient());
        player.setWebViewClient(new WebViewClient());
        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(2, 2, Gravity.TOP | Gravity.START);
        player.setAlpha(0.01f);
        activity.addContentView(player, lp);
        player.loadUrl("file:///android_asset/live-wire-host.html");
    }

    private void js(String code) { activity.runOnUiThread(() -> player.evaluateJavascript(code, null)); }
    void play(String id) { js("window.LiveWireHost&&LiveWireHost.play(" + org.json.JSONObject.quote(id) + ");"); }
    void pause() { js("window.LiveWireHost&&LiveWireHost.pause();"); }
    void resume() { js("window.LiveWireHost&&LiveWireHost.resume();"); }
    void seek(double seconds) { js("window.LiveWireHost&&LiveWireHost.seek(" + seconds + ");"); }
    void destroy() { activity.runOnUiThread(() -> { try { ((ViewGroup)player.getParent()).removeView(player); } catch (Exception ignored) {} player.destroy(); }); }
}

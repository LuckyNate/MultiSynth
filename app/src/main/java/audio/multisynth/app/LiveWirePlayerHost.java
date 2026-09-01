package audio.multisynth.app;

import android.app.Activity;
import android.graphics.Color;
import android.net.Uri;
import android.view.Gravity;
import android.view.ViewGroup;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import java.io.IOException;

/** Persistent, attached YouTube playback surface owned by the Activity rather than a module editor iframe. */
final class LiveWirePlayerHost {
    private static final String HOST="appassets.androidplatform.net", PREFIX="/assets/";
    private final Activity activity; private final WebView player;
    LiveWirePlayerHost(Activity activity, Object bridge) {
        this.activity=activity; player=new WebView(activity); player.setBackgroundColor(Color.TRANSPARENT);
        player.getSettings().setJavaScriptEnabled(true); player.getSettings().setDomStorageEnabled(true); player.getSettings().setMediaPlaybackRequiresUserGesture(false);
        player.addJavascriptInterface(bridge,"LiveWireAndroid"); player.setWebChromeClient(new WebChromeClient());
        player.setWebViewClient(new WebViewClient(){@Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){Uri u=request.getUrl();if(u!=null&&"https".equals(u.getScheme())&&HOST.equals(u.getHost())&&u.getPath()!=null&&u.getPath().startsWith(PREFIX)){String p=u.getPath().substring(PREFIX.length());if(!p.contains(".."))try{return new WebResourceResponse(p.endsWith(".html")?"text/html":"application/octet-stream","UTF-8",activity.getAssets().open(p));}catch(IOException ignored){}}return super.shouldInterceptRequest(view,request);}});
        FrameLayout.LayoutParams lp=new FrameLayout.LayoutParams(2,2,Gravity.TOP|Gravity.START); player.setAlpha(0.01f); activity.addContentView(player,lp); player.loadUrl("https://appassets.androidplatform.net/assets/live-wire-host.html");
    }
    private void js(String code){activity.runOnUiThread(()->player.evaluateJavascript(code,null));}
    void play(String id){js("window.LiveWireHost&&LiveWireHost.play("+org.json.JSONObject.quote(id)+");");}
    void pause(){js("window.LiveWireHost&&LiveWireHost.pause();");}
    void resume(){js("window.LiveWireHost&&LiveWireHost.resume();");}
    void stop(){js("window.LiveWireHost&&LiveWireHost.stop();");}
    void mute(boolean muted){js("window.LiveWireHost&&LiveWireHost.mute("+(muted?"true":"false")+");");}
    void seek(double seconds){js("window.LiveWireHost&&LiveWireHost.seek("+seconds+");");}
    void destroy(){activity.runOnUiThread(()->{try{player.evaluateJavascript("window.LiveWireHost&&LiveWireHost.stop();window.LiveWireHost&&LiveWireHost.mute(true);",null);}catch(Exception ignored){}try{((ViewGroup)player.getParent()).removeView(player);}catch(Exception ignored){}player.destroy();});}
}

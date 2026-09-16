package audio.multisynth.app;

import android.Manifest;
import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothClass;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.MediaRouter;
import android.os.Build;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

final class LiveWireBridge {
    private final Activity activity;
    private final WebView webView;

    LiveWireBridge(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
        LiveWireHub.attach(webView);
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
    @JavascriptInterface public void audioSourceSearch(String query, int requestId, boolean random, int max) {
        AudioSourceSearch.execute(query, requestId, random, max);
    }

    @JavascriptInterface public String audioRouteKind() {
        try {
            MediaRouter router = (MediaRouter) activity.getSystemService(Context.MEDIA_ROUTER_SERVICE);
            MediaRouter.RouteInfo route = router == null ? null : router.getSelectedRoute(MediaRouter.ROUTE_TYPE_LIVE_AUDIO);
            if (route == null || route.getDeviceType() != MediaRouter.RouteInfo.DEVICE_TYPE_BLUETOOTH) return "local";
            if (!hasBluetoothPermission()) return "bluetooth-unknown";
            String routeName = String.valueOf(route.getName(activity));
            BluetoothManager manager = (BluetoothManager) activity.getSystemService(Context.BLUETOOTH_SERVICE);
            BluetoothAdapter adapter = manager == null ? null : manager.getAdapter();
            if (adapter == null) return "bluetooth-unknown";
            for (BluetoothDevice device : adapter.getBondedDevices()) {
                String name = null;
                try { name = device.getName(); } catch (SecurityException ignored) {}
                if (name == null || !name.equalsIgnoreCase(routeName)) continue;
                BluetoothClass klass = null;
                try { klass = device.getBluetoothClass(); } catch (SecurityException ignored) {}
                if (klass == null) return "bluetooth-unknown";
                return klass.getDeviceClass() == BluetoothClass.Device.AUDIO_VIDEO_CAR_AUDIO ? "bluetooth-car" : "bluetooth";
            }
            return "bluetooth-unknown";
        } catch (Exception ignored) {
            return "bluetooth-unknown";
        }
    }

    private boolean hasBluetoothPermission() {
        if (Build.VERSION.SDK_INT < 31) return activity.checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        return activity.checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED;
    }

    void destroy() {
        LiveWireProjectionService.stop(activity);
        LiveWireHub.detach(webView);
    }
}

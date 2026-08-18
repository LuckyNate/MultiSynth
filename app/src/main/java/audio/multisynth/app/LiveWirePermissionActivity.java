package audio.multisynth.app;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.media.projection.MediaProjectionManager;
import android.os.Build;
import android.os.Bundle;

public final class LiveWirePermissionActivity extends Activity {
    private static final int REQUEST_CAPTURE = 4702;

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        if (LiveWireProjectionService.isActive()) { finish(); return; }
        if (Build.VERSION.SDK_INT < 29) {
            LiveWireHub.status("LIVE WIRE REQUIRES ANDROID 10+");
            finish();
            return;
        }
        MediaProjectionManager manager = (MediaProjectionManager) getSystemService(Context.MEDIA_PROJECTION_SERVICE);
        try { startActivityForResult(manager.createScreenCaptureIntent(), REQUEST_CAPTURE); }
        catch (Exception e) { LiveWireHub.status("CAPTURE PERMISSION FAILED"); finish(); }
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQUEST_CAPTURE) return;
        if (resultCode != RESULT_OK || data == null) {
            LiveWireHub.status("CAPTURE PERMISSION DENIED");
            finish();
            return;
        }
        Intent service = new Intent(this, LiveWireProjectionService.class)
                .setAction(LiveWireProjectionService.ACTION_START)
                .putExtra(LiveWireProjectionService.EXTRA_RESULT_CODE, resultCode)
                .putExtra(LiveWireProjectionService.EXTRA_RESULT_DATA, data);
        try {
            if (Build.VERSION.SDK_INT >= 26) startForegroundService(service); else startService(service);
        } catch (Exception e) {
            LiveWireHub.status("CAPTURE SERVICE FAILED · " + (e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage()));
        }
        finish();
    }
}

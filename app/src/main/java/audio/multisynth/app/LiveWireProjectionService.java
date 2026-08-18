package audio.multisynth.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.projection.MediaProjection;
import android.media.projection.MediaProjectionManager;
import android.os.Build;
import android.os.IBinder;

public final class LiveWireProjectionService extends Service {
    static final String ACTION_START = "audio.multisynth.livewire.START";
    static final String ACTION_STOP = "audio.multisynth.livewire.STOP";
    static final String ACTION_VALVE = "audio.multisynth.livewire.VALVE";
    static final String EXTRA_RESULT_CODE = "resultCode";
    static final String EXTRA_RESULT_DATA = "resultData";
    static final String EXTRA_VALVE = "valve";
    private static final String CHANNEL = "live-wire-capture";
    private static final int NOTIFICATION_ID = 4701;
    private static volatile boolean active;

    private final LiveWireCapture capture = new LiveWireCapture();

    static boolean isActive() { return active; }

    static void stop(Context context) {
        try { context.startService(new Intent(context, LiveWireProjectionService.class).setAction(ACTION_STOP)); }
        catch (Exception ignored) {}
    }

    static void setValve(Context context, boolean open) {
        try { context.startService(new Intent(context, LiveWireProjectionService.class).setAction(ACTION_VALVE).putExtra(EXTRA_VALVE, open)); }
        catch (Exception ignored) {}
    }

    @Override public void onCreate() {
        super.onCreate();
        createChannel();
    }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent == null ? null : intent.getAction();
        if (ACTION_STOP.equals(action)) {
            capture.stop();
            active = false;
            stopForeground(true);
            stopSelf();
            LiveWireHub.status("PLAYBACK CAPTURE OFF");
            return START_NOT_STICKY;
        }
        if (ACTION_VALVE.equals(action)) {
            capture.setValve(intent.getBooleanExtra(EXTRA_VALVE, false));
            return START_NOT_STICKY;
        }
        if (!ACTION_START.equals(action)) return START_NOT_STICKY;

        startProjectionForeground();
        if (active && capture.isRunning()) return START_NOT_STICKY;
        int resultCode = intent.getIntExtra(EXTRA_RESULT_CODE, 0);
        Intent resultData;
        if (Build.VERSION.SDK_INT >= 33) resultData = intent.getParcelableExtra(EXTRA_RESULT_DATA, Intent.class);
        else resultData = intent.getParcelableExtra(EXTRA_RESULT_DATA);
        if (resultData == null) {
            LiveWireHub.status("CAPTURE PERMISSION DATA MISSING");
            stopSelf();
            return START_NOT_STICKY;
        }
        try {
            MediaProjectionManager manager = (MediaProjectionManager) getSystemService(Context.MEDIA_PROJECTION_SERVICE);
            MediaProjection projection = manager.getMediaProjection(resultCode, resultData);
            active = capture.start(this, projection);
            if (!active) stopSelf();
        } catch (Exception e) {
            active = false;
            LiveWireHub.status("CAPTURE START FAILED · " + (e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage()));
            stopSelf();
        }
        return START_NOT_STICKY;
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        NotificationChannel channel = new NotificationChannel(CHANNEL, "Live Wire capture", NotificationManager.IMPORTANCE_LOW);
        channel.setDescription("Live Wire playback audio carrier");
        nm.createNotificationChannel(channel);
    }

    private Notification notification() {
        Intent open = new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CHANNEL) : new Notification.Builder(this);
        return b.setContentTitle("MultiSynth · Live Wire")
                .setContentText("Playback carrier capture is active")
                .setSmallIcon(android.R.drawable.ic_btn_speak_now)
                .setOngoing(true)
                .setContentIntent(pi)
                .build();
    }

    private void startProjectionForeground() {
        Notification n = notification();
        if (Build.VERSION.SDK_INT >= 29) startForeground(NOTIFICATION_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION);
        else startForeground(NOTIFICATION_ID, n);
    }

    @Override public void onDestroy() {
        capture.stop();
        active = false;
        super.onDestroy();
    }

    @Override public IBinder onBind(Intent intent) { return null; }
}

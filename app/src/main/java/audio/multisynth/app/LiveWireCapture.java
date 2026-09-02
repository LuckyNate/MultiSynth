package audio.multisynth.app;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioPlaybackCaptureConfiguration;
import android.media.AudioRecord;
import android.media.AudioTrack;
import android.media.projection.MediaProjection;
import android.os.Process;

final class LiveWireCapture {
    static final int SAMPLE_RATE = 48000;
    private static final int CHUNK_FRAMES = 1024;

    private AudioRecord record;
    private AudioTrack valveTrack;
    private MediaProjection projection;
    private Thread thread;
    private volatile boolean running;
    private volatile boolean valve;

    synchronized boolean start(Context context, MediaProjection mediaProjection) {
        if (running) return true;
        if (mediaProjection == null) return false;
        try {
            projection = mediaProjection;
            projection.registerCallback(new MediaProjection.Callback() {
                @Override public void onStop() { LiveWireCapture.this.stop(); }
            }, null);

            AudioPlaybackCaptureConfiguration config = new AudioPlaybackCaptureConfiguration.Builder(projection)
                    .addMatchingUsage(AudioAttributes.USAGE_MEDIA)
                    .addMatchingUsage(AudioAttributes.USAGE_GAME)
                    .addMatchingUsage(AudioAttributes.USAGE_UNKNOWN)
                    .addMatchingUid(Process.myUid())
                    .build();

            AudioFormat format = new AudioFormat.Builder()
                    .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                    .setSampleRate(SAMPLE_RATE)
                    .setChannelMask(AudioFormat.CHANNEL_IN_MONO)
                    .build();
            int min = AudioRecord.getMinBufferSize(SAMPLE_RATE, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT);
            int bufferBytes = Math.max(min > 0 ? min : CHUNK_FRAMES * 4, CHUNK_FRAMES * 8);
            record = new AudioRecord.Builder()
                    .setAudioFormat(format)
                    .setBufferSizeInBytes(bufferBytes)
                    .setAudioPlaybackCaptureConfig(config)
                    .build();
            if (record.getState() != AudioRecord.STATE_INITIALIZED) throw new IllegalStateException("Audio playback capture failed to initialize");

            AudioAttributes monitorAttrs = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .setAllowedCapturePolicy(AudioAttributes.ALLOW_CAPTURE_BY_NONE)
                    .build();
            AudioFormat monitorFormat = new AudioFormat.Builder()
                    .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                    .setSampleRate(SAMPLE_RATE)
                    .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                    .build();
            int outMin = AudioTrack.getMinBufferSize(SAMPLE_RATE, AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_16BIT);
            valveTrack = new AudioTrack.Builder()
                    .setAudioAttributes(monitorAttrs)
                    .setAudioFormat(monitorFormat)
                    .setTransferMode(AudioTrack.MODE_STREAM)
                    .setBufferSizeInBytes(Math.max(outMin > 0 ? outMin : CHUNK_FRAMES * 4, CHUNK_FRAMES * 8))
                    .build();
            valveTrack.play();

            record.startRecording();
            running = true;
            thread = new Thread(this::loop, "LiveWireCapture");
            thread.start();
            LiveWireHub.status("PLAYBACK CAPTURE LIVE");
            return true;
        } catch (Exception e) {
            LiveWireHub.status("PLAYBACK CAPTURE FAILED · " + (e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage()));
            stop();
            return false;
        }
    }

    private void loop() {
        short[] pcm = new short[CHUNK_FRAMES];
        while (running) {
            AudioRecord r = record;
            if (r == null) break;
            int n;
            try { n = r.read(pcm, 0, pcm.length, AudioRecord.READ_BLOCKING); }
            catch (Exception e) { break; }
            if (n <= 0) continue;
            if (valve) {
                AudioTrack t = valveTrack;
                if (t != null) try { t.write(pcm, 0, n, AudioTrack.WRITE_NON_BLOCKING); } catch (Exception ignored) {}
            }
            LiveWireHub.pcm(pcm, n, SAMPLE_RATE);
        }
        if (running) LiveWireHub.status("PLAYBACK CAPTURE STOPPED");
    }

    void setValve(boolean open) { valve = open; }
    boolean isRunning() { return running; }

    synchronized void stop() {
        running = false;
        AudioRecord r = record; record = null;
        AudioTrack t = valveTrack; valveTrack = null;
        MediaProjection p = projection; projection = null;
        if (r != null) { try { r.stop(); } catch (Exception ignored) {} try { r.release(); } catch (Exception ignored) {} }
        if (t != null) { try { t.pause(); } catch (Exception ignored) {} try { t.flush(); } catch (Exception ignored) {} try { t.release(); } catch (Exception ignored) {} }
        if (p != null) try { p.stop(); } catch (Exception ignored) {}
        thread = null;
    }
}

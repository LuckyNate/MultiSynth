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
    private static final int BUFFER_SECONDS = 120;
    private static final int BUFFER_FRAMES = SAMPLE_RATE * BUFFER_SECONDS;
    private static final int LIVE_LATENCY_FRAMES = CHUNK_FRAMES * 3;

    private final Object bufferLock = new Object();
    private final short[] mediaBuffer = new short[BUFFER_FRAMES];

    private AudioRecord record;
    private AudioTrack valveTrack;
    private MediaProjection projection;
    private Thread captureThread;
    private Thread playbackThread;
    private volatile boolean running;
    private volatile boolean valve;
    private volatile double transportRate = 1.0;
    private long writeFrame;
    private double readFrame;
    private boolean readHeadValid;

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

            synchronized (bufferLock) {
                writeFrame = 0;
                readFrame = 0;
                readHeadValid = false;
            }
            transportRate = 1.0;
            record.startRecording();
            running = true;
            captureThread = new Thread(this::captureLoop, "LiveWireCapture");
            playbackThread = new Thread(this::playbackLoop, "LiveWireMediaBuffer");
            captureThread.start();
            playbackThread.start();
            LiveWireHub.status("PLAYBACK CAPTURE LIVE");
            return true;
        } catch (Exception e) {
            LiveWireHub.status("PLAYBACK CAPTURE FAILED · " + (e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage()));
            stop();
            return false;
        }
    }

    private void captureLoop() {
        short[] pcm = new short[CHUNK_FRAMES];
        while (running) {
            AudioRecord r = record;
            if (r == null) break;
            int n;
            try { n = r.read(pcm, 0, pcm.length, AudioRecord.READ_BLOCKING); }
            catch (Exception e) { break; }
            if (n <= 0) continue;
            synchronized (bufferLock) {
                for (int i = 0; i < n; i++) mediaBuffer[(int)((writeFrame + i) % BUFFER_FRAMES)] = pcm[i];
                writeFrame += n;
            }
            LiveWireHub.pcm(pcm, n, SAMPLE_RATE);
        }
        if (running) LiveWireHub.status("PLAYBACK CAPTURE STOPPED");
    }

    private void playbackLoop() {
        short[] out = new short[CHUNK_FRAMES];
        while (running) {
            if (!valve) {
                try { Thread.sleep(8); } catch (InterruptedException ignored) {}
                continue;
            }
            final double speed = transportRate;
            synchronized (bufferLock) {
                long newest = writeFrame;
                long oldest = Math.max(0, newest - BUFFER_FRAMES);
                if (!readHeadValid) {
                    readFrame = Math.max(oldest, newest - LIVE_LATENCY_FRAMES);
                    readHeadValid = true;
                }
                for (int i = 0; i < out.length; i++) {
                    if (Math.abs(speed) < 0.02) {
                        out[i] = 0;
                        continue;
                    }
                    if (readFrame < oldest) readFrame = oldest;
                    if (readFrame >= newest) readFrame = Math.max(oldest, newest - 1);
                    long a = (long)Math.floor(readFrame);
                    long b = Math.min(newest - 1, a + 1);
                    double frac = readFrame - a;
                    short sa = mediaBuffer[(int)(a % BUFFER_FRAMES)];
                    short sb = mediaBuffer[(int)(b % BUFFER_FRAMES)];
                    out[i] = (short)Math.max(Short.MIN_VALUE, Math.min(Short.MAX_VALUE, Math.round(sa + (sb - sa) * frac)));
                    readFrame += speed;
                }
            }
            AudioTrack t = valveTrack;
            if (t != null) {
                try { t.write(out, 0, out.length, AudioTrack.WRITE_BLOCKING); }
                catch (Exception ignored) {}
            }
        }
    }

    void setValve(boolean open) {
        synchronized (bufferLock) {
            if (open && !valve) {
                long oldest = Math.max(0, writeFrame - BUFFER_FRAMES);
                readFrame = Math.max(oldest, writeFrame - LIVE_LATENCY_FRAMES);
                readHeadValid = true;
            }
        }
        valve = open;
    }

    void setTransportRate(double rate) {
        if (!Double.isFinite(rate)) rate = 0.0;
        transportRate = Math.max(-8.0, Math.min(8.0, rate));
    }

    boolean isRunning() { return running; }

    synchronized void stop() {
        running = false;
        valve = false;
        AudioRecord r = record; record = null;
        AudioTrack t = valveTrack; valveTrack = null;
        MediaProjection p = projection; projection = null;
        if (r != null) { try { r.stop(); } catch (Exception ignored) {} try { r.release(); } catch (Exception ignored) {} }
        if (t != null) { try { t.pause(); } catch (Exception ignored) {} try { t.flush(); } catch (Exception ignored) {} try { t.release(); } catch (Exception ignored) {} }
        if (p != null) try { p.stop(); } catch (Exception ignored) {}
        Thread c = captureThread; captureThread = null;
        Thread o = playbackThread; playbackThread = null;
        if (c != null) c.interrupt();
        if (o != null) o.interrupt();
        synchronized (bufferLock) {
            writeFrame = 0;
            readFrame = 0;
            readHeadValid = false;
        }
    }
}

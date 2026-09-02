package audio.multisynth.app;

import android.text.Html;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

final class YouTubeSearch {
    private static final String[] RANDOM_SEEDS = {
            "sound", "music", "live", "demo", "field recording", "nature", "instrument", "radio",
            "street", "archive", "performance", "noise", "rhythm", "voice", "ambient", "session",
            "documentary", "tutorial", "jam", "drums", "synth", "guitar", "piano", "found sound"
    };
    private static final Random RNG = new Random();

    private YouTubeSearch() {}

    static void execute(String query, int requestId, boolean random, int max) {
        new Thread(() -> {
            try { LiveWireHub.searchResult(requestId, run(query, random, max)); }
            catch (Exception e) {
                try {
                    JSONObject out = new JSONObject();
                    out.put("error", e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage());
                    LiveWireHub.searchResult(requestId, out.toString());
                } catch (Exception ignored) { LiveWireHub.searchResult(requestId, "{\"error\":\"SEARCH FAILED\"}"); }
            }
        }, "LiveWireYouTubeSearch").start();
    }

    private static String run(String query, boolean random, int max) throws Exception {
        String key = BuildConfig.YOUTUBE_API_KEY;
        if (key == null || key.trim().isEmpty()) throw new IllegalStateException("YOUTUBE SEARCH KEY NOT CONFIGURED");
        int count = Math.max(5, Math.min(25, max));
        String q = query == null ? "" : query.trim();
        if (random || q.isEmpty()) q = RANDOM_SEEDS[RNG.nextInt(RANDOM_SEEDS.length)];
        String endpoint = "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video" +
                "&videoEmbeddable=true&videoSyndicated=true&videoLicense=creativeCommon&maxResults=" + count +
                "&q=" + URLEncoder.encode(q, StandardCharsets.UTF_8.name()) +
                "&key=" + URLEncoder.encode(key, StandardCharsets.UTF_8.name());
        HttpURLConnection c = (HttpURLConnection) new URL(endpoint).openConnection();
        c.setConnectTimeout(7000); c.setReadTimeout(9000); c.setRequestMethod("GET");
        int code = c.getResponseCode();
        InputStream stream = code >= 200 && code < 300 ? c.getInputStream() : c.getErrorStream();
        String body = read(stream);
        if (code < 200 || code >= 300) {
            String msg = "YOUTUBE SEARCH " + code;
            try { msg = new JSONObject(body).getJSONObject("error").optString("message", msg); } catch (Exception ignored) {}
            throw new IllegalStateException(msg);
        }
        JSONObject src = new JSONObject(body); JSONArray a = src.optJSONArray("items");
        List<JSONObject> items = new ArrayList<>();
        if (a != null) for (int i = 0; i < a.length(); i++) {
            JSONObject r = a.optJSONObject(i); if (r == null) continue;
            String id = r.optJSONObject("id") == null ? "" : r.optJSONObject("id").optString("videoId", "");
            if (id.length() != 11) continue;
            String title = r.optJSONObject("snippet") == null ? id : r.optJSONObject("snippet").optString("title", id);
            title = Html.fromHtml(title, Html.FROM_HTML_MODE_LEGACY).toString();
            JSONObject item = new JSONObject(); item.put("id", id); item.put("title", title); items.add(item);
        }
        if (random) Collections.shuffle(items, RNG);
        JSONArray outItems = new JSONArray(); for (JSONObject item : items) outItems.put(item);
        JSONObject out = new JSONObject(); out.put("items", outItems); return out.toString();
    }

    private static String read(InputStream in) throws Exception {
        if (in == null) return "";
        StringBuilder s = new StringBuilder();
        try (BufferedReader r = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            String line; while ((line = r.readLine()) != null) s.append(line);
        }
        return s.toString();
    }
}

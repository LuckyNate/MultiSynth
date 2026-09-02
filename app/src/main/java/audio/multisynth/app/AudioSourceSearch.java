package audio.multisynth.app;

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

final class AudioSourceSearch {
    private static final Random RNG = new Random();
    private static final String[] RANDOM_SEEDS = {
            "weird sound", "foley", "field recording", "glitch", "drone", "mechanical",
            "ambient", "noise", "synth", "creature", "space", "experimental"
    };

    private AudioSourceSearch() {}

    static void execute(String query, int requestId, boolean random, int max) {
        new Thread(() -> {
            try { LiveWireHub.searchResult(requestId, run(query, random, max)); }
            catch (Exception e) {
                try {
                    JSONObject out = new JSONObject();
                    out.put("error", e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage());
                    LiveWireHub.searchResult(requestId, out.toString());
                } catch (Exception ignored) { LiveWireHub.searchResult(requestId, "{\"error\":\"SOURCE SEARCH FAILED\"}"); }
            }
        }, "LiveWireFreesoundSearch").start();
    }

    private static String run(String query, boolean random, int max) throws Exception {
        int count = Math.max(4, Math.min(24, max));
        String q = query == null ? "" : query.trim();
        if (random || q.isEmpty()) q = RANDOM_SEEDS[RNG.nextInt(RANDOM_SEEDS.length)];

        String freeKey = BuildConfig.FREESOUND_API_KEY == null ? "" : BuildConfig.FREESOUND_API_KEY.trim();
        if (freeKey.isEmpty()) throw new IllegalStateException("FREESOUND KEY NOT CONFIGURED");

        List<JSONObject> results = searchFreesound(q, count, freeKey);
        if (random) Collections.shuffle(results, RNG);
        JSONArray items = new JSONArray();
        for (JSONObject item : results) items.put(item);
        JSONObject out = new JSONObject();
        out.put("items", items);
        return out.toString();
    }

    private static List<JSONObject> searchFreesound(String q, int max, String token) throws Exception {
        String endpoint = "https://freesound.org/apiv2/search/?query=" + enc(q) +
                "&page_size=" + max +
                "&fields=id,name,duration,license,previews" +
                "&token=" + enc(token);
        JSONObject root = getJson(endpoint);
        JSONArray results = root.optJSONArray("results");
        List<JSONObject> out = new ArrayList<>();
        if (results == null) return out;
        for (int i = 0; i < results.length(); i++) {
            JSONObject r = results.optJSONObject(i); if (r == null) continue;
            JSONObject previews = r.optJSONObject("previews"); if (previews == null) continue;
            String url = previews.optString("preview-hq-mp3", previews.optString("preview-lq-mp3", ""));
            if (url.isEmpty()) continue;
            JSONObject item = new JSONObject();
            item.put("id", "freesound:" + r.optString("id"));
            item.put("title", r.optString("name", "Freesound"));
            item.put("url", url);
            item.put("provider", "FREESOUND");
            item.put("license", r.optString("license", ""));
            item.put("duration", r.optDouble("duration", 0));
            out.add(item);
        }
        return out;
    }

    private static JSONObject getJson(String endpoint) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(endpoint).openConnection();
        c.setConnectTimeout(7000); c.setReadTimeout(10000); c.setRequestMethod("GET"); c.setRequestProperty("Accept", "application/json");
        int code = c.getResponseCode();
        String body = read(code >= 200 && code < 300 ? c.getInputStream() : c.getErrorStream());
        if (code < 200 || code >= 300) throw new IllegalStateException("HTTP " + code);
        return new JSONObject(body);
    }

    private static String enc(String s) throws Exception { return URLEncoder.encode(s == null ? "" : s, StandardCharsets.UTF_8.name()); }
    private static String read(InputStream in) throws Exception {
        if (in == null) return "";
        StringBuilder s = new StringBuilder();
        try (BufferedReader r = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            String line; while ((line = r.readLine()) != null) s.append(line);
        }
        return s.toString();
    }
}

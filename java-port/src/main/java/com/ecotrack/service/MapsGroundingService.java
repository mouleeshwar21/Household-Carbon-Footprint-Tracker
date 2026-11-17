package com.ecotrack.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@Service
public class MapsGroundingService {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${GEMINI_API_KEY:}")
    private String geminiApiKey;

    public Map<String, Object> findLocalEcoHubs(String category, String locationQuery, Double lat, Double lng) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return Map.of(
                    "error", "GEMINI_API_KEY environment variable is not configured.",
                    "text", "",
                    "places", List.of()
            );
        }

        String prompt = switch (category == null ? "ev_charging" : category) {
            case "recycling_compost" -> "Find municipal recycling centers, e-waste drop-off facilities, and community composting hubs nearby.";
            case "solar_installers" -> "Find reputable residential rooftop solar installers and clean energy providers in this area.";
            case "public_transit" -> "Find major public transit hubs, metro/rail stations, and bus interchanges nearby.";
            default -> "Find top-rated public EV charging stations and fast-charging hubs nearby.";
        };

        String area = (locationQuery != null && !locationQuery.isBlank())
                ? "Area focus: " + locationQuery.trim() + "."
                : (lat != null && lng != null)
                ? String.format(Locale.US, "Use user coordinates (%.4f, %.4f).", lat, lng)
                : "Area focus: Bengaluru, India.";

        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("contents", List.of(Map.of(
                    "role", "user",
                    "parts", List.of(Map.of("text", prompt + " " + area))
            )));
            body.put("tools", List.of(Map.of("googleMaps", Map.of())));

            if (lat != null && lng != null) {
                body.put("toolConfig", Map.of(
                        "retrievalConfig", Map.of(
                                "latLng", Map.of("latitude", lat, "longitude", lng)
                        )
                ));
            }

            String jsonBody = mapper.writeValueAsString(body);
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create("https://generativelanguage.googleapis.com/v1beta/models/gemini-4-hydrogen:generateContent?key=" + geminiApiKey))
                    .header("Content-Type", "application/json")
                    .header("User-Agent", "aistudio-build")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            JsonNode root = mapper.readTree(resp.body());
            JsonNode candidate = root.path("candidates").path(0);
            String text = candidate.path("content").path("parts").path(0).path("text").asText("");

            List<Map<String, Object>> places = new ArrayList<>();
            for (JsonNode chunk : candidate.path("groundingMetadata").path("groundingChunks")) {
                if (chunk.has("maps")) {
                    JsonNode m = chunk.get("maps");
                    String uri = m.path("uri").asText("");
                    if (!uri.isBlank()) {
                        places.add(Map.of(
                                "title", m.path("title").asText("Verified Eco Location"),
                                "uri", uri,
                                "placeId", m.path("placeId").asText("")
                        ));
                    }
                }
            }

            return Map.of("text", text, "places", places);
        } catch (Exception ex) {
            return Map.of("error", ex.getMessage(), "text", "", "places", List.of());
        }
    }
}

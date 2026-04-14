package com.matchworker.matchworker.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

@Service
public class GroqService {

    @Value("${groq.api.key}")
    private String API_KEY;

    private static final String URL = "https://openrouter.ai/api/v1/chat/completions";
    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();

    private final ObjectMapper mapper = new ObjectMapper();

    private String fallback(String message) {
        try {
            return mapper.writeValueAsString(Map.of(
                    "strengths", new String[] {},
                    "weaknesses", new String[] {},
                    "recommendations", new String[] { message }));
        } catch (Exception e) {
            return "{\"strengths\":[],\"weaknesses\":[],\"recommendations\":[\"Fallback error\"]}";
        }
    }

    private static final String[] MODELS = {
            // "google/gemma-3-27b-it:free",
            // "meta-llama/llama-3.3-70b-instruct:free",
            // "nousresearch/hermes-3-llama-3.1-405b:free",
            "google/gemma-3-12b-it:free",
            // "meta-llama/llama-3.2-3b-instruct:free"
    };

    public String generateFeedback(String resume, String jd, double score) {
        System.out.println("KEY_CHECK=[" + API_KEY + "]");
        if (API_KEY == null || API_KEY.isEmpty()) {
            throw new RuntimeException("API_KEY not set");
        }

        long startTime = System.currentTimeMillis();

        for (String model : MODELS) {
            if (System.currentTimeMillis() - startTime > 5000) {
                return fallback("AI timeout — using fallback");
            }
            try {
                System.out.println("Trying model: " + model);
                String result = tryModel(model, resume, jd, score);
                if (result != null)
                    return result;
            } catch (Exception e) {
                System.out.println("Model " + model + " failed: " + e.getMessage());
            }
        }

        return fallback("All models rate limited. Try again later.");
    }

    private String tryModel(String model, String resume, String jd, double score) throws Exception {
        String prompt = String.format("""
                You are an expert technical recruiter.

                Analyze the match between this resume and job description.

                Match Score: %.2f%%

                IMPORTANT:
                - Return ONLY valid JSON
                - Do NOT include explanation
                - Do NOT include markdown
                - Use DOUBLE quotes ONLY

                Format:

                {
                  "strengths": ["..."],
                  "weaknesses": ["..."],
                  "recommendations": ["..."]
                }

                Resume:
                %s

                Job Description:
                %s
                """,
                score,
                resume.substring(0, Math.min(1500, resume.length())),
                jd.substring(0, Math.min(1500, jd.length())));

        String body = mapper.writeValueAsString(Map.of(
                "model", model,
                "temperature", 0.2,
                "messages", new Object[] {
                        Map.of("role", "user", "content", prompt)
                }));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(URL))
                .timeout(Duration.ofSeconds(60))
                .header("Authorization", "Bearer " + API_KEY)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        HttpResponse<String> response = client.send(request,
                HttpResponse.BodyHandlers.ofString());

        System.out.println("Status Code: " + response.statusCode());
        String responseBody = response.body();
        System.out.println("Raw response: " + responseBody);

        if (response.statusCode() == 429) {
            Thread.sleep(1500);
            return null;
        }

        var json = mapper.readTree(responseBody);
        if (!json.has("choices"))
            return null;

        String content = json.get("choices")
                .get(0).get("message").get("content").asText();

        int start = content.indexOf("{");
        int end = content.lastIndexOf("}");
        if (start != -1 && end != -1) {
            content = content.substring(start, end + 1);
        }

        content = content.replace("'", "\"");

        var parsed = mapper.readTree(content);

        if (!parsed.has("strengths")) {
            ((com.fasterxml.jackson.databind.node.ObjectNode) parsed).putArray("strengths");
        }
        if (!parsed.has("weaknesses")) {
            ((com.fasterxml.jackson.databind.node.ObjectNode) parsed).putArray("weaknesses");
        }
        if (!parsed.has("recommendations")) {
            ((com.fasterxml.jackson.databind.node.ObjectNode) parsed)
                    .putArray("recommendations")
                    .add("Improve alignment with job requirements");
        }

        return mapper.writeValueAsString(parsed);
    }
}
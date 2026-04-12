package com.matchworker.matchworker.service;

import okhttp3.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;

import org.springframework.stereotype.Service;

import org.springframework.beans.factory.annotation.Value;

@Service
public class GroqService {

    @Value("${groq.api.key}")
    private String API_KEY;

    private static final String URL = "https://api.groq.com/openai/v1/chat/completions";

    private final OkHttpClient client = new OkHttpClient.Builder()
            .callTimeout(java.time.Duration.ofSeconds(10))
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

    public String generateFeedback(String resume, String jd, double score) {
        if (API_KEY == null || API_KEY.isEmpty()) {
            throw new RuntimeException("GROQ_API_KEY not set");
        }

        try {
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
                    "model", "llama-3.1-8b-instant",
                    "temperature", 0.2,
                    "messages", new Object[] {
                            Map.of("role", "user", "content", prompt)
                    }));

            Request request = new Request.Builder()
                    .url(URL)
                    .post(RequestBody.create(body, MediaType.parse("application/json")))
                    .addHeader("Authorization", "Bearer " + API_KEY)
                    .addHeader("Content-Type", "application/json")
                    .build();

            try (Response response = client.newCall(request).execute()) {

                if (response.body() == null) {
                    return fallback("No response from AI");
                }

                String responseBody = response.body().string();
                System.out.println("Groq raw response: " + responseBody);

                var json = mapper.readTree(responseBody);

                if (!json.has("choices")) {
                    return fallback("Invalid response structure");
                }

                String content = json.get("choices")
                        .get(0)
                        .get("message")
                        .get("content")
                        .asText();

                // 🔥 Extract JSON safely
                int start = content.indexOf("{");
                int end = content.lastIndexOf("}");

                if (start != -1 && end != -1) {
                    content = content.substring(start, end + 1);
                }

                content = content.replace("'", "\"");

                try {
                    var parsed = mapper.readTree(content);

                    // ✅ Guarantee required fields exist
                    if (!parsed.has("strengths")) {
                        ((com.fasterxml.jackson.databind.node.ObjectNode) parsed)
                                .putArray("strengths");
                    }
                    if (!parsed.has("weaknesses")) {
                        ((com.fasterxml.jackson.databind.node.ObjectNode) parsed)
                                .putArray("weaknesses");
                    }
                    if (!parsed.has("recommendations")) {
                        ((com.fasterxml.jackson.databind.node.ObjectNode) parsed)
                                .putArray("recommendations")
                                .add("Improve alignment with job requirements");
                    }

                    return mapper.writeValueAsString(parsed);

                } catch (Exception e) {
                    System.out.println("Invalid JSON after cleanup: " + content);
                    return fallback(content);
                }
            }

        } catch (Exception e) {
            return fallback("AI feedback failed");
        }

    }

}
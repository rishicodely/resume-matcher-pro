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
                    - Do NOT include any explanation
                    - Do NOT include markdown
                    - Do NOT include text before or after JSON
                    - Use DOUBLE QUOTES (")

                    Format:

                    {
                      "strengths": [],
                      "weaknesses": [],
                      "missing_skills": [],
                      "recommendations": []
                    }

                    Resume:
                    %s

                    Job Description:
                    %s""",
                    score,
                    resume.substring(0, Math.min(1500, resume.length())),
                    jd.substring(0, Math.min(1500, jd.length())));

            String body = mapper.writeValueAsString(Map.of(
                    "model", "llama-3.1-8b-instant",
                    "temperature", 0.3,
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
                    return "Empty LLM response";
                }

                String responseBody = response.body().string();
                System.out.println("Groq raw response: " + responseBody);
                var json = mapper.readTree(responseBody);

                if (json.has("error")) {
                    System.out.println("Groq error: " + json.get("error").toString());
                    return "LLM error: " + json.get("error").get("message").asText();
                }

                if (json.has("choices")) {

                    String content = json.get("choices")
                            .get(0)
                            .get("message")
                            .get("content")
                            .asText();

                    int start = content.indexOf("{");
                    int end = content.lastIndexOf("}");

                    if (start != -1 && end != -1) {
                        content = content.substring(start, end + 1);
                    }

                    content = content.replace("'", "\"");

                    try {
                        mapper.readTree(content);
                        return content;
                    } catch (Exception e) {
                        System.out.println("Invalid JSON after cleanup: " + content);
                        return "{\"error\": \"Invalid JSON from LLM\"}";
                    }
                }
                return "LLM response invalid";
            }

        } catch (Exception e) {
            return "LLM feedback failed.";
        }
    }
}
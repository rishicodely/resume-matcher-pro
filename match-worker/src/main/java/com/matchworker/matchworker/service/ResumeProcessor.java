package com.matchworker.matchworker.service;

import java.util.Map;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.matchworker.matchworker.repository.MatchResultRepository;
import com.matchworker.matchworker.entity.MatchResult;

import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.AllMiniLmL6V2EmbeddingModelFactory;

@Service
public class ResumeProcessor {

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MatchResultRepository matchResultRepository;

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    @Autowired
    private GroqService groq;

    private final EmbeddingModel embeddingModel = new AllMiniLmL6V2EmbeddingModelFactory().create();

    private final Map<String, float[]> jdCache = new ConcurrentHashMap<>();

    private float[] getEmbedding(String text) {
        return embeddingModel.embed(text).content().vector();
    }

    private String toPgVector(float[] vector) {
        return Arrays.toString(vector);
    }

    private String extractFromPdf(String filePath) {
        try {
            Tika tika = new Tika();

            System.out.println("Reading file: " + filePath);
            System.out.println("Exists: " + new java.io.File(filePath).exists());
            System.out.println("Size: " + new java.io.File(filePath).length());

            String text;

            if (filePath.startsWith("http")) {
                text = tika.parseToString(java.net.URI.create(filePath).toURL());
            } else {
                text = tika.parseToString(new java.io.File(filePath));
            }

            System.out.println("Extracted length: " + text.length());

            return text;

        } catch (Exception e) {
            System.out.println("Tika error: " + e.getMessage());
            return "";
        }
    }

    private double calculateMatchScore(String resumeText, String jdText) {
        String cleanResume = resumeText.toLowerCase().replaceAll("[^a-z0-9 ]", "");
        String cleanJd = jdText.toLowerCase().replaceAll("[^a-z0-9 ]", "");

        Map<String, Double> skillWeights = Map.of(
                "java", 20.0,
                "spring", 18.0,
                "kafka", 15.0,
                "docker", 12.0,
                "kubernetes", 15.0,
                "aws", 15.0,
                "react", 10.0,
                "python", 12.0);

        Map<String, List<String>> skillVariants = Map.of(
                "java", List.of("java"),
                "spring", List.of("spring", "springboot"),
                "aws", List.of("aws", "amazon web services"),
                "kubernetes", List.of("kubernetes", "k8s"),
                "docker", List.of("docker", "containers"),
                "react", List.of("react", "reactjs"),
                "python", List.of("python"));

        double score = 0.0;

        for (Map.Entry<String, Double> entry : skillWeights.entrySet()) {
            String skill = entry.getKey();
            double weight = entry.getValue();

            List<String> variants = skillVariants.getOrDefault(skill, List.of(skill));

            boolean resumeMatch = variants.stream().anyMatch(cleanResume::contains);
            boolean jdMatch = variants.stream().anyMatch(cleanJd::contains);

            if (resumeMatch && jdMatch) {
                score += weight;
            }
        }

        for (String skill : skillWeights.keySet()) {
            if (cleanResume.contains(skill) && !cleanJd.contains(skill)) {
                score += 3.0;
            }
        }
        return Math.min(score, 100.0);
    }

    public void processMatch(String data) {
        String jobId = null;
        String userId = null;
        try {

            if (data == null || data.isEmpty()) {
                System.out.println("⚠️ Job data is empty");
                return;
            }

            var root = objectMapper.readTree(data);

            jobId = root.get("jobId").asText();
            String jd = root.get("jd").asText();
            userId = root.get("userId").asText();

            String resumePath = root.get("resumeUrl").asText();
            String resumeText = extractFromPdf(resumePath);
            System.out.println("Resume length: " + resumeText.length());

            if (resumeText.isEmpty()) {
                throw new RuntimeException("Resume parsing failed");
            }

            float[] resumeVector = getEmbedding(resumeText);
            float[] jdVector = jdCache.computeIfAbsent(jd, this::getEmbedding);

            String resumeVecStr = toPgVector(resumeVector);
            String jdVecStr = toPgVector(jdVector);

            Double semanticScore = matchResultRepository
                    .calculateSimilarity(resumeVecStr, jdVecStr);

            double semanticScoreRaw = (semanticScore != null ? semanticScore : 0.0);

            double normalized = (semanticScoreRaw + 1) / 2;

            double semanticPercent = normalized * 100;

            double keywordScore = calculateMatchScore(resumeText, jd);

            double finalScore = (0.7 * semanticPercent) + (0.3 * keywordScore);

            String llmFeedback = groq.generateFeedback(resumeText, jd, finalScore);

            String safeFeedback = llmFeedback;

            MatchResult result = new MatchResult();
            result.setJobId(jobId);
            result.setUserId(userId);
            result.setStatus(MatchResult.MatchStatus.SUCCESS);
            result.setResumeEmbedding(resumeVector);
            result.setJdEmbedding(jdVector);
            result.setScore(finalScore);
            result.setFeedback(safeFeedback);

            matchResultRepository.save(result);

            notifyCompletion(jobId, userId, finalScore, safeFeedback);

            System.out.println("✅ Saved to DB");

        } catch (Exception e) {
            System.err.println("CRITICAL FAILURE: " + e.getMessage());

            MatchResult errorResult = new MatchResult();
            errorResult.setJobId(jobId);
            errorResult.setUserId(userId);
            errorResult.setStatus(MatchResult.MatchStatus.FAILED);
            errorResult.setFeedback("Error: PDF processing failed. Please ensure the file is not corrupted.");
            matchResultRepository.save(errorResult);

            notifyFailure(jobId, userId, "FAILED");
        }
    }

    public void notifyCompletion(String jobId, String userId, double score, String feedback) {
        try {
            Map<String, Object> feedbackObj = objectMapper.readValue(feedback, Map.class);

            Map<String, Object> payload = Map.of(
                    "jobId", jobId,
                    "userId", userId,
                    "status", "COMPLETED",
                    "score", score,
                    "feedback", feedbackObj);

            String message = objectMapper.writeValueAsString(payload);

            System.out.println("📡 Publishing completion for job: " + jobId);
            stringRedisTemplate.convertAndSend("resume_status_updates", message);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void notifyFailure(String jobId, String userId, String status) {
        String message = String.format(
                "{\"jobId\":\"%s\", \"userId\":\"%s\", \"status\":\"%s\"}",
                jobId, userId, status);

        stringRedisTemplate.convertAndSend("resume_status_updates", message);
    }
}
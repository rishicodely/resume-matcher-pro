package com.matchworker.matchworker.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.matchworker.matchworker.repository.MatchResultRepository;
import com.matchworker.matchworker.entity.MatchResult;

@Service
public class ResumeProcessor {

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MatchResultRepository matchResultRepository;

    @Scheduled(fixedDelay = 1000)
    public void consumeJob() {
        String jobId = redisTemplate.opsForList().rightPop("bull:resume-queue:wait");

        if (jobId != null) {
            System.out.println("Received job ID: " + jobId);
            var jobMap = redisTemplate.opsForHash()
                    .entries("bull:resume-queue:" + jobId);
            System.out.println("Raw job data: " + jobMap);
            Object dataObj = jobMap.get("data");

            if (dataObj == null) {
                System.out.println("⚠️ No data found in job");
                return;
            }

            String data = dataObj.toString();
            processMatch(data);
        }
    }

    private double calculateScore(String text) {
        String[] keywords = { "Java", "Python", "React", "Kafka", "Docker" };
        double score = 0.0;

        for (String word : keywords) {
            if (text.toLowerCase().contains(word.toLowerCase())) {
                score += 20.0;
            }
        }
        return score;
    }

    private void processMatch(String data) {
        try {

            if (data == null || data.isEmpty()) {
                System.out.println("⚠️ Job data is empty");
                return;
            }

            var root = objectMapper.readTree(data);

            String jobId = root.get("jobId").asText();
            String jd = root.get("jd").asText();

            String userId = root.get("userId").asText();
            double score = calculateScore(jd);

            System.out.println("Processing jobId: " + jobId);
            System.out.println("Processing jd: " + jd);

            if (jd.toLowerCase().contains("java")) {
                System.out.println("Match score: 100");
            } else {
                System.out.println("Match score: 50");
            }

            MatchResult result = new MatchResult();
            result.setJobId(jobId);
            result.setUserId(userId);
            result.setMatchScore(score);
            result.setFeedback("Basic keyword match completed");

            matchResultRepository.save(result);

            System.out.println("✅ Saved to DB");
        } catch (Exception e) {
            System.out.println("Failed to process job: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
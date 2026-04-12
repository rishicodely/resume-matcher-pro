package com.matchworker.matchworker.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "match_results")
@Data
public class MatchResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String jobId;
    private String userId;
    private Double score;

    @Enumerated(EnumType.STRING)
    private MatchStatus status;

    public enum MatchStatus {
        SUCCESS,
        FAILED
    }

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "resume_embedding", columnDefinition = "vector(384)")
    private float[] resumeEmbedding;

    @Column(name = "jd_embedding", columnDefinition = "vector(384)")
    private float[] jdEmbedding;

    private LocalDateTime createdAt = LocalDateTime.now();
}
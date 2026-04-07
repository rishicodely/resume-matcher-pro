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
    private Double matchScore;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    private LocalDateTime createdAt = LocalDateTime.now();
}
package com.matchworker.matchworker.repository;

import com.matchworker.matchworker.entity.MatchResult;

import io.lettuce.core.dynamic.annotation.Param;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface MatchResultRepository extends JpaRepository<MatchResult, Long> {
        @Query(value = "SELECT 0.0", nativeQuery = true)
        Double calculateSimilarity(@Param("resumeVec") String resumeVec,
                        @Param("jdVec") String jdVec);

}
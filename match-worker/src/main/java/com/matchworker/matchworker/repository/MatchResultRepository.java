package com.matchworker.matchworker.repository;

import com.matchworker.matchworker.entity.MatchResult;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MatchResultRepository extends JpaRepository<MatchResult, Long> {
}
package com.adaptcare.repository;

import com.adaptcare.entity.AdaptationEvent;
import com.adaptcare.entity.enums.AdaptationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AdaptationEventRepository extends JpaRepository<AdaptationEvent, Long> {
    List<AdaptationEvent> findByRuleId(String ruleId);
    List<AdaptationEvent> findByAffectedEntityTypeAndAffectedEntityId(String entityType, Long entityId);
    Page<AdaptationEvent> findAllByOrderByExecutedAtDesc(Pageable pageable);
    List<AdaptationEvent> findByExecutedAtBetween(LocalDateTime start, LocalDateTime end);
    long countByRuleIdAndStatus(String ruleId, AdaptationStatus status);
    long countByExecutedAtAfter(LocalDateTime since);
}

package com.adaptcare.repository;

import com.adaptcare.entity.AdaptiveRule;
import com.adaptcare.entity.enums.RuleCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdaptiveRuleRepository extends JpaRepository<AdaptiveRule, Long> {
    List<AdaptiveRule> findByEnabledTrue();
    Optional<AdaptiveRule> findByRuleId(String ruleId);
    List<AdaptiveRule> findByCategory(RuleCategory category);
}

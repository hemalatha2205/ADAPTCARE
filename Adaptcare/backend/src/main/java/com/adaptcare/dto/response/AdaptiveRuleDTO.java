package com.adaptcare.dto.response;

import com.adaptcare.entity.enums.RuleCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdaptiveRuleDTO {
    private Long id;
    private String ruleId;
    private String name;
    private String description;
    private RuleCategory category;
    private boolean enabled;
    private int priority;
    private Double thresholdValue;
    private String thresholdUnit;
    private int cooldownMinutes;
    private LocalDateTime lastTriggered;
}

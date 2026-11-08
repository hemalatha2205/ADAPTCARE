package com.adaptcare.dto.response;

import com.adaptcare.entity.enums.AdaptationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdaptationEventDTO {
    private Long id;
    private String ruleId;
    private String ruleName;
    private String triggerCondition;
    private String reason;
    private String action;
    private String affectedEntityType;
    private Long affectedEntityId;
    private String previousState;
    private String newState;
    private AdaptationStatus status;
    private LocalDateTime executedAt;
    private String executedBy;
    private String details;
}

package com.adaptcare.entity;

import com.adaptcare.entity.enums.AdaptationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "adaptation_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdaptationEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String ruleId;

    @Column(nullable = false)
    private String ruleName;

    private String triggerCondition;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(columnDefinition = "TEXT")
    private String action;

    private String affectedEntityType;

    private Long affectedEntityId;

    @Column(columnDefinition = "TEXT")
    private String previousState;

    @Column(columnDefinition = "TEXT")
    private String newState;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AdaptationStatus status = AdaptationStatus.PENDING;

    private LocalDateTime executedAt;

    private String executedBy;

    @Column(columnDefinition = "TEXT")
    private String details;

    @PrePersist
    protected void onCreate() {
        if (executedAt == null) {
            executedAt = LocalDateTime.now();
        }
    }
}

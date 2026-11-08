package com.adaptcare.entity;

import com.adaptcare.entity.enums.RuleCategory;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "adaptive_rules")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdaptiveRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String ruleId;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RuleCategory category;

    @Builder.Default
    @Column(nullable = false)
    private boolean enabled = true;

    @Builder.Default
    private int priority = 1;

    private Double thresholdValue;

    private String thresholdUnit;

    @Builder.Default
    private int cooldownMinutes = 30;

    private LocalDateTime lastTriggered;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

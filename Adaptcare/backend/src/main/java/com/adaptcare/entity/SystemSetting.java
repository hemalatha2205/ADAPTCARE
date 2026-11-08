package com.adaptcare.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "system_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String settingKey;

    @Column(columnDefinition = "TEXT")
    private String settingValue;

    private String description;

    private String category;

    private LocalDateTime updatedAt;

    private String updatedBy;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        updatedAt = LocalDateTime.now();
    }
}

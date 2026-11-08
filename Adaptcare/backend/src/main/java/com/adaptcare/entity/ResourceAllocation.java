package com.adaptcare.entity;

import com.adaptcare.entity.enums.AllocationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "resource_allocations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceAllocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "resource_id", nullable = false)
    private Resource resource;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "appointment_id", nullable = false)
    private Appointment appointment;

    private LocalDateTime allocatedAt;

    private LocalDateTime releasedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AllocationStatus status = AllocationStatus.ALLOCATED;

    @PrePersist
    protected void onCreate() {
        if (allocatedAt == null) {
            allocatedAt = LocalDateTime.now();
        }
    }
}

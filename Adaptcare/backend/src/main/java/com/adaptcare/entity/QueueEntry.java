package com.adaptcare.entity;

import com.adaptcare.entity.enums.QueueStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "queue_entries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QueueEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "appointment_id", nullable = false)
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id")
    private Department department;

    private Integer queueNumber;

    private Integer position;

    private Integer estimatedWaitTime;

    @Builder.Default
    private int priority = 3;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private QueueStatus status = QueueStatus.WAITING;

    private LocalDateTime checkedInAt;

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (checkedInAt == null) {
            checkedInAt = LocalDateTime.now();
        }
    }
}

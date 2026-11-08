package com.adaptcare.entity;

import com.adaptcare.entity.enums.AppointmentStatus;
import com.adaptcare.entity.enums.AppointmentType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "appointments",
       uniqueConstraints = @UniqueConstraint(columnNames = {"doctor_id", "appointment_date", "start_time"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(name = "appointment_date", nullable = false)
    private LocalDate appointmentDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AppointmentStatus status = AppointmentStatus.SCHEDULED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AppointmentType type = AppointmentType.REGULAR;

    @Builder.Default
    @Column(nullable = false)
    private int priority = 3;

    private String reason;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private Integer queueNumber;

    private Integer estimatedWaitTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booked_by")
    private User bookedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rescheduled_from")
    private Appointment rescheduledFrom;

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

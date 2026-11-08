package com.adaptcare.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "doctors")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id")
    private Department department;

    private String specialization;

    private String qualification;

    @Column(name = "experience_years")
    private int experience;

    @Builder.Default
    @Column(name = "consultation_duration")
    private int consultationDuration = 30;

    @Builder.Default
    @Column(name = "max_daily_appointments")
    private int maxDailyAppointments = 20;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;
}

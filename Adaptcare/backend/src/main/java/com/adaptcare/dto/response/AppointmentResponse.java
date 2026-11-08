package com.adaptcare.dto.response;

import com.adaptcare.entity.enums.AppointmentStatus;
import com.adaptcare.entity.enums.AppointmentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentResponse {
    private Long id;
    private Long patientId;
    private String patientName;
    private String patientEmail;
    private Long doctorId;
    private String doctorName;
    private String doctorSpecialization;
    private Long departmentId;
    private String departmentName;
    private LocalDate appointmentDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private AppointmentStatus status;
    private AppointmentType type;
    private int priority;
    private String reason;
    private String notes;
    private Integer queueNumber;
    private Integer estimatedWaitTime;
    private LocalDateTime createdAt;
}

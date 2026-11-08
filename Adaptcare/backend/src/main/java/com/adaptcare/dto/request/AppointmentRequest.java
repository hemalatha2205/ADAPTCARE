package com.adaptcare.dto.request;

import com.adaptcare.entity.enums.AppointmentType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentRequest {
    @NotNull(message = "Doctor ID is required")
    private Long doctorId;

    private Long departmentId;

    @NotNull(message = "Appointment date is required")
    private LocalDate appointmentDate;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    private AppointmentType type;

    private String reason;

    /** Optional — used by receptionist to book on behalf of a patient */
    private Long patientId;
}

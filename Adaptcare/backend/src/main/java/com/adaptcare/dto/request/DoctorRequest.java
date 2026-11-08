package com.adaptcare.dto.request;

import com.adaptcare.entity.enums.DayOfWeekEnum;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DoctorRequest {
    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Department ID is required")
    private Long departmentId;

    private String specialization;
    private String qualification;
    private int experience;
    private int consultationDuration;
    private int maxDailyAppointments;
    private List<AvailabilitySlot> availability;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AvailabilitySlot {
        private DayOfWeekEnum dayOfWeek;
        private LocalTime startTime;
        private LocalTime endTime;
        private boolean available;
    }
}

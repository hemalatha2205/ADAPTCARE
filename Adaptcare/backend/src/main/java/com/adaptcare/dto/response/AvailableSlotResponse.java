package com.adaptcare.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvailableSlotResponse {
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private Long doctorId;
    private String doctorName;
    private Long departmentId;
    private String departmentName;
}

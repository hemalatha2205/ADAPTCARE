package com.adaptcare.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PredictionRequest {
    private int queueLength;
    private int doctorWorkload;
    private String appointmentType;
    private int emergencyCount;
    private int hourOfDay;
    private Long departmentId;
    private String dayOfWeek;
    private String timePeriod;
}

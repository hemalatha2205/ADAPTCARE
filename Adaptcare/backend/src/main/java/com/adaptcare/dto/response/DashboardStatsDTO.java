package com.adaptcare.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsDTO {
    private long totalPatients;
    private long totalDoctors;
    private long todayAppointments;
    private long activeQueues;
    private double avgWaitTime;
    private long emergencyCount;
    private long adaptationCount;
}

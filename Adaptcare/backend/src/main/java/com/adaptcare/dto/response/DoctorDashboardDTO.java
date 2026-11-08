package com.adaptcare.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorDashboardDTO {
    private Long doctorId;
    private String doctorName;
    private String specialization;
    private String departmentName;
    private long todayAppointments;
    private int todayAppointmentsCount;
    private int activeQueueCount;
    private List<QueueEntryDTO> currentQueue;
    private double avgWaitTime;
    private QueueEntryDTO nextPatient;
}

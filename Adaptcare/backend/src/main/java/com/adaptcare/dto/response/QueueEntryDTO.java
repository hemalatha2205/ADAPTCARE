package com.adaptcare.dto.response;

import com.adaptcare.entity.enums.QueueStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QueueEntryDTO {
    private Long id;
    private Long appointmentId;
    private Long doctorId;
    private String doctorName;
    private Long patientId;
    private String patientName;
    private Long departmentId;
    private String departmentName;
    private Integer queueNumber;
    private Integer position;
    private Integer estimatedWaitTime;
    private int priority;
    private QueueStatus status;
    private LocalDateTime checkedInAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
}

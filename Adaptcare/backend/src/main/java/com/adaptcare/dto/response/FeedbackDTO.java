package com.adaptcare.dto.response;

import com.adaptcare.entity.enums.FeedbackCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedbackDTO {
    private Long id;
    private Long appointmentId;
    private Long patientId;
    private String patientName;
    private Long doctorId;
    private String doctorName;
    private int rating;
    private String comment;
    private FeedbackCategory category;
    private LocalDateTime createdAt;
}

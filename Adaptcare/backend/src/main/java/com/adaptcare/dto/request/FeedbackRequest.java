package com.adaptcare.dto.request;

import com.adaptcare.entity.enums.FeedbackCategory;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackRequest {
    private Long appointmentId;

    /** Optional if appointmentId is provided; if appointmentId is omitted, doctorId is required */
    private Long doctorId;

    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private Integer rating;

    private String comment;

    private FeedbackCategory category;
}

package com.adaptcare.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PredictionResponse {
    private double predictedValue;
    private String unit;
    private String source; // ML_PREDICTION or FALLBACK_ESTIMATE
    private double confidence;
    private String details;
}

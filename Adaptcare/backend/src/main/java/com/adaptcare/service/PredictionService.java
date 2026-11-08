package com.adaptcare.service;

import com.adaptcare.dto.request.PredictionRequest;
import com.adaptcare.dto.response.PredictionResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class PredictionService {

    private final RestTemplate restTemplate;

    @Value("${app.ml-service.url:http://localhost:8000}")
    private String mlServiceUrl;

    public PredictionService(RestTemplateBuilder builder) {
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofSeconds(3))
                .setReadTimeout(Duration.ofSeconds(3))
                .build();
    }

    public PredictionResponse predictWaitTime(PredictionRequest request) {
        String url = mlServiceUrl + "/predict/wait-time";
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("queue_length", request.getQueueLength());
            payload.put("doctor_workload", request.getDoctorWorkload());
            payload.put("appointment_type", request.getAppointmentType() != null ? request.getAppointmentType() : "REGULAR");
            payload.put("emergency_count", request.getEmergencyCount());
            payload.put("hour_of_day", request.getHourOfDay() > 0 ? request.getHourOfDay() : 10);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, payload, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map body = response.getBody();
                double waitMinutes = ((Number) body.get("estimated_wait_minutes")).doubleValue();
                double confidence = ((Number) body.get("confidence")).doubleValue();
                String source = (String) body.get("source");

                return PredictionResponse.builder()
                        .predictedValue(waitMinutes)
                        .unit("minutes")
                        .source(source != null ? source : "ML_PREDICTION")
                        .confidence(confidence)
                        .details("Model output from ADAPTCARE scikit-learn GradientBoosting service")
                        .build();
            }
        } catch (Exception e) {
            log.warn("ML Service unreachable ({}), falling back to deterministic calculation", e.getMessage());
        }

        // Fallback estimate
        int base = 10;
        int wait = base + (request.getQueueLength() * 4) + (request.getDoctorWorkload() * 2) + (request.getEmergencyCount() * 5);
        if (request.getHourOfDay() >= 10 && request.getHourOfDay() <= 14) {
            wait += 10;
        }

        return PredictionResponse.builder()
                .predictedValue(Math.max(5, wait))
                .unit("minutes")
                .source("FALLBACK_ESTIMATE")
                .confidence(0.35)
                .details("Fallback formula applied because ML microservice was offline")
                .build();
    }

    public PredictionResponse predictDemand(PredictionRequest request) {
        String url = mlServiceUrl + "/predict/demand";
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("department_id", request.getDepartmentId() != null ? request.getDepartmentId() : 0);
            payload.put("day_of_week", 2);
            payload.put("hour_of_day", request.getHourOfDay() > 0 ? request.getHourOfDay() : 11);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, payload, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map body = response.getBody();
                double count = ((Number) body.get("predicted_count")).doubleValue();
                double confidence = ((Number) body.get("confidence")).doubleValue();
                String source = (String) body.get("source");

                return PredictionResponse.builder()
                        .predictedValue(count)
                        .unit("patients/hour")
                        .source(source != null ? source : "ML_PREDICTION")
                        .confidence(confidence)
                        .details("RandomForest demand forecast from ADAPTCARE ML service")
                        .build();
            }
        } catch (Exception e) {
            log.warn("ML Service unreachable for demand prediction ({}), falling back", e.getMessage());
        }

        // Fallback
        double fallbackCount = 12.0;
        return PredictionResponse.builder()
                .predictedValue(fallbackCount)
                .unit("patients/hour")
                .source("FALLBACK_ESTIMATE")
                .confidence(0.30)
                .details("Historical median fallback applied")
                .build();
    }
}

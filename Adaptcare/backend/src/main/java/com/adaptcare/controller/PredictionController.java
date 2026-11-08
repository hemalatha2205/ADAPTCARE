package com.adaptcare.controller;

import com.adaptcare.dto.request.PredictionRequest;
import com.adaptcare.dto.response.ApiResponse;
import com.adaptcare.dto.response.PredictionResponse;
import com.adaptcare.service.PredictionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/predictions")
@RequiredArgsConstructor
public class PredictionController {

    private final PredictionService predictionService;

    @PostMapping("/wait-time")
    public ResponseEntity<ApiResponse<PredictionResponse>> predictWaitTime(@RequestBody PredictionRequest request) {
        return ResponseEntity.ok(ApiResponse.success(predictionService.predictWaitTime(request)));
    }

    @PostMapping("/demand")
    public ResponseEntity<ApiResponse<PredictionResponse>> predictDemand(@RequestBody PredictionRequest request) {
        return ResponseEntity.ok(ApiResponse.success(predictionService.predictDemand(request)));
    }
}

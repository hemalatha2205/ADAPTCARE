package com.adaptcare.controller;

import com.adaptcare.dto.request.FeedbackRequest;
import com.adaptcare.dto.response.ApiResponse;
import com.adaptcare.dto.response.FeedbackDTO;
import com.adaptcare.entity.User;
import com.adaptcare.service.AdaptiveEngineService;
import com.adaptcare.service.AuthService;
import com.adaptcare.service.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;
    private final AuthService authService;
    private final AdaptiveEngineService adaptiveEngineService;

    @PostMapping
    public ResponseEntity<ApiResponse<FeedbackDTO>> submitFeedback(@Valid @RequestBody FeedbackRequest request) {
        User user = authService.getCurrentUser();
        FeedbackDTO feedback = feedbackService.submitFeedback(request, user);

        // If low rating, trigger feedback analysis in adaptive engine
        if (request.getRating() <= 2) {
            adaptiveEngineService.analyzeFeedbackTrends();
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Feedback submitted successfully", feedback));
    }

    @GetMapping("/patient")
    public ResponseEntity<ApiResponse<List<FeedbackDTO>>> getPatientFeedback() {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success(feedbackService.getPatientFeedback(user)));
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<ApiResponse<List<FeedbackDTO>>> getDoctorFeedback(@PathVariable Long doctorId) {
        return ResponseEntity.ok(ApiResponse.success(feedbackService.getDoctorFeedback(doctorId)));
    }

    @GetMapping("/doctor/{doctorId}/average")
    public ResponseEntity<ApiResponse<Map<String, Double>>> getDoctorAverageRating(@PathVariable Long doctorId) {
        Double avg = feedbackService.getDoctorAverageRating(doctorId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("averageRating", avg)));
    }
}

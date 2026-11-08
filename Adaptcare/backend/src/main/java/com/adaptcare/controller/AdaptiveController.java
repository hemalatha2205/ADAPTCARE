package com.adaptcare.controller;

import com.adaptcare.dto.response.AdaptationEventDTO;
import com.adaptcare.dto.response.AdaptiveRuleDTO;
import com.adaptcare.dto.response.ApiResponse;
import com.adaptcare.dto.response.PageResponse;
import com.adaptcare.service.AdaptiveEngineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/adaptive")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdaptiveController {

    private final AdaptiveEngineService adaptiveEngineService;

    @PostMapping({"/evaluate", "/evaluate-all"})
    public ResponseEntity<ApiResponse<List<AdaptationEventDTO>>> evaluateAllRules() {
        return ResponseEntity.ok(ApiResponse.success("Evaluation cycle completed", adaptiveEngineService.evaluateAllRules()));
    }

    @PostMapping("/evaluate/{ruleId}")
    public ResponseEntity<ApiResponse<List<AdaptationEventDTO>>> evaluateRule(@PathVariable String ruleId) {
        List<AdaptationEventDTO> events;
        switch (ruleId) {
            case "RULE_EMERGENCY_SURGE", "1" -> events = adaptiveEngineService.handleEmergencySurge();
            case "RULE_DOCTOR_UNAVAILABILITY", "2" -> events = adaptiveEngineService.evaluateDoctorUnavailability();
            case "RULE_EXCESSIVE_WAIT_TIME", "3" -> events = adaptiveEngineService.handleExcessiveWaitTime();
            case "RULE_DEMAND_SURGE", "4" -> events = adaptiveEngineService.evaluateDemandSurge();
            case "RULE_RESOURCE_SHORTAGE", "5" -> events = adaptiveEngineService.evaluateResourceShortage();
            case "RULE_FEEDBACK_ANALYSIS", "6" -> events = adaptiveEngineService.analyzeFeedbackTrends();
            default -> events = List.of();
        }
        return ResponseEntity.ok(ApiResponse.success("Rule evaluation completed", events));
    }

    @PostMapping("/simulate/{ruleId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> simulateRule(@PathVariable String ruleId) {
        return ResponseEntity.ok(ApiResponse.success("Simulation results (dry run)", adaptiveEngineService.simulateRule(ruleId)));
    }

    @GetMapping("/rules")
    public ResponseEntity<ApiResponse<List<AdaptiveRuleDTO>>> getAllRules() {
        return ResponseEntity.ok(ApiResponse.success(adaptiveEngineService.getAllRules()));
    }

    @PutMapping("/rules/{id}")
    public ResponseEntity<ApiResponse<AdaptiveRuleDTO>> updateRule(
            @PathVariable Long id,
            @RequestBody AdaptiveRuleDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Rule updated successfully", adaptiveEngineService.updateRule(id, dto)));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<PageResponse<AdaptationEventDTO>>> getHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(adaptiveEngineService.getHistory(page, size)));
    }
}

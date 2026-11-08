package com.adaptcare.controller;

import com.adaptcare.dto.response.ApiResponse;
import com.adaptcare.dto.response.DashboardStatsDTO;
import com.adaptcare.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardStatsDTO>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getDashboardStats()));
    }

    @GetMapping("/appointments")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAppointmentTrends(
            @RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getAppointmentTrends(days)));
    }

    @GetMapping("/departments")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getDepartmentWorkload(
            @RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getDepartmentWorkload(days)));
    }
}

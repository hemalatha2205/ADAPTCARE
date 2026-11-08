package com.adaptcare.controller;

import com.adaptcare.dto.request.DoctorRequest;
import com.adaptcare.dto.response.ApiResponse;
import com.adaptcare.dto.response.DoctorDTO;
import com.adaptcare.dto.response.DoctorDashboardDTO;
import com.adaptcare.entity.DoctorAvailability;
import com.adaptcare.service.AdaptiveEngineService;
import com.adaptcare.service.DoctorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;
    private final AdaptiveEngineService adaptiveEngineService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DoctorDTO>>> getAllDoctors() {
        return ResponseEntity.ok(ApiResponse.success(doctorService.getAllDoctors()));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<DoctorDTO>>> getActiveDoctors() {
        return ResponseEntity.ok(ApiResponse.success(doctorService.getActiveDoctors()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DoctorDTO>> getDoctorById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(doctorService.getDoctorById(id)));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<DoctorDTO>> getDoctorByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(doctorService.getDoctorByUserId(userId)));
    }

    @GetMapping("/department/{departmentId}")
    public ResponseEntity<ApiResponse<List<DoctorDTO>>> getDoctorsByDepartment(@PathVariable Long departmentId) {
        return ResponseEntity.ok(ApiResponse.success(doctorService.getDoctorsByDepartment(departmentId)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DoctorDTO>> createDoctor(@Valid @RequestBody DoctorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Doctor created successfully", doctorService.createDoctor(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<ApiResponse<DoctorDTO>> updateDoctor(
            @PathVariable Long id,
            @Valid @RequestBody DoctorRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Doctor updated", doctorService.updateDoctor(id, request)));
    }

    @PutMapping("/{id}/toggle-active")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<ApiResponse<DoctorDTO>> toggleActive(@PathVariable Long id) {
        DoctorDTO doc = doctorService.toggleActive(id);
        if (!doc.isActive()) {
            // Trigger adaptive engine Rule 2 for doctor unavailability
            adaptiveEngineService.handleDoctorUnavailability(id);
        }
        return ResponseEntity.ok(ApiResponse.success("Doctor active state toggled", doc));
    }

    @GetMapping("/{id}/availability")
    public ResponseEntity<ApiResponse<List<DoctorAvailability>>> getDoctorAvailability(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(doctorService.getDoctorAvailability(id)));
    }

    @PutMapping("/{id}/availability")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<ApiResponse<List<DoctorAvailability>>> setDoctorAvailability(
            @PathVariable Long id,
            @RequestBody List<DoctorAvailability> availabilities) {
        List<DoctorAvailability> updated = doctorService.setDoctorAvailability(id, availabilities);
        return ResponseEntity.ok(ApiResponse.success("Availability updated successfully", updated));
    }

    @GetMapping("/{id}/dashboard")
    public ResponseEntity<ApiResponse<DoctorDashboardDTO>> getDoctorDashboard(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(doctorService.getDoctorDashboard(id)));
    }
}

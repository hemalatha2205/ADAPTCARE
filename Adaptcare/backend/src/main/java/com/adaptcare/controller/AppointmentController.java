package com.adaptcare.controller;

import com.adaptcare.dto.request.AppointmentRequest;
import com.adaptcare.dto.response.ApiResponse;
import com.adaptcare.dto.response.AppointmentResponse;
import com.adaptcare.dto.response.AvailableSlotResponse;
import com.adaptcare.entity.User;
import com.adaptcare.entity.enums.AppointmentStatus;
import com.adaptcare.service.AppointmentService;
import com.adaptcare.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final AuthService authService;

    @PostMapping
    public ResponseEntity<ApiResponse<AppointmentResponse>> bookAppointment(@Valid @RequestBody AppointmentRequest request) {
        User currentUser = authService.getCurrentUser();
        AppointmentResponse response = appointmentService.bookAppointment(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Appointment booked successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AppointmentResponse>> getAppointmentById(@PathVariable Long id) {
        User currentUser = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getAppointmentById(id, currentUser)));
    }

    @GetMapping("/patient")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getPatientAppointments() {
        User currentUser = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getPatientAppointments(currentUser)));
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getDoctorAppointments(
            @PathVariable Long doctorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getDoctorAppointments(doctorId, date)));
    }

    @GetMapping("/available-slots")
    public ResponseEntity<ApiResponse<List<AvailableSlotResponse>>> getAvailableSlots(
            @RequestParam Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getAvailableSlots(doctorId, date)));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<AppointmentResponse>> cancelAppointment(@PathVariable Long id) {
        User currentUser = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success("Appointment cancelled", appointmentService.cancelAppointment(id, currentUser)));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam AppointmentStatus status) {
        return ResponseEntity.ok(ApiResponse.success("Status updated", appointmentService.updateStatus(id, status)));
    }

    @PutMapping("/{id}/priority")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> updatePriority(
            @PathVariable Long id,
            @RequestParam int priority) {
        return ResponseEntity.ok(ApiResponse.success("Priority updated", appointmentService.updatePriority(id, priority)));
    }

    @GetMapping("/today")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR')")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getTodayAppointments() {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getTodayAppointments()));
    }

    @GetMapping("/date-range")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR')")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getAppointmentsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getAppointmentsByDateRange(start, end)));
    }
}

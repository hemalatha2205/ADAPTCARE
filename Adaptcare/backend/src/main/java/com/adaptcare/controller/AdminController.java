package com.adaptcare.controller;

import com.adaptcare.dto.request.DoctorRequest;
import com.adaptcare.dto.request.RegisterRequest;
import com.adaptcare.dto.response.*;
import com.adaptcare.entity.User;
import com.adaptcare.entity.enums.Role;
import com.adaptcare.exception.ResourceNotFoundException;
import com.adaptcare.repository.UserRepository;
import com.adaptcare.service.AnalyticsService;
import com.adaptcare.service.AuthService;
import com.adaptcare.service.DoctorService;
import com.adaptcare.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AnalyticsService analyticsService;
    private final UserService userService;
    private final DoctorService doctorService;
    private final AuthService authService;
    private final UserRepository userRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardStatsDTO>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getDashboardStats()));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<DashboardStatsDTO>> getStats() {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getDashboardStats()));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<PageResponse<UserDTO>>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Role role) {
        return ResponseEntity.ok(ApiResponse.success(userService.getAllUsers(page, size, role)));
    }

    @PostMapping("/users")
    public ResponseEntity<ApiResponse<UserDTO>> createUser(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        User user = userRepository.findById(response.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + response.getUserId()));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User created successfully", authService.toUserDTO(user)));
    }

    @PutMapping("/users/{id}/toggle-active")
    public ResponseEntity<ApiResponse<UserDTO>> toggleUserActive(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("User status changed", userService.toggleUserActive(id)));
    }

    @PostMapping("/doctors")
    public ResponseEntity<ApiResponse<DoctorDTO>> createDoctor(@Valid @RequestBody DoctorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Doctor created successfully", doctorService.createDoctor(request)));
    }

    @GetMapping("/doctors/pending")
    public ResponseEntity<ApiResponse<List<DoctorDTO>>> getPendingDoctors() {
        return ResponseEntity.ok(ApiResponse.success(doctorService.getPendingDoctors()));
    }

    @PutMapping("/doctors/{id}/approve")
    public ResponseEntity<ApiResponse<DoctorDTO>> approveDoctor(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Doctor approved and activated successfully", doctorService.approveDoctor(id)));
    }

    @PutMapping("/doctors/{id}/reject")
    public ResponseEntity<ApiResponse<String>> rejectDoctor(@PathVariable Long id) {
        doctorService.rejectDoctor(id);
        return ResponseEntity.ok(ApiResponse.success("Doctor application rejected", null));
    }
}

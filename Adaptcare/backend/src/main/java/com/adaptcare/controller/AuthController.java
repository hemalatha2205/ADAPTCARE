package com.adaptcare.controller;

import com.adaptcare.dto.request.DoctorRegistrationRequest;
import com.adaptcare.dto.request.LoginRequest;
import com.adaptcare.dto.request.RegisterRequest;
import com.adaptcare.dto.response.ApiResponse;
import com.adaptcare.dto.response.AuthResponse;
import com.adaptcare.dto.response.UserDTO;
import com.adaptcare.entity.User;
import com.adaptcare.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User registered successfully", response));
    }

    @PostMapping("/doctor-register")
    public ResponseEntity<ApiResponse<UserDTO>> registerDoctor(@Valid @RequestBody DoctorRegistrationRequest request) {
        UserDTO user = authService.doctorRegister(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Doctor registration submitted successfully. Your account is pending administrator approval before you can access the doctor portal.", user));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO>> getCurrentUser() {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success(authService.toUserDTO(user)));
    }
}

package com.adaptcare.controller;

import com.adaptcare.dto.response.ApiResponse;
import com.adaptcare.dto.response.PageResponse;
import com.adaptcare.dto.response.UserDTO;
import com.adaptcare.entity.User;
import com.adaptcare.entity.enums.Role;
import com.adaptcare.service.AuthService;
import com.adaptcare.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AuthService authService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<UserDTO>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Role role) {
        return ResponseEntity.ok(ApiResponse.success(userService.getAllUsers(page, size, role)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDTO>> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserById(id)));
    }

    @GetMapping("/role/{role}")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getUsersByRole(@PathVariable Role role) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUsersByRole(role)));
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserDTO>> getProfile() {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success(authService.toUserDTO(user)));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserDTO>> updateProfile(@RequestBody UserDTO userDTO) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success("Profile updated", userService.updateProfile(user.getId(), userDTO)));
    }

    @PutMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> toggleUserActive(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("User status changed", userService.toggleUserActive(id)));
    }
}

package com.adaptcare.controller;

import com.adaptcare.dto.request.DepartmentRequest;
import com.adaptcare.dto.response.ApiResponse;
import com.adaptcare.dto.response.DepartmentDTO;
import com.adaptcare.service.DepartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DepartmentDTO>>> getAllDepartments() {
        return ResponseEntity.ok(ApiResponse.success(departmentService.getAllDepartments()));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<DepartmentDTO>>> getActiveDepartments() {
        return ResponseEntity.ok(ApiResponse.success(departmentService.getActiveDepartments()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DepartmentDTO>> getDepartmentById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(departmentService.getDepartmentById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DepartmentDTO>> createDepartment(@Valid @RequestBody DepartmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Department created successfully", departmentService.createDepartment(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DepartmentDTO>> updateDepartment(
            @PathVariable Long id,
            @Valid @RequestBody DepartmentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Department updated", departmentService.updateDepartment(id, request)));
    }

    @PutMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DepartmentDTO>> toggleActive(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Department status toggled", departmentService.toggleActive(id)));
    }
}

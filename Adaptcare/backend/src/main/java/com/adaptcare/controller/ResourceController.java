package com.adaptcare.controller;

import com.adaptcare.dto.request.ResourceRequest;
import com.adaptcare.dto.response.ApiResponse;
import com.adaptcare.dto.response.ResourceDTO;
import com.adaptcare.entity.ResourceAllocation;
import com.adaptcare.entity.enums.ResourceStatus;
import com.adaptcare.service.AdaptiveEngineService;
import com.adaptcare.service.ResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;
    private final AdaptiveEngineService adaptiveEngineService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ResourceDTO>>> getAllResources() {
        return ResponseEntity.ok(ApiResponse.success(resourceService.getAllResources()));
    }

    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<ResourceDTO>>> getAvailableResources() {
        return ResponseEntity.ok(ApiResponse.success(resourceService.getAvailableResources()));
    }

    @GetMapping("/department/{departmentId}")
    public ResponseEntity<ApiResponse<List<ResourceDTO>>> getResourcesByDepartment(@PathVariable Long departmentId) {
        return ResponseEntity.ok(ApiResponse.success(resourceService.getResourcesByDepartment(departmentId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ResourceDTO>> getResourceById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(resourceService.getResourceById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ResourceDTO>> createResource(@Valid @RequestBody ResourceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Resource created successfully", resourceService.createResource(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ResourceDTO>> updateResource(
            @PathVariable Long id,
            @Valid @RequestBody ResourceRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Resource updated", resourceService.updateResource(id, request)));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<ResourceDTO>> updateStatus(
            @PathVariable Long id,
            @RequestParam ResourceStatus status) {
        ResourceDTO updated = resourceService.updateStatus(id, status);
        if (status == ResourceStatus.UNAVAILABLE) {
            adaptiveEngineService.handleResourceShortage(id);
        }
        return ResponseEntity.ok(ApiResponse.success("Resource status updated", updated));
    }

    @PostMapping("/{id}/allocate")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<ResourceAllocation>> allocateResource(
            @PathVariable Long id,
            @RequestParam Long appointmentId) {
        return ResponseEntity.ok(ApiResponse.success("Resource allocated", resourceService.allocateResource(id, appointmentId)));
    }

    @PostMapping("/release/{allocationId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<String>> releaseResource(@PathVariable Long allocationId) {
        resourceService.releaseResource(allocationId);
        return ResponseEntity.ok(ApiResponse.success("Resource released successfully", null));
    }
}

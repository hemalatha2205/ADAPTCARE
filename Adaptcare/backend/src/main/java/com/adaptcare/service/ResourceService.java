package com.adaptcare.service;

import com.adaptcare.dto.request.ResourceRequest;
import com.adaptcare.dto.response.ResourceDTO;
import com.adaptcare.entity.Appointment;
import com.adaptcare.entity.Department;
import com.adaptcare.entity.Resource;
import com.adaptcare.entity.ResourceAllocation;
import com.adaptcare.entity.enums.AllocationStatus;
import com.adaptcare.entity.enums.ResourceStatus;
import com.adaptcare.entity.enums.ResourceType;
import com.adaptcare.exception.BadRequestException;
import com.adaptcare.exception.ResourceNotFoundException;
import com.adaptcare.repository.AppointmentRepository;
import com.adaptcare.repository.DepartmentRepository;
import com.adaptcare.repository.ResourceAllocationRepository;
import com.adaptcare.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final ResourceAllocationRepository allocationRepository;
    private final DepartmentRepository departmentRepository;
    private final AppointmentRepository appointmentRepository;
    @Lazy private final AdaptiveEngineService adaptiveEngineService;

    public List<ResourceDTO> getAllResources() {
        return resourceRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<ResourceDTO> getAvailableResources() {
        return resourceRepository.findByTypeAndStatusAndActiveTrue(ResourceType.ROOM, ResourceStatus.AVAILABLE).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<ResourceDTO> getResourcesByDepartment(Long departmentId) {
        return resourceRepository.findByDepartmentId(departmentId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public ResourceDTO getResourceById(Long id) {
        Resource r = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found: " + id));
        return toDTO(r);
    }

    @Transactional
    public ResourceDTO createResource(ResourceRequest request) {
        Department dept = null;
        if (request.getDepartmentId() != null) {
            dept = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + request.getDepartmentId()));
        }

        Resource r = Resource.builder()
                .name(request.getName())
                .type(request.getType())
                .department(dept)
                .status(ResourceStatus.AVAILABLE)
                .location(request.getLocation())
                .description(request.getDescription())
                .active(true)
                .build();

        return toDTO(resourceRepository.save(r));
    }

    @Transactional
    public ResourceDTO updateResource(Long id, ResourceRequest request) {
        Resource r = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found: " + id));

        if (request.getName() != null) r.setName(request.getName());
        if (request.getType() != null) r.setType(request.getType());
        if (request.getLocation() != null) r.setLocation(request.getLocation());
        if (request.getDescription() != null) r.setDescription(request.getDescription());
        if (request.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + request.getDepartmentId()));
            r.setDepartment(dept);
        }

        return toDTO(resourceRepository.save(r));
    }

    @Transactional
    public ResourceDTO updateStatus(Long id, ResourceStatus status) {
        Resource r = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found: " + id));
        r.setStatus(status);
        r = resourceRepository.save(r);

        if (status == ResourceStatus.UNAVAILABLE) {
            try {
                adaptiveEngineService.handleResourceShortage(id);
            } catch (Exception e) {
                // Adaptive engine will log or skip if cooldown
            }
        }

        return toDTO(r);
    }

    @Transactional
    public ResourceAllocation allocateResource(Long resourceId, Long appointmentId) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found: " + resourceId));

        if (resource.getStatus() != ResourceStatus.AVAILABLE) {
            throw new BadRequestException("Resource " + resource.getName() + " is currently " + resource.getStatus());
        }

        Appointment app = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));

        resource.setStatus(ResourceStatus.OCCUPIED);
        resourceRepository.save(resource);

        ResourceAllocation allocation = ResourceAllocation.builder()
                .resource(resource)
                .appointment(app)
                .allocatedAt(LocalDateTime.now())
                .status(AllocationStatus.ALLOCATED)
                .build();

        return allocationRepository.save(allocation);
    }

    @Transactional
    public void releaseResource(Long allocationId) {
        ResourceAllocation allocation = allocationRepository.findById(allocationId)
                .orElseThrow(() -> new ResourceNotFoundException("Allocation not found: " + allocationId));

        allocation.setStatus(AllocationStatus.RELEASED);
        allocation.setReleasedAt(LocalDateTime.now());
        allocationRepository.save(allocation);

        Resource resource = allocation.getResource();
        resource.setStatus(ResourceStatus.AVAILABLE);
        resourceRepository.save(resource);
    }

    public ResourceDTO toDTO(Resource r) {
        return ResourceDTO.builder()
                .id(r.getId())
                .name(r.getName())
                .type(r.getType())
                .departmentId(r.getDepartment() != null ? r.getDepartment().getId() : null)
                .departmentName(r.getDepartment() != null ? r.getDepartment().getName() : null)
                .status(r.getStatus())
                .location(r.getLocation())
                .description(r.getDescription())
                .active(r.isActive())
                .build();
    }
}

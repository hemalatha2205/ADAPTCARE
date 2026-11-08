package com.adaptcare.service;

import com.adaptcare.dto.request.DepartmentRequest;
import com.adaptcare.dto.response.DepartmentDTO;
import com.adaptcare.entity.Department;
import com.adaptcare.exception.DuplicateResourceException;
import com.adaptcare.exception.ResourceNotFoundException;
import com.adaptcare.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public List<DepartmentDTO> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<DepartmentDTO> getActiveDepartments() {
        return departmentRepository.findByActiveTrue().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public DepartmentDTO getDepartmentById(Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));
        return toDTO(dept);
    }

    @Transactional
    public DepartmentDTO createDepartment(DepartmentRequest request) {
        if (departmentRepository.existsByNameIgnoreCase(request.getName())) {
            throw new DuplicateResourceException("Department with name already exists: " + request.getName());
        }

        Department dept = Department.builder()
                .name(request.getName())
                .description(request.getDescription())
                .location(request.getLocation())
                .active(true)
                .build();

        return toDTO(departmentRepository.save(dept));
    }

    @Transactional
    public DepartmentDTO updateDepartment(Long id, DepartmentRequest request) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));

        dept.setName(request.getName());
        dept.setDescription(request.getDescription());
        dept.setLocation(request.getLocation());

        return toDTO(departmentRepository.save(dept));
    }

    @Transactional
    public DepartmentDTO toggleActive(Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));
        dept.setActive(!dept.isActive());
        return toDTO(departmentRepository.save(dept));
    }

    public DepartmentDTO toDTO(Department dept) {
        return DepartmentDTO.builder()
                .id(dept.getId())
                .name(dept.getName())
                .description(dept.getDescription())
                .location(dept.getLocation())
                .active(dept.isActive())
                .build();
    }
}

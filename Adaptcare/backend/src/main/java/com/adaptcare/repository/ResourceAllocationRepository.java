package com.adaptcare.repository;

import com.adaptcare.entity.ResourceAllocation;
import com.adaptcare.entity.enums.AllocationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceAllocationRepository extends JpaRepository<ResourceAllocation, Long> {
    List<ResourceAllocation> findByAppointmentId(Long appointmentId);
    List<ResourceAllocation> findByResourceIdAndStatus(Long resourceId, AllocationStatus status);
    boolean existsByResourceIdAndStatusAndReleasedAtIsNull(Long resourceId, AllocationStatus status);
}

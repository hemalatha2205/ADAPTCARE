package com.adaptcare.repository;

import com.adaptcare.entity.Resource;
import com.adaptcare.entity.enums.ResourceStatus;
import com.adaptcare.entity.enums.ResourceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {
    Optional<Resource> findByName(String name);
    List<Resource> findByDepartmentId(Long departmentId);
    List<Resource> findByTypeAndStatus(ResourceType type, ResourceStatus status);
    List<Resource> findByStatusAndDepartmentId(ResourceStatus status, Long departmentId);
    List<Resource> findByActiveTrue();
    List<Resource> findByTypeAndStatusAndActiveTrue(ResourceType type, ResourceStatus status);
}

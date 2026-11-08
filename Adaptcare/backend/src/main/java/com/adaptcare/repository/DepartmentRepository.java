package com.adaptcare.repository;

import com.adaptcare.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    Optional<Department> findByName(String name);
    List<Department> findByActiveTrue();
    boolean existsByName(String name);
    boolean existsByNameIgnoreCase(String name);
}

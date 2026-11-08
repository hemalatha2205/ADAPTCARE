package com.adaptcare.repository;

import com.adaptcare.entity.Department;
import com.adaptcare.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    List<Doctor> findByDepartment(Department department);
    List<Doctor> findByDepartmentAndActiveTrue(Department department);
    Optional<Doctor> findByUserEmail(String email);
    Optional<Doctor> findByUserId(Long userId);
    List<Doctor> findByActiveTrue();
    List<Doctor> findByActiveFalse();
    List<Doctor> findByDepartmentId(Long departmentId);

    @Query("SELECT d FROM Doctor d WHERE d.department = :department AND d.active = true " +
           "AND d.id NOT IN (SELECT a.doctor.id FROM Appointment a WHERE a.appointmentDate = :date " +
           "AND a.status NOT IN ('CANCELLED', 'RESCHEDULED') " +
           "GROUP BY a.doctor.id HAVING COUNT(a) >= d.maxDailyAppointments)")
    List<Doctor> findAvailableDoctorsByDepartmentAndDate(
            @Param("department") Department department,
            @Param("date") LocalDate date);
}

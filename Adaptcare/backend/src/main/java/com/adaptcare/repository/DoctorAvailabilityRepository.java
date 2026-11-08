package com.adaptcare.repository;

import com.adaptcare.entity.Doctor;
import com.adaptcare.entity.DoctorAvailability;
import com.adaptcare.entity.enums.DayOfWeekEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DoctorAvailabilityRepository extends JpaRepository<DoctorAvailability, Long> {
    List<DoctorAvailability> findByDoctor(Doctor doctor);
    List<DoctorAvailability> findByDoctorAndDayOfWeek(Doctor doctor, DayOfWeekEnum dayOfWeek);
    List<DoctorAvailability> findByDoctorAndAvailableTrue(Doctor doctor);
    List<DoctorAvailability> findByDoctorId(Long doctorId);
    void deleteByDoctor(Doctor doctor);
}

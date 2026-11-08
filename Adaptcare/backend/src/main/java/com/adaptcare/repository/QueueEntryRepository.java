package com.adaptcare.repository;

import com.adaptcare.entity.Doctor;
import com.adaptcare.entity.QueueEntry;
import com.adaptcare.entity.User;
import com.adaptcare.entity.enums.QueueStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QueueEntryRepository extends JpaRepository<QueueEntry, Long> {
    List<QueueEntry> findByDoctorAndStatusIn(Doctor doctor, List<QueueStatus> statuses);
    List<QueueEntry> findByPatientAndStatus(User patient, QueueStatus status);
    List<QueueEntry> findByDepartmentIdAndStatusOrderByPositionAsc(Long departmentId, QueueStatus status);
    List<QueueEntry> findByDepartmentIdAndStatusInOrderByPositionAsc(Long departmentId, List<QueueStatus> statuses);
    long countByDoctorAndStatus(Doctor doctor, QueueStatus status);
    Optional<QueueEntry> findTopByDoctorOrderByQueueNumberDesc(Doctor doctor);
    List<QueueEntry> findByDoctorAndStatusOrderByPositionAsc(Doctor doctor, QueueStatus status);
    List<QueueEntry> findByDoctorAndStatusInOrderByPriorityAscPositionAsc(Doctor doctor, List<QueueStatus> statuses);
    Optional<QueueEntry> findByAppointmentId(Long appointmentId);
}

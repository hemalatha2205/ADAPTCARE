package com.adaptcare.repository;

import com.adaptcare.entity.Appointment;
import com.adaptcare.entity.Doctor;
import com.adaptcare.entity.User;
import com.adaptcare.entity.enums.AppointmentStatus;
import com.adaptcare.entity.enums.AppointmentType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByPatient(User patient);
    List<Appointment> findByPatientOrderByAppointmentDateDescStartTimeDesc(User patient);
    Page<Appointment> findByPatient(User patient, Pageable pageable);
    List<Appointment> findByDoctor(Doctor doctor);
    List<Appointment> findByDoctorOrderByAppointmentDateAscStartTimeAsc(Doctor doctor);
    List<Appointment> findByDoctorAndAppointmentDate(Doctor doctor, LocalDate date);
    List<Appointment> findByDoctorAndAppointmentDateOrderByStartTimeAsc(Doctor doctor, LocalDate date);
    List<Appointment> findByPatientAndStatus(User patient, AppointmentStatus status);
    List<Appointment> findByAppointmentDateBetween(LocalDate start, LocalDate end);
    Optional<Appointment> findByDoctorAndAppointmentDateAndStartTime(Doctor doctor, LocalDate date, java.time.LocalTime startTime);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.doctor = :doctor AND a.appointmentDate = :date AND a.status <> :status")
    long countByDoctorAndAppointmentDateAndStatusNot(@Param("doctor") Doctor doctor,
                                                     @Param("date") LocalDate date,
                                                     @Param("status") AppointmentStatus status);

    List<Appointment> findByDoctorAndAppointmentDateAfterAndStatusIn(Doctor doctor, LocalDate date, List<AppointmentStatus> statuses);
    List<Appointment> findByDoctorAndAppointmentDateAndStatusIn(Doctor doctor, LocalDate date, List<AppointmentStatus> statuses);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.department.id = :deptId AND a.appointmentDate BETWEEN :start AND :end")
    int countByDepartmentIdAndAppointmentDateBetween(@Param("deptId") Long departmentId,
                                                     @Param("start") LocalDate start,
                                                     @Param("end") LocalDate end);

    long countByDepartment_IdAndAppointmentDateBetween(
        @Param("deptId") Long departmentId,
        @Param("start") LocalDate start,
        @Param("end") LocalDate end
    );

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.appointmentDate = :date AND a.status = :status")
    long countByAppointmentDateAndStatus(@Param("date") LocalDate date, @Param("status") AppointmentStatus status);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.appointmentDate = :date AND a.type = :type AND a.status <> 'CANCELLED'")
    long countByAppointmentDateAndType(@Param("date") LocalDate date, @Param("type") AppointmentType type);

    List<Appointment> findByAppointmentDate(LocalDate date);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.appointmentDate = :date AND a.status <> 'CANCELLED'")
    long countByAppointmentDate(@Param("date") LocalDate date);

    List<Appointment> findByDoctorIdAndAppointmentDateAndStatusNot(Long doctorId, LocalDate date, AppointmentStatus status);

    List<Appointment> findByDoctorAndStatusIn(Doctor doctor, List<AppointmentStatus> statuses);
}

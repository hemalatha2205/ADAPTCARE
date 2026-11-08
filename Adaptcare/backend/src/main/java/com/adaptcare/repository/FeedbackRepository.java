package com.adaptcare.repository;

import com.adaptcare.entity.Appointment;
import com.adaptcare.entity.Doctor;
import com.adaptcare.entity.Feedback;
import com.adaptcare.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    Optional<Feedback> findByAppointment(Appointment appointment);
    boolean existsByAppointment(Appointment appointment);
    List<Feedback> findByPatient(User patient);
    List<Feedback> findByPatientOrderByCreatedAtDesc(User patient);
    List<Feedback> findByDoctor(Doctor doctor);
    List<Feedback> findByDoctorOrderByCreatedAtDesc(Doctor doctor);
    List<Feedback> findByDoctorAndCreatedAtBetween(Doctor doctor, LocalDateTime start, LocalDateTime end);

    @Query("SELECT AVG(f.rating) FROM Feedback f WHERE f.doctor = :doctor")
    Double avgRatingByDoctor(@Param("doctor") Doctor doctor);

    List<Feedback> findByRatingLessThanEqual(int maxRating);

    @Query("SELECT AVG(f.rating) FROM Feedback f WHERE f.doctor.id = :doctorId")
    Double avgRatingByDoctorId(@Param("doctorId") Long doctorId);

    List<Feedback> findByCreatedAtAfter(LocalDateTime since);
}

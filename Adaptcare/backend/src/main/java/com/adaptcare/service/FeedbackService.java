package com.adaptcare.service;

import com.adaptcare.dto.request.FeedbackRequest;
import com.adaptcare.dto.response.FeedbackDTO;
import com.adaptcare.entity.Appointment;
import com.adaptcare.entity.Doctor;
import com.adaptcare.entity.Feedback;
import com.adaptcare.entity.User;
import com.adaptcare.exception.BadRequestException;
import com.adaptcare.exception.ResourceNotFoundException;
import com.adaptcare.repository.AppointmentRepository;
import com.adaptcare.repository.DoctorRepository;
import com.adaptcare.repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;

    @Transactional
    public FeedbackDTO submitFeedback(FeedbackRequest request, User patient) {
        Appointment appointment = null;
        Doctor doctor = null;

        if (request.getAppointmentId() != null) {
            appointment = appointmentRepository.findById(request.getAppointmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + request.getAppointmentId()));

            if (!appointment.getPatient().getId().equals(patient.getId())) {
                throw new BadRequestException("You can only submit feedback for your own appointments");
            }

            doctor = appointment.getDoctor();

            // Check if feedback already submitted for this appointment
            if (feedbackRepository.findByAppointment(appointment).isPresent()) {
                throw new BadRequestException("Feedback has already been submitted for this consultation");
            }
        } else if (request.getDoctorId() != null) {
            doctor = doctorRepository.findById(request.getDoctorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + request.getDoctorId()));
        } else {
            throw new BadRequestException("Either appointmentId or doctorId must be provided");
        }

        Feedback feedback = Feedback.builder()
                .appointment(appointment)
                .patient(patient)
                .doctor(doctor)
                .rating(request.getRating())
                .comment(request.getComment())
                .category(request.getCategory() != null ? request.getCategory() : com.adaptcare.entity.enums.FeedbackCategory.OVERALL)
                .build();

        return toDTO(feedbackRepository.save(feedback));
    }

    public List<FeedbackDTO> getPatientFeedback(User patient) {
        return feedbackRepository.findByPatientOrderByCreatedAtDesc(patient).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<FeedbackDTO> getDoctorFeedback(Long doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + doctorId));

        return feedbackRepository.findByDoctorOrderByCreatedAtDesc(doctor).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Double getDoctorAverageRating(Long doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + doctorId));
        Double avg = feedbackRepository.avgRatingByDoctor(doctor);
        return avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0;
    }

    public FeedbackDTO toDTO(Feedback f) {
        return FeedbackDTO.builder()
                .id(f.getId())
                .appointmentId(f.getAppointment() != null ? f.getAppointment().getId() : null)
                .patientId(f.getPatient().getId())
                .patientName(f.getPatient().getFirstName() + " " + f.getPatient().getLastName())
                .doctorId(f.getDoctor().getId())
                .doctorName("Dr. " + f.getDoctor().getUser().getFirstName() + " " + f.getDoctor().getUser().getLastName())
                .rating(f.getRating())
                .comment(f.getComment())
                .category(f.getCategory())
                .createdAt(f.getCreatedAt())
                .build();
    }
}

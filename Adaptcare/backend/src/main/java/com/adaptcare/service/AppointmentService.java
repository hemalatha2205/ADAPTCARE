package com.adaptcare.service;

import com.adaptcare.dto.request.AppointmentRequest;
import com.adaptcare.dto.response.AppointmentResponse;
import com.adaptcare.dto.response.AvailableSlotResponse;
import com.adaptcare.entity.Appointment;
import com.adaptcare.entity.Department;
import com.adaptcare.entity.Doctor;
import com.adaptcare.entity.DoctorAvailability;
import com.adaptcare.entity.User;
import com.adaptcare.entity.enums.AppointmentStatus;
import com.adaptcare.entity.enums.AppointmentType;
import com.adaptcare.entity.enums.DayOfWeekEnum;
import com.adaptcare.entity.enums.NotificationType;
import com.adaptcare.entity.enums.Role;
import com.adaptcare.exception.BadRequestException;
import com.adaptcare.exception.ResourceNotFoundException;
import com.adaptcare.exception.SlotNotAvailableException;
import com.adaptcare.repository.AppointmentRepository;
import com.adaptcare.repository.DoctorAvailabilityRepository;
import com.adaptcare.repository.DoctorRepository;
import com.adaptcare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final DoctorAvailabilityRepository availabilityRepository;
    private final QueueService queueService;
    private final com.adaptcare.repository.QueueEntryRepository queueEntryRepository;
    private final NotificationService notificationService;
    private final SseService sseService;
    @Lazy private final AdaptiveEngineService adaptiveEngineService;

    @Transactional
    public AppointmentResponse bookAppointment(AppointmentRequest request, User currentUser) {
        User patient;
        if (currentUser.getRole() == Role.PATIENT) {
            patient = currentUser;
        } else {
            // Receptionist or Admin booking on behalf of patient
            if (request.getPatientId() == null) {
                throw new BadRequestException("Patient ID is required when booking on behalf of a patient");
            }
            patient = userRepository.findById(request.getPatientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + request.getPatientId()));
        }

        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + request.getDoctorId()));

        if (!doctor.isActive()) {
            throw new BadRequestException("Doctor is currently inactive or not available for bookings");
        }

        LocalDate appDate = request.getAppointmentDate();
        if (appDate.isBefore(LocalDate.now())) {
            throw new BadRequestException("Cannot book appointment in the past");
        }

        LocalTime startTime = request.getStartTime();
        int duration = doctor.getConsultationDuration() > 0 ? doctor.getConsultationDuration() : 20;
        LocalTime endTime = startTime.plusMinutes(duration);

        // Check for double booking conflict
        Optional<Appointment> conflict = appointmentRepository.findByDoctorAndAppointmentDateAndStartTime(doctor, appDate, startTime);
        if (conflict.isPresent() && conflict.get().getStatus() != AppointmentStatus.CANCELLED) {
            throw new SlotNotAvailableException("The selected slot " + startTime + " is already booked for Dr. " +
                    doctor.getUser().getLastName() + ". Please choose another slot.");
        }

        Department department = doctor.getDepartment();
        AppointmentType type = request.getType() != null ? request.getType() : AppointmentType.REGULAR;
        int priority = type == AppointmentType.EMERGENCY ? 1 : 3;

        Appointment appointment;
        if (conflict.isPresent() && conflict.get().getStatus() == AppointmentStatus.CANCELLED) {
            // Reuse cancelled slot to safely avoid MySQL unique constraint collision
            appointment = conflict.get();
            appointment.setPatient(patient);
            appointment.setDoctor(doctor);
            appointment.setDepartment(department);
            appointment.setAppointmentDate(appDate);
            appointment.setStartTime(startTime);
            appointment.setEndTime(endTime);
            appointment.setStatus(AppointmentStatus.CONFIRMED);
            appointment.setType(type);
            appointment.setPriority(priority);
            appointment.setReason(request.getReason());
            appointment.setBookedBy(currentUser);
            appointment.setNotes(null);
            appointment.setQueueNumber(null);
            appointment.setEstimatedWaitTime(null);
        } else {
            appointment = Appointment.builder()
                    .patient(patient)
                    .doctor(doctor)
                    .department(department)
                    .appointmentDate(appDate)
                    .startTime(startTime)
                    .endTime(endTime)
                    .status(AppointmentStatus.CONFIRMED)
                    .type(type)
                    .priority(priority)
                    .reason(request.getReason())
                    .bookedBy(currentUser)
                    .build();
        }

        appointment = appointmentRepository.save(appointment);

        // A confirmed appointment is not prematurely in the live queue.
        // Only immediate emergencies booked for today auto-queue for triage.
        if (type == AppointmentType.EMERGENCY && appDate.equals(LocalDate.now())) {
            queueService.addToQueue(appointment);
        }

        // Notify patient
        notificationService.createNotification(
                patient,
                "Appointment Confirmed",
                String.format("Your appointment with Dr. %s %s is confirmed for %s at %s.",
                        doctor.getUser().getFirstName(), doctor.getUser().getLastName(), appDate, startTime),
                NotificationType.APPOINTMENT_BOOKED,
                appointment.getId(),
                "APPOINTMENT"
        );

        // Notify doctor
        notificationService.createNotification(
                doctor.getUser(),
                "New Appointment Booked",
                String.format("New %s appointment with %s %s on %s at %s.",
                        type, patient.getFirstName(), patient.getLastName(), appDate, startTime),
                NotificationType.APPOINTMENT_BOOKED,
                appointment.getId(),
                "APPOINTMENT"
        );

        sseService.broadcast("APPOINTMENT_CREATED", toResponse(appointment));

        // If emergency, trigger adaptive evaluation for surge
        if (type == AppointmentType.EMERGENCY) {
            try {
                adaptiveEngineService.handleEmergencySurge();
            } catch (Exception e) {
                log.warn("Emergency surge evaluation failed: {}", e.getMessage());
            }
        }

        return toResponse(appointment);
    }

    public List<AppointmentResponse> getPatientAppointments(User patient) {
        return appointmentRepository.findByPatientOrderByAppointmentDateDescStartTimeDesc(patient).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<AppointmentResponse> getDoctorAppointments(Long doctorId, LocalDate date) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + doctorId));

        if (date != null) {
            return appointmentRepository.findByDoctorAndAppointmentDateOrderByStartTimeAsc(doctor, date).stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }
        return appointmentRepository.findByDoctorOrderByAppointmentDateAscStartTimeAsc(doctor).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public AppointmentResponse getAppointmentById(Long id, User currentUser) {
        Appointment app = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + id));

        // Enforce privacy: patient can only view own appointment
        if (currentUser.getRole() == Role.PATIENT && !app.getPatient().getId().equals(currentUser.getId())) {
            throw new ResourceNotFoundException("Appointment not found");
        }

        return toResponse(app);
    }

    @Transactional
    public AppointmentResponse cancelAppointment(Long id, User currentUser) {
        Appointment app = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + id));

        if (currentUser.getRole() == Role.PATIENT && !app.getPatient().getId().equals(currentUser.getId())) {
            throw new BadRequestException("You can only cancel your own appointments");
        }

        app.setStatus(AppointmentStatus.CANCELLED);
        Appointment savedApp = appointmentRepository.save(app);
        final Long docId = savedApp.getDoctor() != null ? savedApp.getDoctor().getId() : null;

        // Synchronize QueueEntry state
        queueEntryRepository.findByAppointmentId(savedApp.getId()).ifPresent(qe -> {
            qe.setStatus(com.adaptcare.entity.enums.QueueStatus.CANCELLED);
            qe.setCompletedAt(java.time.LocalDateTime.now());
            queueEntryRepository.save(qe);
            if (docId != null) {
                queueService.recalculateQueue(docId);
            }
        });

        notificationService.createNotification(
                savedApp.getPatient(),
                "Appointment Cancelled",
                "Your appointment on " + savedApp.getAppointmentDate() + " at " + savedApp.getStartTime() + " has been cancelled.",
                NotificationType.APPOINTMENT_CANCELLED,
                savedApp.getId(),
                "APPOINTMENT"
        );

        sseService.broadcast("APPOINTMENT_UPDATED", toResponse(savedApp));

        return toResponse(savedApp);
    }

    @Transactional
    public AppointmentResponse updateStatus(Long id, AppointmentStatus status) {
        Appointment app = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + id));

        app.setStatus(status);
        Appointment savedApp = appointmentRepository.save(app);
        final Long docId = savedApp.getDoctor() != null ? savedApp.getDoctor().getId() : null;

        // Synchronize with active QueueEntry
        queueEntryRepository.findByAppointmentId(savedApp.getId()).ifPresent(qe -> {
            if (status == AppointmentStatus.IN_PROGRESS) {
                qe.setStatus(com.adaptcare.entity.enums.QueueStatus.IN_PROGRESS);
                qe.setStartedAt(java.time.LocalDateTime.now());
            } else if (status == AppointmentStatus.COMPLETED) {
                qe.setStatus(com.adaptcare.entity.enums.QueueStatus.COMPLETED);
                qe.setCompletedAt(java.time.LocalDateTime.now());
            } else if (status == AppointmentStatus.CANCELLED) {
                qe.setStatus(com.adaptcare.entity.enums.QueueStatus.CANCELLED);
                qe.setCompletedAt(java.time.LocalDateTime.now());
            } else if (status == AppointmentStatus.NO_SHOW) {
                qe.setStatus(com.adaptcare.entity.enums.QueueStatus.SKIPPED);
                qe.setCompletedAt(java.time.LocalDateTime.now());
            }
            queueEntryRepository.save(qe);
            if (docId != null) {
                queueService.recalculateQueue(docId);
            }
        });

        sseService.broadcast("APPOINTMENT_UPDATED", toResponse(savedApp));

        return toResponse(savedApp);
    }

    @Transactional
    public AppointmentResponse updatePriority(Long id, int priority) {
        Appointment app = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + id));

        app.setPriority(priority);
        app = appointmentRepository.save(app);

        // If today's appointment, recalculate queue
        if (app.getAppointmentDate().equals(LocalDate.now())) {
            queueService.recalculateQueue(app.getDoctor().getId());
        }

        sseService.broadcast("APPOINTMENT_UPDATED", toResponse(app));
        return toResponse(app);
    }

    public List<AvailableSlotResponse> getAvailableSlots(Long doctorId, LocalDate date) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + doctorId));

        if (!doctor.isActive()) {
            return List.of();
        }

        // Clinic is closed on Sunday
        if (date.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
            return List.of();
        }

        DayOfWeekEnum dayOfWeek = DayOfWeekEnum.valueOf(date.getDayOfWeek().name());
        List<DoctorAvailability> availabilities = availabilityRepository.findByDoctorAndDayOfWeek(doctor, dayOfWeek);

        LocalTime windowStart = LocalTime.of(9, 0);
        LocalTime windowEnd = LocalTime.of(17, 0);

        if (!availabilities.isEmpty()) {
            DoctorAvailability da = availabilities.get(0);
            if (!da.isAvailable()) {
                return List.of();
            }
            windowStart = da.getStartTime() != null ? da.getStartTime() : windowStart;
            windowEnd = da.getEndTime() != null ? da.getEndTime() : windowEnd;
        }

        // Get booked appointments for this date
        List<Appointment> booked = appointmentRepository.findByDoctorAndAppointmentDate(doctor, date);
        Set<LocalTime> bookedTimes = booked.stream()
                .filter(a -> a.getStatus() != AppointmentStatus.CANCELLED)
                .map(Appointment::getStartTime)
                .collect(Collectors.toSet());

        int duration = doctor.getConsultationDuration() > 0 ? doctor.getConsultationDuration() : 20;
        List<AvailableSlotResponse> slots = new ArrayList<>();

        LocalTime current = windowStart;
        while (!current.plusMinutes(duration).isAfter(windowEnd)) {
            LocalTime slotEnd = current.plusMinutes(duration);
            boolean isPast = date.equals(LocalDate.now()) && !current.isAfter(LocalTime.now());

            if (!bookedTimes.contains(current) && !isPast) {
                slots.add(AvailableSlotResponse.builder()
                        .date(date)
                        .startTime(current)
                        .endTime(slotEnd)
                        .doctorId(doctor.getId())
                        .doctorName(DoctorService.formatDoctorName(doctor.getUser().getFirstName(), doctor.getUser().getLastName()))
                        .departmentId(doctor.getDepartment() != null ? doctor.getDepartment().getId() : null)
                        .departmentName(doctor.getDepartment() != null ? doctor.getDepartment().getName() : null)
                        .build());
            }
            current = slotEnd;
        }

        return slots;
    }

    public List<AppointmentResponse> getTodayAppointments() {
        return appointmentRepository.findByAppointmentDate(LocalDate.now()).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<AppointmentResponse> getAppointmentsByDateRange(LocalDate start, LocalDate end) {
        return appointmentRepository.findByAppointmentDateBetween(start, end).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public AppointmentResponse toResponse(Appointment a) {
        return AppointmentResponse.builder()
                .id(a.getId())
                .patientId(a.getPatient().getId())
                .patientName(a.getPatient().getFirstName() + " " + a.getPatient().getLastName())
                .patientEmail(a.getPatient().getEmail())
                .doctorId(a.getDoctor().getId())
                .doctorName("Dr. " + a.getDoctor().getUser().getFirstName() + " " + a.getDoctor().getUser().getLastName())
                .doctorSpecialization(a.getDoctor().getSpecialization())
                .departmentId(a.getDepartment() != null ? a.getDepartment().getId() : null)
                .departmentName(a.getDepartment() != null ? a.getDepartment().getName() : null)
                .appointmentDate(a.getAppointmentDate())
                .startTime(a.getStartTime())
                .endTime(a.getEndTime())
                .status(a.getStatus())
                .type(a.getType())
                .priority(a.getPriority())
                .reason(a.getReason())
                .notes(a.getNotes())
                .queueNumber(a.getQueueNumber())
                .estimatedWaitTime(a.getEstimatedWaitTime())
                .createdAt(a.getCreatedAt())
                .build();
    }
}

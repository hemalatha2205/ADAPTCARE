package com.adaptcare.service;

import com.adaptcare.dto.response.QueueEntryDTO;
import com.adaptcare.entity.Appointment;
import com.adaptcare.entity.Doctor;
import com.adaptcare.entity.QueueEntry;
import com.adaptcare.entity.User;
import com.adaptcare.entity.enums.QueueStatus;
import com.adaptcare.exception.ResourceNotFoundException;
import com.adaptcare.repository.AppointmentRepository;
import com.adaptcare.repository.DoctorRepository;
import com.adaptcare.repository.QueueEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class QueueService {

    private final QueueEntryRepository queueEntryRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final SseService sseService;

    @Transactional
    public QueueEntryDTO addToQueue(Appointment appointment) {
        Doctor doctor = appointment.getDoctor();

        // Calculate next queue number for this doctor today
        int nextQueueNumber = queueEntryRepository.findTopByDoctorOrderByQueueNumberDesc(doctor)
                .map(q -> q.getQueueNumber() + 1)
                .orElse(1);

        // Calculate position based on waiting patients
        List<QueueEntry> waiting = queueEntryRepository.findByDoctorAndStatusOrderByPositionAsc(doctor, QueueStatus.WAITING);
        int nextPosition = waiting.size() + 1;

        int estimatedWait = calculateEstimatedWait(doctor, nextPosition, appointment.getPriority());

        QueueEntry entry = QueueEntry.builder()
                .appointment(appointment)
                .doctor(doctor)
                .patient(appointment.getPatient())
                .department(appointment.getDepartment())
                .queueNumber(nextQueueNumber)
                .position(nextPosition)
                .estimatedWaitTime(estimatedWait)
                .priority(appointment.getPriority())
                .status(QueueStatus.WAITING)
                .checkedInAt(LocalDateTime.now())
                .build();

        entry = queueEntryRepository.save(entry);

        appointment.setQueueNumber(nextQueueNumber);
        appointment.setEstimatedWaitTime(estimatedWait);
        appointmentRepository.save(appointment);

        recalculateQueue(doctor.getId());

        sseService.broadcast("QUEUE_UPDATE", toDTO(entry));

        return toDTO(entry);
    }

    @Transactional
    public QueueEntryDTO checkInAppointment(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));

        if (appointment.getStatus() == com.adaptcare.entity.enums.AppointmentStatus.CANCELLED) {
            throw new com.adaptcare.exception.BadRequestException("Cannot check in a cancelled appointment");
        }
        if (appointment.getStatus() == com.adaptcare.entity.enums.AppointmentStatus.COMPLETED) {
            throw new com.adaptcare.exception.BadRequestException("Appointment is already completed");
        }

        // Idempotent: if already checked in, return existing active entry
        Optional<QueueEntry> existing = queueEntryRepository.findByAppointmentId(appointmentId);
        if (existing.isPresent() && (existing.get().getStatus() == QueueStatus.WAITING || existing.get().getStatus() == QueueStatus.IN_PROGRESS)) {
            return toDTO(existing.get());
        }

        appointment.setStatus(com.adaptcare.entity.enums.AppointmentStatus.CONFIRMED);
        return addToQueue(appointment);
    }

    public List<QueueEntryDTO> getQueueByDoctor(Long doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + doctorId));

        return queueEntryRepository.findByDoctorAndStatusInOrderByPriorityAscPositionAsc(
                doctor, List.of(QueueStatus.WAITING, QueueStatus.IN_PROGRESS)
        ).stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<QueueEntryDTO> getQueueByDepartment(Long departmentId) {
        return queueEntryRepository.findByDepartmentIdAndStatusInOrderByPositionAsc(
                departmentId, List.of(QueueStatus.WAITING, QueueStatus.IN_PROGRESS)
        ).stream().map(this::toDTO).collect(Collectors.toList());
    }

    public QueueEntryDTO getPatientCurrentQueue(User patient) {
        List<QueueEntry> entries = queueEntryRepository.findByPatientAndStatus(patient, QueueStatus.WAITING);
        if (entries.isEmpty()) {
            List<QueueEntry> inProgress = queueEntryRepository.findByPatientAndStatus(patient, QueueStatus.IN_PROGRESS);
            if (!inProgress.isEmpty()) {
                return toDTO(inProgress.get(0));
            }
            return null;
        }
        return toDTO(entries.get(0));
    }

    public QueueEntryDTO getQueueEntryByAppointmentId(Long appointmentId) {
        return queueEntryRepository.findByAppointmentId(appointmentId)
                .map(this::toDTO)
                .orElse(null);
    }

    @Transactional
    public QueueEntryDTO updateQueueStatus(Long queueId, QueueStatus status) {
        QueueEntry entry = queueEntryRepository.findById(queueId)
                .orElseThrow(() -> new ResourceNotFoundException("Queue entry not found: " + queueId));

        entry.setStatus(status);
        if (status == QueueStatus.IN_PROGRESS) {
            entry.setStartedAt(LocalDateTime.now());
        } else if (status == QueueStatus.COMPLETED || status == QueueStatus.SKIPPED || status == QueueStatus.CANCELLED) {
            entry.setCompletedAt(LocalDateTime.now());
        }

        entry = queueEntryRepository.save(entry);

        recalculateQueue(entry.getDoctor().getId());
        sseService.broadcast("QUEUE_UPDATE", toDTO(entry));

        return toDTO(entry);
    }

    @Transactional
    public void recalculateQueue(Long doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + doctorId));

        List<QueueEntry> waiting = queueEntryRepository.findByDoctorAndStatusOrderByPositionAsc(doctor, QueueStatus.WAITING);

        // Sort by priority first (1 is emergency, 5 is lowest), then by check-in time / queue number
        waiting.sort(Comparator
                .comparingInt(QueueEntry::getPriority)
                .thenComparingInt(QueueEntry::getQueueNumber));

        int duration = doctor.getConsultationDuration() > 0 ? doctor.getConsultationDuration() : 15;

        for (int i = 0; i < waiting.size(); i++) {
            QueueEntry qe = waiting.get(i);
            int newPos = i + 1;
            int estWait = i * duration;
            qe.setPosition(newPos);
            qe.setEstimatedWaitTime(estWait);
            queueEntryRepository.save(qe);

            if (qe.getAppointment() != null) {
                qe.getAppointment().setEstimatedWaitTime(estWait);
                appointmentRepository.save(qe.getAppointment());
            }
        }
    }

    private int calculateEstimatedWait(Doctor doctor, int position, int priority) {
        int duration = doctor.getConsultationDuration() > 0 ? doctor.getConsultationDuration() : 15;
        int wait = (position - 1) * duration;
        if (priority == 1) { // Emergency
            return 0;
        }
        return Math.max(0, wait);
    }

    public QueueEntryDTO toDTO(QueueEntry q) {
        return QueueEntryDTO.builder()
                .id(q.getId())
                .appointmentId(q.getAppointment() != null ? q.getAppointment().getId() : null)
                .doctorId(q.getDoctor().getId())
                .doctorName("Dr. " + q.getDoctor().getUser().getFirstName() + " " + q.getDoctor().getUser().getLastName())
                .patientId(q.getPatient().getId())
                .patientName(q.getPatient().getFirstName() + " " + q.getPatient().getLastName())
                .departmentId(q.getDepartment() != null ? q.getDepartment().getId() : null)
                .departmentName(q.getDepartment() != null ? q.getDepartment().getName() : null)
                .queueNumber(q.getQueueNumber())
                .position(q.getPosition())
                .estimatedWaitTime(q.getEstimatedWaitTime())
                .priority(q.getPriority())
                .status(q.getStatus())
                .checkedInAt(q.getCheckedInAt())
                .startedAt(q.getStartedAt())
                .completedAt(q.getCompletedAt())
                .build();
    }
}

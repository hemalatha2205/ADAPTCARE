package com.adaptcare.service;

import com.adaptcare.dto.request.DoctorRequest;
import com.adaptcare.dto.response.DoctorDTO;
import com.adaptcare.dto.response.DoctorDashboardDTO;
import com.adaptcare.entity.Department;
import com.adaptcare.entity.Doctor;
import com.adaptcare.entity.DoctorAvailability;
import com.adaptcare.entity.User;
import com.adaptcare.entity.enums.AppointmentStatus;
import com.adaptcare.entity.enums.DayOfWeekEnum;
import com.adaptcare.entity.enums.QueueStatus;
import com.adaptcare.entity.enums.Role;
import com.adaptcare.exception.BadRequestException;
import com.adaptcare.exception.ResourceNotFoundException;
import com.adaptcare.repository.AppointmentRepository;
import com.adaptcare.repository.DepartmentRepository;
import com.adaptcare.repository.DoctorAvailabilityRepository;
import com.adaptcare.repository.DoctorRepository;
import com.adaptcare.repository.QueueEntryRepository;
import com.adaptcare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final DoctorAvailabilityRepository availabilityRepository;
    private final AppointmentRepository appointmentRepository;
    private final QueueEntryRepository queueEntryRepository;
    @Lazy private final AdaptiveEngineService adaptiveEngineService;

    public List<DoctorDTO> getAllDoctors() {
        return doctorRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<DoctorDTO> getActiveDoctors() {
        return doctorRepository.findByActiveTrue().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<DoctorDTO> getPendingDoctors() {
        return doctorRepository.findByActiveFalse().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public DoctorDTO approveDoctor(Long doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + doctorId));

        doctor.setActive(true);
        User user = doctor.getUser();
        user.setActive(true);
        userRepository.save(user);
        Doctor saved = doctorRepository.save(doctor);

        // Ensure standard clinic availability exists
        List<DoctorAvailability> existing = availabilityRepository.findByDoctor(doctor);
        if (existing.isEmpty()) {
            for (DayOfWeekEnum day : DayOfWeekEnum.values()) {
                if (day != DayOfWeekEnum.SUNDAY) {
                    availabilityRepository.save(DoctorAvailability.builder()
                            .doctor(doctor)
                            .dayOfWeek(day)
                            .startTime(LocalTime.of(9, 0))
                            .endTime(LocalTime.of(17, 0))
                            .available(true)
                            .build());
                }
            }
        }

        return toDTO(saved);
    }

    @Transactional
    public void rejectDoctor(Long doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + doctorId));
        User user = doctor.getUser();
        availabilityRepository.deleteByDoctor(doctor);
        doctorRepository.delete(doctor);
        userRepository.delete(user);
    }

    public List<DoctorDTO> getDoctorsByDepartment(Long departmentId) {
        return doctorRepository.findByDepartmentId(departmentId).stream()
                .filter(Doctor::isActive)
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public DoctorDTO getDoctorById(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + id));
        return toDTO(doctor);
    }

    public DoctorDTO getDoctorByUserId(Long userId) {
        Doctor doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for user: " + userId));
        return toDTO(doctor);
    }

    public DoctorDTO getDoctorByUserEmail(String email) {
        Doctor doctor = doctorRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for email: " + email));
        return toDTO(doctor);
    }

    @Transactional
    public DoctorDTO createDoctor(DoctorRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getUserId()));

        user.setRole(Role.DOCTOR);
        userRepository.save(user);

        Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + request.getDepartmentId()));
        }

        Doctor doctor = Doctor.builder()
                .user(user)
                .department(department)
                .specialization(request.getSpecialization())
                .qualification(request.getQualification())
                .experience(request.getExperience())
                .consultationDuration(request.getConsultationDuration() > 0 ? request.getConsultationDuration() : 30)
                .maxDailyAppointments(request.getMaxDailyAppointments() > 0 ? request.getMaxDailyAppointments() : 20)
                .active(true)
                .build();

        doctor = doctorRepository.save(doctor);
        initDefaultAvailability(doctor);

        return toDTO(doctor);
    }

    @Transactional
    public DoctorDTO updateDoctor(Long id, DoctorRequest request) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + id));

        if (request.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + request.getDepartmentId()));
            doctor.setDepartment(dept);
        }

        if (request.getSpecialization() != null) doctor.setSpecialization(request.getSpecialization());
        if (request.getQualification() != null) doctor.setQualification(request.getQualification());
        if (request.getExperience() > 0) doctor.setExperience(request.getExperience());
        if (request.getConsultationDuration() > 0) doctor.setConsultationDuration(request.getConsultationDuration());
        if (request.getMaxDailyAppointments() > 0) doctor.setMaxDailyAppointments(request.getMaxDailyAppointments());

        return toDTO(doctorRepository.save(doctor));
    }

    @Transactional
    public DoctorDTO toggleActive(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + id));
        boolean willBeActive = !doctor.isActive();
        doctor.setActive(willBeActive);
        doctor = doctorRepository.save(doctor);

        if (!willBeActive) {
            try {
                adaptiveEngineService.handleDoctorUnavailability(id);
            } catch (Exception e) {
                // Ignore or log if adaptive rule already handled
            }
        }
        return toDTO(doctor);
    }

    public List<DoctorAvailability> getDoctorAvailability(Long doctorId) {
        return availabilityRepository.findByDoctorId(doctorId);
    }

    @Transactional
    public List<DoctorAvailability> setDoctorAvailability(Long doctorId, List<DoctorAvailability> availabilities) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + doctorId));

        availabilityRepository.deleteByDoctor(doctor);
        for (DoctorAvailability da : availabilities) {
            da.setDoctor(doctor);
        }
        return availabilityRepository.saveAll(availabilities);
    }

    public DoctorDashboardDTO getDoctorDashboard(Long doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + doctorId));

        LocalDate today = LocalDate.now();
        int todayAppointments = appointmentRepository.findByDoctorAndAppointmentDate(doctor, today).size();
        int currentQueue = (int) queueEntryRepository.countByDoctorAndStatus(doctor, QueueStatus.WAITING);

        return DoctorDashboardDTO.builder()
                .doctorId(doctor.getId())
                .doctorName(formatDoctorName(doctor.getUser().getFirstName(), doctor.getUser().getLastName()))
                .specialization(doctor.getSpecialization())
                .departmentName(doctor.getDepartment() != null ? doctor.getDepartment().getName() : "General")
                .todayAppointmentsCount(todayAppointments)
                .activeQueueCount(currentQueue)
                .build();
    }

    public static String formatDoctorName(String firstName, String lastName) {
        String f = firstName != null ? firstName.trim() : "";
        String l = lastName != null ? lastName.trim() : "";
        String cleanFirst = f.replaceFirst("^(?i)Dr\\.?\\s*", "").trim();
        String cleanLast = l.replaceFirst("^(?i)Dr\\.?\\s*", "").trim();
        String full = (cleanFirst + " " + cleanLast).trim();
        return full.isEmpty() ? "Dr. Physician" : "Dr. " + full;
    }

    private void initDefaultAvailability(Doctor doctor) {
        for (DayOfWeekEnum day : DayOfWeekEnum.values()) {
            if (day != DayOfWeekEnum.SUNDAY) {
                DoctorAvailability da = DoctorAvailability.builder()
                        .doctor(doctor)
                        .dayOfWeek(day)
                        .startTime(LocalTime.of(9, 0))
                        .endTime(LocalTime.of(17, 0))
                        .available(true)
                        .build();
                availabilityRepository.save(da);
            }
        }
    }

    public DoctorDTO toDTO(Doctor doctor) {
        return DoctorDTO.builder()
                .id(doctor.getId())
                .userId(doctor.getUser().getId())
                .firstName(doctor.getUser().getFirstName())
                .lastName(doctor.getUser().getLastName())
                .email(doctor.getUser().getEmail())
                .phone(doctor.getUser().getPhone())
                .departmentId(doctor.getDepartment() != null ? doctor.getDepartment().getId() : null)
                .departmentName(doctor.getDepartment() != null ? doctor.getDepartment().getName() : null)
                .specialization(doctor.getSpecialization())
                .qualification(doctor.getQualification())
                .experience(doctor.getExperience())
                .consultationDuration(doctor.getConsultationDuration())
                .maxDailyAppointments(doctor.getMaxDailyAppointments())
                .active(doctor.isActive())
                .build();
    }
}

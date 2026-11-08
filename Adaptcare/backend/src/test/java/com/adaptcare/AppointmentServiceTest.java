package com.adaptcare;

import com.adaptcare.dto.request.AppointmentRequest;
import com.adaptcare.dto.response.AppointmentResponse;
import com.adaptcare.entity.Appointment;
import com.adaptcare.entity.Department;
import com.adaptcare.entity.Doctor;
import com.adaptcare.entity.User;
import com.adaptcare.entity.enums.AppointmentStatus;
import com.adaptcare.entity.enums.AppointmentType;
import com.adaptcare.entity.enums.Role;
import com.adaptcare.exception.BadRequestException;
import com.adaptcare.exception.SlotNotAvailableException;
import com.adaptcare.repository.AppointmentRepository;
import com.adaptcare.repository.DoctorAvailabilityRepository;
import com.adaptcare.repository.DoctorRepository;
import com.adaptcare.repository.UserRepository;
import com.adaptcare.service.AppointmentService;
import com.adaptcare.service.NotificationService;
import com.adaptcare.service.QueueService;
import com.adaptcare.service.SseService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    @Mock private AppointmentRepository appointmentRepository;
    @Mock private DoctorRepository doctorRepository;
    @Mock private UserRepository userRepository;
    @Mock private DoctorAvailabilityRepository availabilityRepository;
    @Mock private QueueService queueService;
    @Mock private NotificationService notificationService;
    @Mock private SseService sseService;

    @InjectMocks
    private AppointmentService appointmentService;

    @Test
    @DisplayName("Successfully book a valid appointment for tomorrow")
    void testBookAppointmentSuccess() {
        User patient = User.builder().id(1L).firstName("Alice").lastName("Wonder").email("alice@test.com").role(Role.PATIENT).build();
        User docUser = User.builder().id(2L).firstName("Dr. Bob").lastName("Smith").email("bob@test.com").build();
        Department dept = Department.builder().id(3L).name("General Medicine").build();
        Doctor doctor = Doctor.builder().id(5L).user(docUser).department(dept).active(true).consultationDuration(30).build();

        when(doctorRepository.findById(5L)).thenReturn(Optional.of(doctor));
        when(appointmentRepository.findByDoctorAndAppointmentDateAndStartTime(any(), any(), any())).thenReturn(Optional.empty());
        when(appointmentRepository.save(any())).thenAnswer(i -> {
            Appointment a = i.getArgument(0);
            a.setId(500L);
            return a;
        });

        AppointmentRequest request = new AppointmentRequest();
        request.setDoctorId(5L);
        request.setAppointmentDate(LocalDate.now().plusDays(1));
        request.setStartTime(LocalTime.of(10, 0));
        request.setType(AppointmentType.REGULAR);
        request.setReason("General routine checkup");

        AppointmentResponse response = appointmentService.bookAppointment(request, patient);

        assertNotNull(response);
        assertEquals(500L, response.getId());
        assertEquals(AppointmentStatus.CONFIRMED, response.getStatus());
        verify(notificationService, times(2)).createNotification(any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Prevent booking in the past")
    void testPreventBookingInPast() {
        User patient = User.builder().id(1L).role(Role.PATIENT).build();
        Doctor doctor = Doctor.builder().id(5L).active(true).build();
        when(doctorRepository.findById(5L)).thenReturn(Optional.of(doctor));

        AppointmentRequest request = new AppointmentRequest();
        request.setDoctorId(5L);
        request.setAppointmentDate(LocalDate.now().minusDays(1));
        request.setStartTime(LocalTime.of(10, 0));

        assertThrows(BadRequestException.class, () -> appointmentService.bookAppointment(request, patient));
    }

    @Test
    @DisplayName("Prevent double booking the same slot")
    void testPreventDoubleBooking() {
        User patient = User.builder().id(1L).role(Role.PATIENT).build();
        User docUser = User.builder().id(2L).firstName("Dr. Bob").lastName("Smith").build();
        Doctor doctor = Doctor.builder().id(5L).user(docUser).active(true).build();

        Appointment existing = Appointment.builder().status(AppointmentStatus.CONFIRMED).build();

        when(doctorRepository.findById(5L)).thenReturn(Optional.of(doctor));
        when(appointmentRepository.findByDoctorAndAppointmentDateAndStartTime(any(), any(), any())).thenReturn(Optional.of(existing));

        AppointmentRequest request = new AppointmentRequest();
        request.setDoctorId(5L);
        request.setAppointmentDate(LocalDate.now().plusDays(1));
        request.setStartTime(LocalTime.of(10, 0));

        assertThrows(SlotNotAvailableException.class, () -> appointmentService.bookAppointment(request, patient));
    }
}

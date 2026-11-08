package com.adaptcare;

import com.adaptcare.dto.response.AdaptationEventDTO;
import com.adaptcare.entity.AdaptiveRule;
import com.adaptcare.entity.Appointment;
import com.adaptcare.entity.Doctor;
import com.adaptcare.entity.User;
import com.adaptcare.entity.enums.AppointmentStatus;
import com.adaptcare.entity.enums.AppointmentType;
import com.adaptcare.entity.enums.Role;
import com.adaptcare.entity.enums.RuleCategory;
import com.adaptcare.repository.*;
import com.adaptcare.service.AdaptiveEngineService;
import com.adaptcare.service.NotificationService;
import com.adaptcare.service.QueueService;
import com.adaptcare.service.SseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdaptiveEngineServiceTest {

    @Mock private AdaptiveRuleRepository ruleRepository;
    @Mock private AdaptationEventRepository eventRepository;
    @Mock private AppointmentRepository appointmentRepository;
    @Mock private DoctorRepository doctorRepository;
    @Mock private DoctorAvailabilityRepository availabilityRepository;
    @Mock private QueueEntryRepository queueEntryRepository;
    @Mock private ResourceRepository resourceRepository;
    @Mock private ResourceAllocationRepository allocationRepository;
    @Mock private FeedbackRepository feedbackRepository;
    @Mock private NotificationService notificationService;
    @Mock private QueueService queueService;
    @Mock private SseService sseService;

    @InjectMocks
    private AdaptiveEngineService adaptiveEngineService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(adaptiveEngineService, "defaultEmergencyThreshold", 3);
        ReflectionTestUtils.setField(adaptiveEngineService, "defaultWaitTimeThreshold", 45);
        ReflectionTestUtils.setField(adaptiveEngineService, "defaultDemandThreshold", 1.5);
    }

    @Test
    @DisplayName("Rule 1: Emergency surge prioritizes critical appointments")
    void testEmergencySurgePrioritization() {
        AdaptiveRule rule = AdaptiveRule.builder()
                .ruleId("RULE_EMERGENCY_SURGE")
                .name("Emergency Surge Prioritization")
                .category(RuleCategory.EMERGENCY)
                .thresholdValue(2.0)
                .cooldownMinutes(15)
                .enabled(true)
                .build();

        when(ruleRepository.findByRuleId("RULE_EMERGENCY_SURGE")).thenReturn(Optional.of(rule));

        User patient = User.builder().id(10L).firstName("John").lastName("Doe").build();
        User docUser = User.builder().id(20L).firstName("Dr. Smith").lastName("Johnson").build();
        Doctor doctor = Doctor.builder().id(5L).user(docUser).consultationDuration(20).build();

        Appointment app1 = Appointment.builder()
                .id(101L)
                .patient(patient)
                .doctor(doctor)
                .type(AppointmentType.EMERGENCY)
                .priority(3) // Normal priority before surge adaptation
                .appointmentDate(LocalDate.now())
                .startTime(LocalTime.of(10, 0))
                .build();

        Appointment app2 = Appointment.builder()
                .id(102L)
                .patient(patient)
                .doctor(doctor)
                .type(AppointmentType.EMERGENCY)
                .priority(3)
                .appointmentDate(LocalDate.now())
                .startTime(LocalTime.of(10, 30))
                .build();

        when(appointmentRepository.findByAppointmentDate(any(LocalDate.class)))
                .thenReturn(List.of(app1, app2));
        when(eventRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        List<AdaptationEventDTO> events = adaptiveEngineService.handleEmergencySurge();

        assertNotNull(events);
        assertEquals(2, events.size());
        assertEquals(1, app1.getPriority());
        assertEquals(1, app2.getPriority());
        verify(queueService, times(2)).recalculateQueue(5L);
        verify(ruleRepository).save(rule);
    }

    @Test
    @DisplayName("Dry-run Simulation: Returns valid simulation output without DB modifications")
    void testDryRunSimulation() {
        Map<String, Object> simulation = adaptiveEngineService.simulateRule("RULE_EMERGENCY_SURGE");

        assertNotNull(simulation);
        assertEquals("RULE_EMERGENCY_SURGE", simulation.get("ruleId"));
        assertEquals("DRY_RUN_SIMULATION", simulation.get("mode"));
        assertTrue(simulation.containsKey("projectedActions"));
    }
}

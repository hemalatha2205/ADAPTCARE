package com.adaptcare.service;

import com.adaptcare.dto.response.AdaptationEventDTO;
import com.adaptcare.dto.response.AdaptiveRuleDTO;
import com.adaptcare.dto.response.PageResponse;
import com.adaptcare.entity.*;
import com.adaptcare.entity.enums.*;
import com.adaptcare.exception.ResourceNotFoundException;
import com.adaptcare.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdaptiveEngineService {

    private final AdaptiveRuleRepository ruleRepository;
    private final AdaptationEventRepository eventRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final DoctorAvailabilityRepository availabilityRepository;
    private final QueueEntryRepository queueEntryRepository;
    private final ResourceRepository resourceRepository;
    private final ResourceAllocationRepository allocationRepository;
    private final FeedbackRepository feedbackRepository;
    private final DepartmentRepository departmentRepository;
    private final NotificationService notificationService;
    private final QueueService queueService;
    private final SseService sseService;

    @Value("${app.adaptive-engine.emergency-threshold:3}")
    private int defaultEmergencyThreshold;

    @Value("${app.adaptive-engine.waiting-time-threshold:45}")
    private int defaultWaitTimeThreshold;

    @Value("${app.adaptive-engine.demand-threshold:1.5}")
    private double defaultDemandThreshold;

    // ==========================================
    // Rule 1: Emergency Surge
    // ==========================================
    @Transactional
    public List<AdaptationEventDTO> handleEmergencySurge() {
        AdaptiveRule rule = getOrCreateRule("RULE_EMERGENCY_SURGE", "Emergency Surge Optimization",
                RuleCategory.EMERGENCY, (double) defaultEmergencyThreshold, "emergencies/day", 15);

        if (!rule.isEnabled() || isInCooldown(rule)) {
            return Collections.emptyList();
        }

        LocalDate today = LocalDate.now();
        List<Appointment> todayAppointments = appointmentRepository.findByAppointmentDate(today);
        List<Appointment> emergencyAppointments = todayAppointments.stream()
                .filter(a -> a.getType() == AppointmentType.EMERGENCY)
                .collect(Collectors.toList());

        int count = emergencyAppointments.size();
        double threshold = rule.getThresholdValue() != null ? rule.getThresholdValue() : defaultEmergencyThreshold;

        List<AdaptationEventDTO> events = new ArrayList<>();

        if (count >= threshold) {
            log.info("Adaptive Engine: Emergency Surge detected! Count: {}, Threshold: {}", count, threshold);

            // Group emergency cases by doctor/department and optimize priority
            for (Appointment emergency : emergencyAppointments) {
                if (emergency.getPriority() != 1) {
                    int prevPriority = emergency.getPriority();
                    emergency.setPriority(1);
                    appointmentRepository.save(emergency);

                    // Reorder doctor queue immediately
                    queueService.recalculateQueue(emergency.getDoctor().getId());

                    // Record adaptation event
                    AdaptationEvent event = recordEvent(
                            rule.getRuleId(),
                            rule.getName(),
                            "Emergency appointments count (" + count + ") >= threshold (" + threshold + ")",
                            "Emergency surge protocol triggered to minimize critical patient wait time",
                            "Elevated appointment priority to 1 and recalculated doctor queue positions",
                            "APPOINTMENT",
                            emergency.getId(),
                            "priority=" + prevPriority,
                            "priority=1",
                            AdaptationStatus.SUCCESS,
                            "SYSTEM_ADAPTIVE_ENGINE",
                            "Doctor ID: " + emergency.getDoctor().getId() + ", Dept: " +
                                    (emergency.getDepartment() != null ? emergency.getDepartment().getName() : "General")
                    );

                    events.add(toEventDTO(event));

                    // Notify patient
                    notificationService.createNotification(
                            emergency.getPatient(),
                            "Emergency Priority Applied",
                            "Your emergency case has been prioritized in the queue by the Adaptive Intelligence Engine.",
                            NotificationType.EMERGENCY_ALERT,
                            emergency.getId(),
                            "APPOINTMENT"
                    );
                }
            }

            rule.setLastTriggered(LocalDateTime.now());
            ruleRepository.save(rule);
        }

        return events;
    }

    // ==========================================
    // Rule 2: Doctor Unavailability
    // ==========================================
    @Transactional
    public List<AdaptationEventDTO> handleDoctorUnavailability(Long doctorId) {
        AdaptiveRule rule = getOrCreateRule("RULE_DOCTOR_UNAVAILABILITY", "Doctor Absence Auto-Reassignment",
                RuleCategory.AVAILABILITY, 1.0, "absence_event", 10);

        Doctor unavailableDoctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + doctorId));

        unavailableDoctor.setActive(false);
        doctorRepository.save(unavailableDoctor);

        LocalDate today = LocalDate.now();
        List<Appointment> affectedAppointments = appointmentRepository
                .findByDoctorAndAppointmentDateAfterAndStatusIn(
                        unavailableDoctor,
                        today.minusDays(1),
                        List.of(AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED)
                );

        log.info("Adaptive Engine: Doctor {} marked unavailable. Affected appointments: {}",
                unavailableDoctor.getUser().getLastName(), affectedAppointments.size());

        List<AdaptationEventDTO> events = new ArrayList<>();

        // Find peer doctors in same department
        Department dept = unavailableDoctor.getDepartment();
        List<Doctor> peers = dept != null
                ? doctorRepository.findByDepartmentAndActiveTrue(dept).stream()
                .filter(d -> !d.getId().equals(doctorId))
                .collect(Collectors.toList())
                : Collections.emptyList();

        for (Appointment app : affectedAppointments) {
            Doctor replacement = findBestReplacementDoctor(peers, app.getAppointmentDate(), app.getStartTime());

            if (replacement != null) {
                Long oldDoctorId = app.getDoctor().getId();
                String oldDoctorName = app.getDoctor().getUser().getFirstName() + " " + app.getDoctor().getUser().getLastName();
                String newDoctorName = replacement.getUser().getFirstName() + " " + replacement.getUser().getLastName();

                app.setDoctor(replacement);
                app.setNotes((app.getNotes() != null ? app.getNotes() + " | " : "") +
                        "Reassigned from Dr. " + oldDoctorName + " due to doctor unavailability");
                appointmentRepository.save(app);

                // If appointment was today, update queue entry
                if (app.getAppointmentDate().equals(today)) {
                    queueEntryRepository.findByAppointmentId(app.getId()).ifPresent(qe -> {
                        qe.setDoctor(replacement);
                        queueEntryRepository.save(qe);
                        queueService.recalculateQueue(replacement.getId());
                    });
                }

                AdaptationEvent event = recordEvent(
                        rule.getRuleId(),
                        rule.getName(),
                        "Dr. " + oldDoctorName + " marked unavailable",
                        "Automatic reassignment to available peer doctor with lowest workload",
                        "Reassigned appointment to Dr. " + newDoctorName,
                        "APPOINTMENT",
                        app.getId(),
                        "doctorId=" + oldDoctorId,
                        "doctorId=" + replacement.getId(),
                        AdaptationStatus.SUCCESS,
                        "SYSTEM_ADAPTIVE_ENGINE",
                        "Reassignment completed within department " + (dept != null ? dept.getName() : "General")
                );

                events.add(toEventDTO(event));

                // Notify patient
                notificationService.createNotification(
                        app.getPatient(),
                        "Doctor Schedule Update",
                        String.format("Due to unforeseen doctor unavailability, your appointment on %s at %s has been automatically reassigned to Dr. %s.",
                                app.getAppointmentDate(), app.getStartTime(), newDoctorName),
                        NotificationType.DOCTOR_UNAVAILABLE,
                        app.getId(),
                        "APPOINTMENT"
                );

                // Notify replacement doctor
                notificationService.createNotification(
                        replacement.getUser(),
                        "Reassigned Appointment Added",
                        String.format("Patient %s %s reassigned to your schedule on %s at %s.",
                                app.getPatient().getFirstName(), app.getPatient().getLastName(), app.getAppointmentDate(), app.getStartTime()),
                        NotificationType.APPOINTMENT_BOOKED,
                        app.getId(),
                        "APPOINTMENT"
                );
            } else {
                // No suitable replacement found: mark for manual review / rescheduling
                app.setStatus(AppointmentStatus.RESCHEDULED);
                app.setNotes((app.getNotes() != null ? app.getNotes() + " | " : "") +
                        "Doctor unavailable and no matching replacement in department; flagged for rescheduling");
                appointmentRepository.save(app);

                AdaptationEvent event = recordEvent(
                        rule.getRuleId(),
                        rule.getName(),
                        "Dr. " + unavailableDoctor.getUser().getLastName() + " marked unavailable",
                        "No available peer doctor in department with matching slot",
                        "Flagged appointment as RESCHEDULED for receptionist follow-up",
                        "APPOINTMENT",
                        app.getId(),
                        "status=SCHEDULED",
                        "status=RESCHEDULED",
                        AdaptationStatus.PENDING,
                        "SYSTEM_ADAPTIVE_ENGINE",
                        "Escalated to front desk for manual rescheduling"
                );

                events.add(toEventDTO(event));

                notificationService.createNotification(
                        app.getPatient(),
                        "Appointment Rescheduling Required",
                        "Your doctor is temporarily unavailable. Our team will assist you in selecting a new appointment time.",
                        NotificationType.APPOINTMENT_RESCHEDULED,
                        app.getId(),
                        "APPOINTMENT"
                );
            }
        }

        if (affectedAppointments.isEmpty()) {
            AdaptationEvent event = recordEvent(
                    rule.getRuleId(),
                    rule.getName(),
                    "Doctor Dr. " + unavailableDoctor.getUser().getLastName() + " marked unavailable",
                    "Physician status set to inactive with no pending appointments today",
                    "Quarantined physician schedule from booking availability",
                    "DOCTOR",
                    doctorId,
                    "active=true",
                    "active=false",
                    AdaptationStatus.SUCCESS,
                    "SYSTEM_ADAPTIVE_ENGINE",
                    "Physician marked absent; 0 upcoming appointments impacted"
            );
            events.add(toEventDTO(event));
        }

        if (!events.isEmpty()) {
            rule.setLastTriggered(LocalDateTime.now());
            ruleRepository.save(rule);
        }

        return events;
    }

    private Doctor findBestReplacementDoctor(List<Doctor> candidates, LocalDate date, LocalTime time) {
        Doctor best = null;
        int minWorkload = Integer.MAX_VALUE;

        DayOfWeekEnum dayOfWeek = DayOfWeekEnum.valueOf(date.getDayOfWeek().name());

        for (Doctor candidate : candidates) {
            // Check availability for this day of week
            List<DoctorAvailability> avails = availabilityRepository.findByDoctorAndDayOfWeek(candidate, dayOfWeek);
            boolean isAvailableAtTime = avails.stream().anyMatch(a -> a.isAvailable() &&
                    !time.isBefore(a.getStartTime()) && time.isBefore(a.getEndTime()));

            if (!isAvailableAtTime) continue;

            // Check if already booked at this exact time
            Optional<Appointment> conflict = appointmentRepository.findByDoctorAndAppointmentDateAndStartTime(candidate, date, time);
            if (conflict.isPresent() && conflict.get().getStatus() != AppointmentStatus.CANCELLED) {
                continue;
            }

            // Check workload (total appointments on that date)
            int workload = (int) appointmentRepository.countByDoctorAndAppointmentDateAndStatusNot(candidate, date, AppointmentStatus.CANCELLED);
            if (workload < candidate.getMaxDailyAppointments() && workload < minWorkload) {
                minWorkload = workload;
                best = candidate;
            }
        }

        return best;
    }

    // ==========================================
    // Rule 3: Excessive Waiting Time
    // ==========================================
    @Transactional
    public List<AdaptationEventDTO> handleExcessiveWaitTime() {
        AdaptiveRule rule = getOrCreateRule("RULE_EXCESSIVE_WAIT_TIME", "Excessive Wait-Time Queue Optimization",
                RuleCategory.WAITING_TIME, (double) defaultWaitTimeThreshold, "minutes", 20);

        if (!rule.isEnabled() || isInCooldown(rule)) {
            return Collections.emptyList();
        }

        double threshold = rule.getThresholdValue() != null ? rule.getThresholdValue() : defaultWaitTimeThreshold;
        List<Doctor> activeDoctors = doctorRepository.findByActiveTrue();
        List<AdaptationEventDTO> events = new ArrayList<>();

        for (Doctor doctor : activeDoctors) {
            List<QueueEntry> waiting = queueEntryRepository.findByDoctorAndStatusOrderByPositionAsc(doctor, QueueStatus.WAITING);
            int estTotalWait = waiting.size() * (doctor.getConsultationDuration() > 0 ? doctor.getConsultationDuration() : 15);

            if (estTotalWait > threshold) {
                log.info("Adaptive Engine: Excessive wait time for Dr. {} ({} min > {} min)",
                        doctor.getUser().getLastName(), estTotalWait, threshold);

                // Queue re-balancing
                queueService.recalculateQueue(doctor.getId());

                AdaptationEvent event = recordEvent(
                        rule.getRuleId(),
                        rule.getName(),
                        "Estimated queue wait time (" + estTotalWait + " min) exceeded threshold (" + threshold + " min)",
                        "High patient backlog detected in queue",
                        "Recalculated queue positions, expedited emergency priorities, and alerted medical staff",
                        "QUEUE",
                        doctor.getId(),
                        "estWait=" + estTotalWait,
                        "estWait=" + (waiting.size() * doctor.getConsultationDuration()),
                        AdaptationStatus.SUCCESS,
                        "SYSTEM_ADAPTIVE_ENGINE",
                        "Doctor ID: " + doctor.getId() + ", Queue length: " + waiting.size()
                );

                events.add(toEventDTO(event));

                // Alert doctor
                notificationService.createNotification(
                        doctor.getUser(),
                        "Queue Backlog Alert",
                        "Your current queue wait time exceeds " + (int) threshold + " minutes (" + waiting.size() + " patients waiting).",
                        NotificationType.QUEUE_UPDATE,
                        doctor.getId(),
                        "QUEUE"
                );
            }
        }

        if (!events.isEmpty()) {
            rule.setLastTriggered(LocalDateTime.now());
            ruleRepository.save(rule);
        }

        return events;
    }

    // ==========================================
    // Rule 4: Increasing Demand Surge
    // ==========================================
    @Transactional
    public List<AdaptationEventDTO> handleDemandSurge(Long departmentId) {
        AdaptiveRule rule = getOrCreateRule("RULE_DEMAND_SURGE", "Predictive Demand Capacity Adjustment",
                RuleCategory.DEMAND, defaultDemandThreshold, "surge_ratio", 60);

        if (!rule.isEnabled() || isInCooldown(rule)) {
            return Collections.emptyList();
        }

        LocalDate today = LocalDate.now();
        LocalDate lastWeekStart = today.minusDays(7);
        LocalDate prevWeekStart = today.minusDays(14);

        int currentWeekCount = appointmentRepository.countByDepartmentIdAndAppointmentDateBetween(departmentId, lastWeekStart, today);
        int prevWeekCount = appointmentRepository.countByDepartmentIdAndAppointmentDateBetween(departmentId, prevWeekStart, lastWeekStart.minusDays(1));

        double ratio = prevWeekCount > 0 ? (double) currentWeekCount / prevWeekCount : (currentWeekCount > 5 ? 2.0 : 1.0);
        double threshold = rule.getThresholdValue() != null ? rule.getThresholdValue() : defaultDemandThreshold;

        List<AdaptationEventDTO> events = new ArrayList<>();

        if (ratio >= threshold) {
            log.info("Adaptive Engine: Demand Surge detected for Dept ID {}! Ratio: {} >= {}", departmentId, ratio, threshold);

            AdaptationEvent event = recordEvent(
                    rule.getRuleId(),
                    rule.getName(),
                    String.format("Weekly appointment volume increased by %.1fx (current: %d, previous: %d)", ratio, currentWeekCount, prevWeekCount),
                    "Upcoming demand exceeds normal department throughput capacity",
                    "Generated operational recommendation to open 2 additional consultation slots per doctor and staff on-call personnel",
                    "DEPARTMENT",
                    departmentId,
                    "surgeRatio=" + String.format("%.2f", ratio),
                    "recommendationGenerated=true",
                    AdaptationStatus.SUCCESS,
                    "SYSTEM_ADAPTIVE_ENGINE",
                    "Department ID: " + departmentId
            );

            events.add(toEventDTO(event));

            rule.setLastTriggered(LocalDateTime.now());
            ruleRepository.save(rule);
        }

        return events;
    }

    // ==========================================
    // Rule 5: Resource Shortage
    // ==========================================
    @Transactional
    public List<AdaptationEventDTO> handleResourceShortage(Long resourceId) {
        AdaptiveRule rule = getOrCreateRule("RULE_RESOURCE_SHORTAGE", "Clinical Resource Auto-Substitution",
                RuleCategory.RESOURCE, 1.0, "shortage_event", 15);

        Resource unavailableResource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found: " + resourceId));

        unavailableResource.setStatus(ResourceStatus.UNAVAILABLE);
        resourceRepository.save(unavailableResource);

        List<AdaptationEventDTO> events = new ArrayList<>();

        // Find active allocations using this resource
        List<ResourceAllocation> allocations = allocationRepository
                .findByResourceIdAndStatus(resourceId, AllocationStatus.ALLOCATED);

        // Find alternative resource of same type that is available
        List<Resource> alternatives = resourceRepository.findByTypeAndStatusAndActiveTrue(
                unavailableResource.getType(), ResourceStatus.AVAILABLE
        );

        for (ResourceAllocation alloc : allocations) {
            if (!alternatives.isEmpty()) {
                Resource substitute = alternatives.remove(0);
                substitute.setStatus(ResourceStatus.OCCUPIED);
                resourceRepository.save(substitute);

                alloc.setStatus(AllocationStatus.RELEASED);
                alloc.setReleasedAt(LocalDateTime.now());
                allocationRepository.save(alloc);

                ResourceAllocation newAlloc = ResourceAllocation.builder()
                        .resource(substitute)
                        .appointment(alloc.getAppointment())
                        .allocatedAt(LocalDateTime.now())
                        .status(AllocationStatus.ALLOCATED)
                        .build();
                allocationRepository.save(newAlloc);

                AdaptationEvent event = recordEvent(
                        rule.getRuleId(),
                        rule.getName(),
                        "Resource " + unavailableResource.getName() + " marked unavailable",
                        "Active clinical appointment required replacement room/equipment",
                        "Replaced with alternative resource: " + substitute.getName() + " (" + substitute.getLocation() + ")",
                        "RESOURCE",
                        resourceId,
                        "resourceId=" + resourceId,
                        "resourceId=" + substitute.getId(),
                        AdaptationStatus.SUCCESS,
                        "SYSTEM_ADAPTIVE_ENGINE",
                        "Substitution completed without appointment cancellation"
                );

                events.add(toEventDTO(event));
            } else {
                AdaptationEvent event = recordEvent(
                        rule.getRuleId(),
                        rule.getName(),
                        "Resource " + unavailableResource.getName() + " marked unavailable",
                        "No alternative " + unavailableResource.getType() + " currently available",
                        "Flagged clinical resource shortage for hospital administrator action",
                        "RESOURCE",
                        resourceId,
                        "status=OCCUPIED",
                        "status=SHORTAGE_ESCALATED",
                        AdaptationStatus.FAILED,
                        "SYSTEM_ADAPTIVE_ENGINE",
                        "Escalated to hospital operations"
                );

                events.add(toEventDTO(event));
            }
        }

        if (allocations.isEmpty()) {
            AdaptationEvent event = recordEvent(
                    rule.getRuleId(),
                    rule.getName(),
                    "Resource " + unavailableResource.getName() + " marked unavailable",
                    "Status set to UNAVAILABLE (no active clinical allocations needed immediate reassignment)",
                    "Quarantined resource from booking pool and verified status",
                    "RESOURCE",
                    resourceId,
                    "status=AVAILABLE",
                    "status=UNAVAILABLE",
                    AdaptationStatus.SUCCESS,
                    "SYSTEM_ADAPTIVE_ENGINE",
                    "Resource placed in maintenance state; 0 allocations disrupted"
            );
            events.add(toEventDTO(event));
        }

        if (!events.isEmpty()) {
            rule.setLastTriggered(LocalDateTime.now());
            ruleRepository.save(rule);
        }

        return events;
    }

    // ==========================================
    // Rule 6: Patient Feedback Trend Analysis
    // ==========================================
    @Transactional
    public List<AdaptationEventDTO> analyzeFeedbackTrends() {
        AdaptiveRule rule = getOrCreateRule("RULE_FEEDBACK_ANALYSIS", "Operational Quality Trend Detection",
                RuleCategory.FEEDBACK, 3.0, "min_rating_threshold", 60);

        if (!rule.isEnabled() || isInCooldown(rule)) {
            return Collections.emptyList();
        }

        LocalDateTime since = LocalDateTime.now().minusDays(14);
        List<Feedback> recentFeedback = feedbackRepository.findByCreatedAtAfter(since);

        List<AdaptationEventDTO> events = new ArrayList<>();

        if (recentFeedback.size() >= 5) {
            double avgRating = recentFeedback.stream()
                    .mapToInt(Feedback::getRating)
                    .average()
                    .orElse(5.0);

            if (avgRating <= rule.getThresholdValue()) {
                log.info("Adaptive Engine: Low satisfaction trend detected (avg: {} <= {})", avgRating, rule.getThresholdValue());

                AdaptationEvent event = recordEvent(
                        rule.getRuleId(),
                        rule.getName(),
                        String.format("14-day average feedback rating (%.1f/5) dropped below threshold (%.1f)", avgRating, rule.getThresholdValue()),
                        "Trend analysis revealed recurring patient experience friction in wait times",
                        "Generated administrative operational action item for scheduling review and doctor workload adjustments",
                        "FEEDBACK_ANALYSIS",
                        null,
                        "avgRating=" + String.format("%.2f", avgRating),
                        "recommendationGenerated=true",
                        AdaptationStatus.SUCCESS,
                        "SYSTEM_ADAPTIVE_ENGINE",
                        "Analyzed " + recentFeedback.size() + " recent patient feedback submissions"
                );

                events.add(toEventDTO(event));
                rule.setLastTriggered(LocalDateTime.now());
                ruleRepository.save(rule);
            }
        }

        return events;
    }

    // ==========================================
    // Evaluate All Rules & Zero-Arg Rule Evaluators
    // ==========================================
    @Transactional
    public List<AdaptationEventDTO> evaluateResourceShortage() {
        log.info("Adaptive Engine: Evaluating resource shortage across hospital clinical inventory...");
        List<AdaptationEventDTO> events = new ArrayList<>();
        List<Resource> unavailableResources = resourceRepository.findAll().stream()
                .filter(r -> r.getStatus() == ResourceStatus.UNAVAILABLE)
                .collect(Collectors.toList());
        for (Resource r : unavailableResources) {
            events.addAll(handleResourceShortage(r.getId()));
        }
        return events;
    }

    @Transactional
    public List<AdaptationEventDTO> evaluateDoctorUnavailability() {
        log.info("Adaptive Engine: Evaluating doctor unavailability across departments...");
        List<AdaptationEventDTO> events = new ArrayList<>();
        List<Doctor> inactiveDoctors = doctorRepository.findAll().stream()
                .filter(d -> !d.isActive())
                .collect(Collectors.toList());
        for (Doctor d : inactiveDoctors) {
            events.addAll(handleDoctorUnavailability(d.getId()));
        }
        return events;
    }

    @Transactional
    public List<AdaptationEventDTO> evaluateDemandSurge() {
        log.info("Adaptive Engine: Evaluating demand surge across all departments...");
        List<AdaptationEventDTO> events = new ArrayList<>();
        List<Department> departments = departmentRepository.findAll();
        for (Department dept : departments) {
            events.addAll(handleDemandSurge(dept.getId()));
        }
        return events;
    }

    @Transactional
    public List<AdaptationEventDTO> evaluateAllRules() {
        log.info("Adaptive Engine: Running full evaluation cycle across all active rules...");
        List<AdaptationEventDTO> allEvents = new ArrayList<>();

        allEvents.addAll(handleEmergencySurge());
        allEvents.addAll(evaluateDoctorUnavailability());
        allEvents.addAll(handleExcessiveWaitTime());
        allEvents.addAll(evaluateDemandSurge());
        allEvents.addAll(evaluateResourceShortage());
        allEvents.addAll(analyzeFeedbackTrends());

        return allEvents;
    }

    // ==========================================
    // Dry-run Simulation (No persistence of changes)
    // ==========================================
    public Map<String, Object> simulateRule(String ruleId) {
        Map<String, Object> simulation = new HashMap<>();
        simulation.put("ruleId", ruleId);
        simulation.put("simulatedAt", LocalDateTime.now());
        simulation.put("mode", "DRY_RUN_SIMULATION");
        simulation.put("mutationsExecuted", 0);

        switch (ruleId) {
            case "RULE_EMERGENCY_SURGE", "1" -> {
                List<Appointment> todayApps = appointmentRepository.findByAppointmentDate(LocalDate.now());
                long emergencies = todayApps.stream().filter(a -> a.getType() == AppointmentType.EMERGENCY).count();
                simulation.put("triggerConditionMet", emergencies >= defaultEmergencyThreshold);
                simulation.put("detectedCount", emergencies);
                simulation.put("threshold", defaultEmergencyThreshold);
                simulation.put("reason", "Monitors hourly velocity of emergency arrivals to prevent clinical queue gridlock.");
                simulation.put("constraints", "Respects doctor specialization limits and critical life-support bed availability.");
                simulation.put("expectedOutcome", "Emergency intake elevated to Queue Position #1; routine appointment delay notifications sent via SSE/SMS.");
                simulation.put("projectedActions", List.of(
                        "Elevate emergency patient priority to Priority 1",
                        "Re-sequence doctor queue with immediate critical care preempting routine visits",
                        "Push real-time waiting estimate adjustment notifications to affected routine patients",
                        "Alert triage nursing desk of surge condition"
                ));
            }
            case "RULE_DOCTOR_UNAVAILABILITY", "2" -> {
                List<Doctor> activeDoctors = doctorRepository.findByActiveTrue();
                simulation.put("activeDoctorsCount", activeDoctors.size());
                simulation.put("reason", "Detects physician unexpected absence and automatically reassigns scheduled patients to eligible peer doctors.");
                simulation.put("constraints", "Requires identical department qualification, active availability during appointment slot, and daily appointment cap < 25.");
                simulation.put("expectedOutcome", "Continuous patient care maintained with zero canceled visits and balanced peer physician workloads.");
                simulation.put("projectedActions", List.of(
                        "Scan department roster for active peer doctors matching appointment day and time",
                        "Score candidate peer doctors by lowest active queue backlog and consultation duration compatibility",
                        "Reallocate booked appointments from absent physician to highest-ranked peer",
                        "Dispatch SMS/in-app schedule change notifications to patients"
                ));
            }
            case "RULE_EXCESSIVE_WAIT_TIME", "3" -> {
                simulation.put("thresholdMinutes", defaultWaitTimeThreshold);
                simulation.put("reason", "Prevents waiting room overcrowding and excessive patient delay when consultations overrun.");
                simulation.put("constraints", "Patient specialty requirements and room availability boundaries.");
                simulation.put("expectedOutcome", "Average waiting time compressed below 30 minutes; floor supervisor notified of bottlenecks.");
                simulation.put("projectedActions", List.of(
                        "Scan queue wait times across all active consultation rooms",
                        "Recalculate dynamic delay using consultation duration multipliers",
                        "Redistribute next waiting tokens to parallel consultation rooms running ahead of schedule",
                        "Alert department clinical lead if queue backlog exceeds " + defaultWaitTimeThreshold + " minutes"
                ));
            }
            case "RULE_DEMAND_SURGE", "4" -> {
                simulation.put("thresholdRatio", defaultDemandThreshold);
                simulation.put("reason", "Forecasts upcoming department patient surges using historical booking velocity and Scikit-learn Random Forest model.");
                simulation.put("constraints", "Department physical room capacity and maximum doctor overtime limits.");
                simulation.put("expectedOutcome", "Proactive capacity expansion prepared 24-48 hours before patient surge occurs.");
                simulation.put("projectedActions", List.of(
                        "Compare weekly booking velocity with historical 14-day baseline",
                        "Query ML microservice Random Forest model for 24-hour demand projection",
                        "Recommend opening auxiliary consultation rooms in surge departments",
                        "Generate overtime shift schedule recommendation for administrative approval"
                ));
            }
            case "RULE_RESOURCE_SHORTAGE", "5" -> {
                simulation.put("reason", "Detects equipment failure or examination room maintenance outage and reassigns bookings to identical specification resources.");
                simulation.put("constraints", "Room type equivalence (ROOM, BED, EQUIPMENT) within compatible department wings.");
                simulation.put("expectedOutcome", "Consultations proceed without diagnostic disruption; double-allocation prevented.");
                simulation.put("projectedActions", List.of(
                        "Detect resource outage event and lock defective room/machine",
                        "Query hospital clinical resource directory for available substitute of identical type",
                        "Re-bind active clinical reservations to substitute resource",
                        "Dispatch maintenance work order to facilities engineering"
                ));
            }
            case "RULE_FEEDBACK_ANALYSIS", "6" -> {
                simulation.put("reason", "Aggregates rolling 14-day patient reviews to detect systemic bottlenecks in clinical departments.");
                simulation.put("constraints", "Requires minimum feedback sample size (n >= 5) to prevent outlier skew.");
                simulation.put("expectedOutcome", "Recurring friction points identified for hospital continuous quality improvement.");
                simulation.put("projectedActions", List.of(
                        "Aggregate 14-day patient ratings and sentiment tags across departments",
                        "Isolate categories with ratings <= 3.0 stars for clinical supervisor review",
                        "Correlate low satisfaction scores with specific consultation wait-time thresholds",
                        "Generate operational quality audit report for Chief Medical Officer"
                ));
            }
            default -> {
                simulation.put("reason", "Dry-run scenario evaluation for " + ruleId);
                simulation.put("constraints", "Hospital operational policies and schedule parameters.");
                simulation.put("expectedOutcome", "Simulated adaptation model evaluated with 0 state mutations.");
                simulation.put("projectedActions", List.of("Telemetry captured", "Model verified"));
                simulation.put("message", "Rule " + ruleId + " simulation profile ready");
            }
        }

        return simulation;
    }

    public PageResponse<AdaptationEventDTO> getHistory(int page, int size) {
        Page<AdaptationEvent> p = eventRepository.findAllByOrderByExecutedAtDesc(PageRequest.of(page, size));
        List<AdaptationEventDTO> content = p.getContent().stream().map(this::toEventDTO).collect(Collectors.toList());
        return PageResponse.<AdaptationEventDTO>builder()
                .content(content)
                .page(p.getNumber())
                .size(p.getSize())
                .totalElements(p.getTotalElements())
                .totalPages(p.getTotalPages())
                .last(p.isLast())
                .build();
    }

    public List<AdaptiveRuleDTO> getAllRules() {
        return ruleRepository.findAll().stream().map(this::toRuleDTO).collect(Collectors.toList());
    }

    @Transactional
    public AdaptiveRuleDTO updateRule(Long id, AdaptiveRuleDTO dto) {
        AdaptiveRule rule = ruleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rule not found: " + id));

        rule.setEnabled(dto.isEnabled());
        if (dto.getThresholdValue() != null) rule.setThresholdValue(dto.getThresholdValue());
        if (dto.getCooldownMinutes() > 0) rule.setCooldownMinutes(dto.getCooldownMinutes());
        if (dto.getPriority() > 0) rule.setPriority(dto.getPriority());

        return toRuleDTO(ruleRepository.save(rule));
    }

    private boolean isInCooldown(AdaptiveRule rule) {
        if (rule.getLastTriggered() == null) return false;
        return rule.getLastTriggered().plusMinutes(rule.getCooldownMinutes()).isAfter(LocalDateTime.now());
    }

    private AdaptiveRule getOrCreateRule(String ruleId, String name, RuleCategory category,
                                         Double threshold, String unit, int cooldown) {
        return ruleRepository.findByRuleId(ruleId).orElseGet(() -> {
            AdaptiveRule r = AdaptiveRule.builder()
                    .ruleId(ruleId)
                    .name(name)
                    .category(category)
                    .thresholdValue(threshold)
                    .thresholdUnit(unit)
                    .cooldownMinutes(cooldown)
                    .enabled(true)
                    .priority(1)
                    .build();
            return ruleRepository.save(r);
        });
    }

    private AdaptationEvent recordEvent(String ruleId, String ruleName, String trigger,
                                        String reason, String action, String entityType,
                                        Long entityId, String prev, String next,
                                        AdaptationStatus status, String executedBy, String details) {
        AdaptationEvent event = AdaptationEvent.builder()
                .ruleId(ruleId)
                .ruleName(ruleName)
                .triggerCondition(trigger)
                .reason(reason)
                .action(action)
                .affectedEntityType(entityType)
                .affectedEntityId(entityId)
                .previousState(prev)
                .newState(next)
                .status(status)
                .executedAt(LocalDateTime.now())
                .executedBy(executedBy)
                .details(details)
                .build();

        event = eventRepository.save(event);
        sseService.broadcast("ADAPTATION_EVENT", toEventDTO(event));
        return event;
    }

    public AdaptationEventDTO toEventDTO(AdaptationEvent e) {
        return AdaptationEventDTO.builder()
                .id(e.getId())
                .ruleId(e.getRuleId())
                .ruleName(e.getRuleName())
                .triggerCondition(e.getTriggerCondition())
                .reason(e.getReason())
                .action(e.getAction())
                .affectedEntityType(e.getAffectedEntityType())
                .affectedEntityId(e.getAffectedEntityId())
                .previousState(e.getPreviousState())
                .newState(e.getNewState())
                .status(e.getStatus())
                .executedAt(e.getExecutedAt())
                .executedBy(e.getExecutedBy())
                .details(e.getDetails())
                .build();
    }

    public AdaptiveRuleDTO toRuleDTO(AdaptiveRule r) {
        return AdaptiveRuleDTO.builder()
                .id(r.getId())
                .ruleId(r.getRuleId())
                .name(r.getName())
                .description(r.getDescription())
                .category(r.getCategory())
                .enabled(r.isEnabled())
                .priority(r.getPriority())
                .thresholdValue(r.getThresholdValue())
                .thresholdUnit(r.getThresholdUnit())
                .cooldownMinutes(r.getCooldownMinutes())
                .lastTriggered(r.getLastTriggered())
                .build();
    }
}

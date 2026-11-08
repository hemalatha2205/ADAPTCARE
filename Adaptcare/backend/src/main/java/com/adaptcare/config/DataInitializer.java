package com.adaptcare.config;

import com.adaptcare.entity.*;
import com.adaptcare.entity.enums.*;
import com.adaptcare.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final DoctorRepository doctorRepository;
    private final DoctorAvailabilityRepository availabilityRepository;
    private final AdaptiveRuleRepository ruleRepository;
    private final ResourceRepository resourceRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking ADAPTCARE database initialization...");

        // 1. Initialize Default Admin User
        if (!userRepository.existsByEmail("admin@adaptcare.com")) {
            User admin = User.builder()
                    .firstName("System")
                    .lastName("Administrator")
                    .email("admin@adaptcare.com")
                    .password(passwordEncoder.encode("Admin@123"))
                    .phone("+1-555-0100")
                    .gender(Gender.OTHER)
                    .role(Role.ADMIN)
                    .active(true)
                    .build();
            userRepository.save(admin);
            log.info("Created default administrator: admin@adaptcare.com / Admin@123");
        }

        // 2. Initialize Default Receptionist User
        if (!userRepository.existsByEmail("receptionist@adaptcare.com")) {
            User receptionist = User.builder()
                    .firstName("Sarah")
                    .lastName("Connor")
                    .email("receptionist@adaptcare.com")
                    .password(passwordEncoder.encode("Reception@123"))
                    .phone("+1-555-0101")
                    .gender(Gender.FEMALE)
                    .role(Role.RECEPTIONIST)
                    .active(true)
                    .build();
            userRepository.save(receptionist);
            log.info("Created default receptionist: receptionist@adaptcare.com / Reception@123");
        }

        // 3. Initialize Default Sample Patient
        if (!userRepository.existsByEmail("patient@example.com")) {
            User patient = User.builder()
                    .firstName("John")
                    .lastName("Doe")
                    .email("patient@example.com")
                    .password(passwordEncoder.encode("Patient@123"))
                    .phone("+1-555-0102")
                    .dateOfBirth(LocalDate.of(1990, 5, 15))
                    .gender(Gender.MALE)
                    .address("123 Maple Street, Cityville")
                    .role(Role.PATIENT)
                    .active(true)
                    .build();
            userRepository.save(patient);
            log.info("Created default sample patient: patient@example.com / Patient@123");
        }

        // 4. Initialize Departments
        Department genMed = getOrCreateDept("General Medicine", "Primary outpatient care and internal medicine diagnosis", "Wing A, 1st Floor");
        Department cardio = getOrCreateDept("Cardiology", "Cardiovascular health, ECG, echocardiography and heart disease management", "Wing B, 2nd Floor");
        Department ortho = getOrCreateDept("Orthopedics", "Bone, joint, spine, and musculoskeletal rehabilitation", "Wing C, 1st Floor");
        Department peds = getOrCreateDept("Pediatrics", "Infant, child, and adolescent healthcare", "Wing A, 2nd Floor");
        Department derm = getOrCreateDept("Dermatology", "Skin, hair, and nail health and clinical dermatology", "Wing D, 3rd Floor");
        Department neuro = getOrCreateDept("Neurology", "Brain, spinal cord, and peripheral nervous system disorders", "Wing B, 3rd Floor");

        // 5. Initialize Sample Doctors (At least 2 per department across all 6 departments)
        // Department 1: General Medicine
        createDoctorIfMissing("dr.sharma@adaptcare.com", "Rajesh", "Sharma", "Doc@123", "+1-555-0201",
                genMed, "Internal Medicine & Diabetes", "MD, FACP", 14, 20, 25);
        createDoctorIfMissing("dr.nair@adaptcare.com", "Priya", "Nair", "Doc@123", "+1-555-0202",
                genMed, "Family & Preventive Medicine", "MD Family Medicine", 12, 20, 25);

        // Department 2: Cardiology
        createDoctorIfMissing("dr.chen@adaptcare.com", "Emily", "Chen", "Doc@123", "+1-555-0203",
                cardio, "Interventional Cardiology", "MD, FACC", 12, 25, 20);
        createDoctorIfMissing("dr.alvarez@adaptcare.com", "Carlos", "Alvarez", "Doc@123", "+1-555-0204",
                cardio, "Clinical Cardiology & Electrophysiology", "MD, FACC", 14, 25, 20);

        // Department 3: Orthopedics
        createDoctorIfMissing("dr.patel@adaptcare.com", "Marcus", "Patel", "Doc@123", "+1-555-0205",
                ortho, "Sports Medicine & Joint Surgery", "MS Ortho, FAAOS", 10, 20, 20);
        createDoctorIfMissing("dr.taylor@adaptcare.com", "Jordan", "Taylor", "Doc@123", "+1-555-0206",
                ortho, "Joint Replacement & Trauma Surgery", "MS Ortho", 11, 20, 20);

        // Department 4: Pediatrics
        createDoctorIfMissing("dr.williams@adaptcare.com", "Lisa", "Williams", "Doc@123", "+1-555-0207",
                peds, "General & Critical Pediatric Care", "MD Pediatrics, FAAP", 9, 20, 22);
        createDoctorIfMissing("dr.morales@adaptcare.com", "Sofia", "Morales", "Doc@123", "+1-555-0208",
                peds, "Pediatric Care & Adolescent Health", "MD Pediatrics", 9, 20, 22);

        // Department 5: Dermatology
        createDoctorIfMissing("dr.kim@adaptcare.com", "Hannah", "Kim", "Doc@123", "+1-555-0209",
                derm, "Clinical Dermatology & Laser Therapy", "FAAD", 10, 20, 25);
        createDoctorIfMissing("dr.foster@adaptcare.com", "David", "Foster", "Doc@123", "+1-555-0210",
                derm, "Medical & Surgical Dermatology", "MD Dermatology", 13, 20, 25);

        // Department 6: Neurology
        createDoctorIfMissing("dr.zhao@adaptcare.com", "Alex", "Zhao", "Doc@123", "+1-555-0211",
                neuro, "Clinical Neurology & Stroke Care", "MD, PhD", 15, 25, 18);
        createDoctorIfMissing("dr.bennett@adaptcare.com", "Rachel", "Bennett", "Doc@123", "+1-555-0212",
                neuro, "Neurological Disorders & Epilepsy", "MD, FAAN", 8, 25, 18);

        // Ensure all active doctors have baseline Mon-Sat availability
        for (Doctor doc : doctorRepository.findAll()) {
            List<DoctorAvailability> existingAvails = availabilityRepository.findByDoctor(doc);
            if (existingAvails.isEmpty()) {
                for (DayOfWeekEnum day : DayOfWeekEnum.values()) {
                    if (day != DayOfWeekEnum.SUNDAY) {
                        availabilityRepository.save(DoctorAvailability.builder()
                                .doctor(doc)
                                .dayOfWeek(day)
                                .startTime(LocalTime.of(9, 0))
                                .endTime(LocalTime.of(17, 0))
                                .available(true)
                                .build());
                    }
                }
            }
        }

        // 6. Initialize Adaptive Rules
        initRule("RULE_EMERGENCY_SURGE", "Emergency Surge Prioritization",
                "Monitors emergency arrival velocity. Re-sequences queue and notifies routine patients when capacity is strained.",
                RuleCategory.EMERGENCY, 3.0, "emergencies/day", 15, 1);

        initRule("RULE_DOCTOR_UNAVAILABILITY", "Doctor Absence Auto-Reassignment",
                "Reallocates scheduled appointments to qualified available peer doctors within department when a doctor is absent.",
                RuleCategory.AVAILABILITY, 1.0, "absence_event", 10, 1);

        initRule("RULE_EXCESSIVE_WAIT_TIME", "Excessive Wait-Time Queue Optimization",
                "Detects queues exceeding acceptable waiting limits. Recalculates delays and redistributes load.",
                RuleCategory.WAITING_TIME, 45.0, "minutes", 20, 2);

        initRule("RULE_DEMAND_SURGE", "Predictive Demand Capacity Adjustment",
                "Forecasts upcoming patient surges using historical velocity and machine learning predictions.",
                RuleCategory.DEMAND, 1.5, "surge_ratio", 60, 3);

        initRule("RULE_RESOURCE_SHORTAGE", "Clinical Resource Auto-Substitution",
                "Auto-substitutes equivalent exam rooms, beds, or diagnostics gear during resource outages.",
                RuleCategory.RESOURCE, 1.0, "shortage_event", 15, 2);

        initRule("RULE_FEEDBACK_ANALYSIS", "Operational Quality Trend Detection",
                "Synthesizes patient reviews and isolates recurring bottlenecks for hospital quality improvement.",
                RuleCategory.FEEDBACK, 3.0, "min_rating_threshold", 60, 3);

        // 6. Initialize Clinical Resources
        initResource("Consultation Room 101", ResourceType.ROOM, genMed, "Room 101, Wing A");
        initResource("Consultation Room 102", ResourceType.ROOM, genMed, "Room 102, Wing A");
        initResource("Cardio Diagnostics Bay 201", ResourceType.ROOM, cardio, "Room 201, Wing B");
        initResource("Orthopedic Exam Bed 1", ResourceType.BED, ortho, "Room 110, Wing C");
        initResource("Emergency ECG Monitor A", ResourceType.EQUIPMENT, cardio, "Crash Cart 1, Wing B");
        initResource("Ultrasound Scanner 3", ResourceType.EQUIPMENT, genMed, "Imaging Suite 2");

        log.info("ADAPTCARE database initialization finished successfully.");
    }

    private Department getOrCreateDept(String name, String description, String location) {
        return departmentRepository.findByName(name).orElseGet(() ->
                departmentRepository.save(Department.builder()
                        .name(name)
                        .description(description)
                        .location(location)
                        .active(true)
                        .build()));
    }

    private void createDoctorIfMissing(String email, String firstName, String lastName, String password,
                                       String phone, Department dept, String spec, String qual, int exp, int duration, int maxDaily) {
        if (!userRepository.existsByEmail(email)) {
            User user = userRepository.save(User.builder()
                    .firstName(firstName)
                    .lastName(lastName)
                    .email(email)
                    .password(passwordEncoder.encode(password))
                    .phone(phone)
                    .gender(Gender.MALE)
                    .role(Role.DOCTOR)
                    .active(true)
                    .build());

            Doctor doc = doctorRepository.save(Doctor.builder()
                    .user(user)
                    .department(dept)
                    .specialization(spec)
                    .qualification(qual)
                    .experience(exp)
                    .consultationDuration(duration)
                    .maxDailyAppointments(maxDaily)
                    .active(true)
                    .build());

            // Add standard Mon-Sat availability
            for (DayOfWeekEnum day : DayOfWeekEnum.values()) {
                if (day != DayOfWeekEnum.SUNDAY) {
                    availabilityRepository.save(DoctorAvailability.builder()
                            .doctor(doc)
                            .dayOfWeek(day)
                            .startTime(LocalTime.of(9, 0))
                            .endTime(LocalTime.of(17, 0))
                            .available(true)
                            .build());
                }
            }
        }
    }

    private void initRule(String ruleId, String name, String desc, RuleCategory cat,
                          Double threshold, String unit, int cooldown, int priority) {
        if (ruleRepository.findByRuleId(ruleId).isEmpty()) {
            ruleRepository.save(AdaptiveRule.builder()
                    .ruleId(ruleId)
                    .name(name)
                    .description(desc)
                    .category(cat)
                    .thresholdValue(threshold)
                    .thresholdUnit(unit)
                    .cooldownMinutes(cooldown)
                    .priority(priority)
                    .enabled(true)
                    .build());
        }
    }

    private void initResource(String name, ResourceType type, Department dept, String location) {
        if (resourceRepository.findByName(name).isEmpty()) {
            resourceRepository.save(Resource.builder()
                    .name(name)
                    .type(type)
                    .department(dept)
                    .location(location)
                    .status(ResourceStatus.AVAILABLE)
                    .active(true)
                    .build());
        }
    }
}

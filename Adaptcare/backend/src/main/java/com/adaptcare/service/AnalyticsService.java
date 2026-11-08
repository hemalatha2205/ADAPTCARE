package com.adaptcare.service;

import com.adaptcare.dto.response.DashboardStatsDTO;
import com.adaptcare.entity.Appointment;
import com.adaptcare.entity.Department;
import com.adaptcare.entity.Doctor;
import com.adaptcare.entity.enums.AppointmentStatus;
import com.adaptcare.entity.enums.AppointmentType;
import com.adaptcare.entity.enums.QueueStatus;
import com.adaptcare.entity.enums.Role;
import com.adaptcare.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final QueueEntryRepository queueEntryRepository;
    private final AdaptationEventRepository adaptationEventRepository;
    private final DepartmentRepository departmentRepository;

    public DashboardStatsDTO getDashboardStats() {
        LocalDate today = LocalDate.now();
        List<Appointment> todayApps = appointmentRepository.findByAppointmentDate(today);

        long totalPatients = userRepository.countByRole(Role.PATIENT);
        long totalDoctors = doctorRepository.count();
        long todayAppointments = todayApps.size();
        long activeQueues = queueEntryRepository.count();

        double avgWait = todayApps.stream()
                .filter(a -> a.getEstimatedWaitTime() != null)
                .mapToInt(Appointment::getEstimatedWaitTime)
                .average()
                .orElse(0.0);

        long emergencyCount = todayApps.stream()
                .filter(a -> a.getType() == AppointmentType.EMERGENCY)
                .count();

        long adaptationCount = adaptationEventRepository.countByExecutedAtAfter(today.atStartOfDay());

        return DashboardStatsDTO.builder()
                .totalPatients(totalPatients)
                .totalDoctors(totalDoctors)
                .todayAppointments(todayAppointments)
                .activeQueues(activeQueues)
                .avgWaitTime(Math.round(avgWait * 10.0) / 10.0)
                .emergencyCount(emergencyCount)
                .adaptationCount(adaptationCount)
                .build();
    }

    public Map<String, Object> getAppointmentTrends(int days) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(Math.max(1, days));

        List<Appointment> apps = appointmentRepository.findByAppointmentDateBetween(start, end);

        Map<LocalDate, Long> byDate = apps.stream()
                .collect(Collectors.groupingBy(Appointment::getAppointmentDate, Collectors.counting()));

        List<Map<String, Object>> trendData = new ArrayList<>();
        LocalDate cur = start;
        while (!cur.isAfter(end)) {
            Map<String, Object> point = new HashMap<>();
            point.put("date", cur.toString());
            point.put("count", byDate.getOrDefault(cur, 0L));
            trendData.add(point);
            cur = cur.plusDays(1);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("trends", trendData);
        result.put("total", apps.size());
        return result;
    }

    public List<Map<String, Object>> getDepartmentWorkload(int days) {
        List<Department> departments = departmentRepository.findAll();
        LocalDate today = LocalDate.now();
        int safeDays = Math.max(1, days);

        return departments.stream().map(dept -> {
            int count = appointmentRepository.countByDepartmentIdAndAppointmentDateBetween(dept.getId(), today.minusDays(safeDays), today);
            Map<String, Object> map = new HashMap<>();
            map.put("departmentId", dept.getId());
            map.put("departmentName", dept.getName());
            map.put("appointmentCount", count);
            return map;
        }).collect(Collectors.toList());
    }
}

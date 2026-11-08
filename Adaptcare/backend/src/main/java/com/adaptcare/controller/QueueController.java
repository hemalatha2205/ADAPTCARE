package com.adaptcare.controller;

import com.adaptcare.dto.response.ApiResponse;
import com.adaptcare.dto.response.QueueEntryDTO;
import com.adaptcare.entity.User;
import com.adaptcare.entity.enums.QueueStatus;
import com.adaptcare.service.AuthService;
import com.adaptcare.service.QueueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/queue")
@RequiredArgsConstructor
public class QueueController {

    private final QueueService queueService;
    private final AuthService authService;

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<ApiResponse<List<QueueEntryDTO>>> getQueueByDoctor(@PathVariable Long doctorId) {
        return ResponseEntity.ok(ApiResponse.success(queueService.getQueueByDoctor(doctorId)));
    }

    @GetMapping("/department/{departmentId}")
    public ResponseEntity<ApiResponse<List<QueueEntryDTO>>> getQueueByDepartment(@PathVariable Long departmentId) {
        return ResponseEntity.ok(ApiResponse.success(queueService.getQueueByDepartment(departmentId)));
    }

    @GetMapping("/patient/current")
    public ResponseEntity<ApiResponse<QueueEntryDTO>> getPatientCurrentQueue() {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success(queueService.getPatientCurrentQueue(user)));
    }

    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<ApiResponse<QueueEntryDTO>> getQueueByAppointment(@PathVariable Long appointmentId) {
        return ResponseEntity.ok(ApiResponse.success(queueService.getQueueEntryByAppointmentId(appointmentId)));
    }

    @PostMapping("/check-in/{appointmentId}")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN', 'DOCTOR')")
    public ResponseEntity<ApiResponse<QueueEntryDTO>> checkInPatient(@PathVariable Long appointmentId) {
        return ResponseEntity.ok(ApiResponse.success("Patient checked into queue successfully", queueService.checkInAppointment(appointmentId)));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<QueueEntryDTO>> updateQueueStatus(
            @PathVariable Long id,
            @RequestParam QueueStatus status) {
        return ResponseEntity.ok(ApiResponse.success("Queue status updated", queueService.updateQueueStatus(id, status)));
    }

    @PostMapping("/recalculate/{doctorId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<String>> recalculateQueue(@PathVariable Long doctorId) {
        queueService.recalculateQueue(doctorId);
        return ResponseEntity.ok(ApiResponse.success("Queue recalculated successfully", null));
    }
}

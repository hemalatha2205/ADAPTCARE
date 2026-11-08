package com.adaptcare.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorDTO {
    private Long id;
    private Long userId;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private Long departmentId;
    private String departmentName;
    private String specialization;
    private String qualification;
    private int experience;
    private int consultationDuration;
    private int maxDailyAppointments;
    private boolean active;
}

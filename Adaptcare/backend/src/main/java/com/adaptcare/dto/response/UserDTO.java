package com.adaptcare.dto.response;

import com.adaptcare.entity.enums.Gender;
import com.adaptcare.entity.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private LocalDate dateOfBirth;
    private Gender gender;
    private String address;
    private Role role;
    private boolean active;
    private LocalDateTime createdAt;
}

package com.adaptcare.dto.response;

import com.adaptcare.entity.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String token;
    private String tokenType;
    private Long userId;
    private String email;
    private String firstName;
    private String lastName;
    private Role role;
}

package com.adaptcare.entity;

import com.adaptcare.entity.enums.Gender;
import com.adaptcare.entity.enums.Role;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    private String phone;

    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    private String address;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

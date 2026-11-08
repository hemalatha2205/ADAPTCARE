package com.adaptcare.service;

import com.adaptcare.dto.request.DoctorRegistrationRequest;
import com.adaptcare.dto.request.LoginRequest;
import com.adaptcare.dto.request.RegisterRequest;
import com.adaptcare.dto.response.AuthResponse;
import com.adaptcare.dto.response.UserDTO;
import com.adaptcare.entity.Department;
import com.adaptcare.entity.Doctor;
import com.adaptcare.entity.User;
import com.adaptcare.entity.enums.Role;
import com.adaptcare.exception.BadRequestException;
import com.adaptcare.exception.DuplicateResourceException;
import com.adaptcare.exception.ResourceNotFoundException;
import com.adaptcare.repository.DepartmentRepository;
import com.adaptcare.repository.DoctorRepository;
import com.adaptcare.repository.UserRepository;
import com.adaptcare.security.CustomUserDetailsService;
import com.adaptcare.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService userDetailsService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase().trim())) {
            throw new DuplicateResourceException("Email already registered: " + request.getEmail());
        }

        // Public registration always assigns PATIENT role; only authenticated ADMIN can assign other roles
        Role role = Role.PATIENT;
        Authentication currentAuth = SecurityContextHolder.getContext().getAuthentication();
        if (currentAuth != null && currentAuth.isAuthenticated() &&
                currentAuth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            role = request.getRole() != null ? request.getRole() : Role.PATIENT;
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail().toLowerCase().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .address(request.getAddress())
                .role(role)
                .active(true)
                .build();

        user = userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = tokenProvider.generateToken(userDetails, user.getRole().name(), user.getId());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .build();
    }

    @Transactional
    public UserDTO doctorRegister(DoctorRegistrationRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email already registered: " + email);
        }

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + request.getDepartmentId()));

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(Role.DOCTOR)
                .active(false) // Pending administrator approval
                .build();
        user = userRepository.save(user);

        Doctor doctor = Doctor.builder()
                .user(user)
                .department(department)
                .specialization(request.getSpecialization())
                .qualification(request.getQualification())
                .experience(request.getExperience() != null ? request.getExperience() : 0)
                .consultationDuration(20)
                .maxDailyAppointments(20)
                .active(false) // Pending administrator approval
                .build();
        doctorRepository.save(doctor);

        return toUserDTO(user);
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().toLowerCase().trim(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = userRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.getEmail()));

        if (!user.isActive()) {
            throw new BadRequestException("User account is deactivated. Please contact support.");
        }

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String token = tokenProvider.generateToken(userDetails, user.getRole().name(), user.getId());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .build();
    }

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new BadRequestException("No authenticated user found");
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found with email: " + email));
    }

    public UserDTO toUserDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .dateOfBirth(user.getDateOfBirth())
                .gender(user.getGender())
                .address(user.getAddress())
                .role(user.getRole())
                .active(user.isActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}

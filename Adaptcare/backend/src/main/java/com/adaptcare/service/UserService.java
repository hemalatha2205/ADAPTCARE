package com.adaptcare.service;

import com.adaptcare.dto.response.DashboardStatsDTO;
import com.adaptcare.dto.response.PageResponse;
import com.adaptcare.dto.response.UserDTO;
import com.adaptcare.entity.User;
import com.adaptcare.entity.enums.Role;
import com.adaptcare.exception.BadRequestException;
import com.adaptcare.exception.ResourceNotFoundException;
import com.adaptcare.repository.AppointmentRepository;
import com.adaptcare.repository.DoctorRepository;
import com.adaptcare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final AuthService authService;

    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return authService.toUserDTO(user);
    }

    public UserDTO getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return authService.toUserDTO(user);
    }

    public PageResponse<UserDTO> getAllUsers(int page, int size, Role role) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<User> userPage;
        if (role != null) {
            userPage = userRepository.findByRole(role, pageRequest);
        } else {
            userPage = userRepository.findAll(pageRequest);
        }

        List<UserDTO> content = userPage.getContent().stream()
                .map(authService::toUserDTO)
                .collect(Collectors.toList());

        return PageResponse.<UserDTO>builder()
                .content(content)
                .page(userPage.getNumber())
                .size(userPage.getSize())
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .last(userPage.isLast())
                .build();
    }

    public List<UserDTO> getUsersByRole(Role role) {
        return userRepository.findByRole(role).stream()
                .map(authService::toUserDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserDTO updateProfile(Long id, UserDTO updateDTO) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (updateDTO.getFirstName() != null) user.setFirstName(updateDTO.getFirstName());
        if (updateDTO.getLastName() != null) user.setLastName(updateDTO.getLastName());
        if (updateDTO.getPhone() != null) user.setPhone(updateDTO.getPhone());
        if (updateDTO.getDateOfBirth() != null) user.setDateOfBirth(updateDTO.getDateOfBirth());
        if (updateDTO.getGender() != null) user.setGender(updateDTO.getGender());
        if (updateDTO.getAddress() != null) user.setAddress(updateDTO.getAddress());

        return authService.toUserDTO(userRepository.save(user));
    }

    @Transactional
    public UserDTO toggleUserActive(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        // Security check: Prevent deactivation of the last active administrator
        if (user.getRole() == Role.ADMIN && user.isActive()) {
            long activeAdminCount = userRepository.findByRole(Role.ADMIN).stream()
                    .filter(User::isActive)
                    .count();
            if (activeAdminCount <= 1) {
                throw new BadRequestException("Security Policy: Cannot deactivate the last active administrator");
            }
        }

        user.setActive(!user.isActive());
        return authService.toUserDTO(userRepository.save(user));
    }
}

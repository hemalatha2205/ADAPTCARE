package com.adaptcare;

import com.adaptcare.entity.User;
import com.adaptcare.entity.enums.Role;
import com.adaptcare.exception.BadRequestException;
import com.adaptcare.repository.UserRepository;
import com.adaptcare.service.AuthService;
import com.adaptcare.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuthService authService;

    @InjectMocks
    private UserService userService;

    private User adminUser;

    @BeforeEach
    void setUp() {
        adminUser = User.builder()
                .id(1L)
                .email("admin@adaptcare.com")
                .firstName("System")
                .lastName("Administrator")
                .role(Role.ADMIN)
                .active(true)
                .build();
    }

    @Test
    @DisplayName("Should prevent deactivating the last active administrator")
    void shouldPreventDeactivatingLastAdmin() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(userRepository.findByRole(Role.ADMIN)).thenReturn(List.of(adminUser));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> userService.toggleUserActive(1L));
        assertTrue(ex.getMessage().contains("Cannot deactivate the last active administrator"));
        verify(userRepository, never()).save(any(User.class));
    }
}

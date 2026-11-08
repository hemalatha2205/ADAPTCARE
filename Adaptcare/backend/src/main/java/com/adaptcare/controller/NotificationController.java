package com.adaptcare.controller;

import com.adaptcare.dto.response.ApiResponse;
import com.adaptcare.dto.response.NotificationDTO;
import com.adaptcare.entity.User;
import com.adaptcare.service.AuthService;
import com.adaptcare.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationDTO>>> getNotifications() {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success(notificationService.getUserNotifications(user)));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount() {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success(Map.of("unreadCount", notificationService.getUnreadCount(user))));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<String>> markAsRead(@PathVariable Long id) {
        User user = authService.getCurrentUser();
        notificationService.markAsRead(id, user);
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read", null));
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<String>> markAllAsRead() {
        User user = authService.getCurrentUser();
        notificationService.markAllAsRead(user);
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read", null));
    }
}

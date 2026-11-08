package com.adaptcare.service;

import com.adaptcare.dto.response.NotificationDTO;
import com.adaptcare.entity.Notification;
import com.adaptcare.entity.User;
import com.adaptcare.entity.enums.NotificationType;
import com.adaptcare.exception.ResourceNotFoundException;
import com.adaptcare.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    @Lazy private final SseService sseService;

    @Transactional
    public NotificationDTO createNotification(User user, String title, String message,
                                              NotificationType type, Long refId, String refType) {
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .referenceId(refId)
                .referenceType(refType)
                .read(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        NotificationDTO dto = toDTO(saved);

        try {
            sseService.sendNotification(user.getId(), dto);
        } catch (Exception e) {
            log.warn("Could not send real-time notification to user {}: {}", user.getId(), e.getMessage());
        }

        return dto;
    }

    public List<NotificationDTO> getUserNotifications(User user) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public long getUnreadCount(User user) {
        return notificationRepository.countByUserAndReadFalse(user);
    }

    @Transactional
    public void markAsRead(Long id, User user) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + id));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Notification not found");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(User user) {
        List<Notification> unread = notificationRepository.findByUserAndReadFalse(user);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    public NotificationDTO toDTO(Notification n) {
        return NotificationDTO.builder()
                .id(n.getId())
                .userId(n.getUser().getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .referenceId(n.getReferenceId())
                .referenceType(n.getReferenceType())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}

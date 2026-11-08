package com.adaptcare.service;

import com.adaptcare.dto.response.NotificationDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class SseService {

    private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long userId) {
        SseEmitter emitter = new SseEmitter(1800000L); // 30 minutes timeout

        emitters.put(userId, emitter);

        emitter.onCompletion(() -> {
            log.debug("SSE completed for user: {}", userId);
            emitters.remove(userId);
        });

        emitter.onTimeout(() -> {
            log.debug("SSE timeout for user: {}", userId);
            emitters.remove(userId);
        });

        emitter.onError(e -> {
            log.debug("SSE error for user {}: {}", userId, e.getMessage());
            emitters.remove(userId);
        });

        try {
            emitter.send(SseEmitter.event()
                    .name("CONNECTED")
                    .data("Connected to ADAPTCARE Real-Time Updates"));
        } catch (IOException e) {
            emitters.remove(userId);
        }

        return emitter;
    }

    public void sendNotification(Long userId, NotificationDTO notification) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event()
                        .name("NOTIFICATION")
                        .data(notification));
            } catch (IOException e) {
                emitters.remove(userId);
            }
        }
    }

    public void broadcast(String eventName, Object data) {
        emitters.forEach((userId, emitter) -> {
            try {
                emitter.send(SseEmitter.event()
                        .name(eventName)
                        .data(data));
            } catch (IOException e) {
                emitters.remove(userId);
            }
        });
    }
}

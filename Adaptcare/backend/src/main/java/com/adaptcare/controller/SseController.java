package com.adaptcare.controller;

import com.adaptcare.security.JwtTokenProvider;
import com.adaptcare.service.SseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Slf4j
@RestController
@RequestMapping("/api/sse")
@RequiredArgsConstructor
public class SseController {

    private final SseService sseService;
    private final JwtTokenProvider tokenProvider;

    @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@RequestParam(required = false) String token) {
        Long userId = 0L;
        if (token != null && tokenProvider.validateToken(token)) {
            userId = tokenProvider.getUserIdFromToken(token);
        }
        return sseService.subscribe(userId != null ? userId : 0L);
    }
}

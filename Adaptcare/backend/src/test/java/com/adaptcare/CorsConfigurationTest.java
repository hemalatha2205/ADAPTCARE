package com.adaptcare;

import com.adaptcare.security.SecurityConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.junit.jupiter.api.Assertions.*;

class CorsConfigurationTest {

    private SecurityConfig securityConfig;
    private CorsConfigurationSource corsSource;

    @BeforeEach
    void setUp() {
        securityConfig = new SecurityConfig(null);
        ReflectionTestUtils.setField(
                securityConfig,
                "allowedOrigins",
                "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5175"
        );
        corsSource = securityConfig.corsConfigurationSource();
    }

    @Test
    @DisplayName("Should allow http://localhost:5174 origin for CORS")
    void shouldAllowFrontendOrigin5174() {
        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/auth/login");
        request.addHeader("Origin", "http://localhost:5174");
        request.addHeader("Access-Control-Request-Method", "POST");

        CorsConfiguration config = corsSource.getCorsConfiguration(request);
        assertNotNull(config, "CORS configuration must exist for /api/auth/login");

        String matchedOrigin = config.checkOrigin("http://localhost:5174");
        assertEquals("http://localhost:5174", matchedOrigin, "Origin 5174 must be allowed");
        assertTrue(config.getAllowCredentials(), "Allow credentials must be true");
        assertTrue(config.getAllowedMethods().contains("POST"), "POST must be an allowed method");
        assertTrue(config.getAllowedMethods().contains("OPTIONS"), "OPTIONS must be an allowed method");
    }

    @Test
    @DisplayName("Should reject unauthorized origins")
    void shouldRejectUnauthorizedOrigin() {
        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/auth/login");
        CorsConfiguration config = corsSource.getCorsConfiguration(request);
        assertNotNull(config);

        String matchedOrigin = config.checkOrigin("http://malicious-site.com");
        assertNull(matchedOrigin, "Disallowed external origin must return null");
    }
}

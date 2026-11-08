package com.adaptcare;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AdaptcareApplication {

    public static void main(String[] args) {
        SpringApplication.run(AdaptcareApplication.class, args);
    }
}

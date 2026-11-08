package com.adaptcare.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentDTO {
    private Long id;
    private String name;
    private String description;
    private String location;
    private boolean active;
    private LocalDateTime createdAt;
}

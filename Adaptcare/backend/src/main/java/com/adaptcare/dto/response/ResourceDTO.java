package com.adaptcare.dto.response;

import com.adaptcare.entity.enums.ResourceStatus;
import com.adaptcare.entity.enums.ResourceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceDTO {
    private Long id;
    private String name;
    private ResourceType type;
    private Long departmentId;
    private String departmentName;
    private ResourceStatus status;
    private String location;
    private String description;
    private boolean active;
}

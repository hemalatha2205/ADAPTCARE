package com.adaptcare.dto.request;

import com.adaptcare.entity.enums.ResourceStatus;
import com.adaptcare.entity.enums.ResourceType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResourceRequest {
    private String name;
    private ResourceType type;
    private Long departmentId;
    private ResourceStatus status;
    private String location;
    private String description;
}

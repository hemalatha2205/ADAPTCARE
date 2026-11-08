package com.adaptcare.entity;

import com.adaptcare.entity.enums.ResourceStatus;
import com.adaptcare.entity.enums.ResourceType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "resources")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResourceType type;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id")
    private Department department;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ResourceStatus status = ResourceStatus.AVAILABLE;

    private String location;

    private String description;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;
}

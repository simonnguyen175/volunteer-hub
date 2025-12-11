package com.example.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class EventCreateRequest {
    private Long managerId;
    private String type;
    private String title;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String location;
    private String description;
}
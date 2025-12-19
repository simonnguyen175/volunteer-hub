package com.example.backend.dto;

import com.example.backend.model.EventStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class EventUpdateRequest {
    private String type;
    private String title;
    private String location;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String description;
    private String imageUrl;
}

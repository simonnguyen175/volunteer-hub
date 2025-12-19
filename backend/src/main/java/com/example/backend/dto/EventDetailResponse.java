package com.example.backend.dto;

import com.example.backend.model.Event;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EventDetailResponse {
    private Long id;
    private String type;
    private String title;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String location;
    private String description;
    private String imageUrl;
    private String status;
    private Long managerId;
    private String managerName;

    public static EventDetailResponse fromEvent(Event event) {
        EventDetailResponse response = new EventDetailResponse();
        response.setId(event.getId());
        response.setType(event.getType());
        response.setTitle(event.getTitle());
        response.setStartTime(event.getStartTime());
        response.setEndTime(event.getEndTime());
        response.setLocation(event.getLocation());
        response.setDescription(event.getDescription());
        response.setImageUrl(event.getImageUrl());
        response.setStatus(event.getStatus().name());
        if (event.getManager() != null) {
            response.setManagerId(event.getManager().getId());
            response.setManagerName(event.getManager().getUsername());
        }
        return response;
    }
}

package com.example.backend.dto;

import com.example.backend.model.EventUser;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EventUserResponse {
    private Long id;
    private Long userId;
    private String username;
    private String email;
    private Long eventId;
    private String eventTitle;
    private String eventImageUrl;
    private boolean status;
    private boolean isCompleted;

    public static EventUserResponse fromEventUser(EventUser eventUser) {
        EventUserResponse response = new EventUserResponse();
        response.setId(eventUser.getId());
        
        if (eventUser.getUser() != null) {
            response.setUserId(eventUser.getUser().getId());
            response.setUsername(eventUser.getUser().getUsername());
            response.setEmail(eventUser.getUser().getEmail());
        }
        
        if (eventUser.getEvent() != null) {
            response.setEventId(eventUser.getEvent().getId());
            response.setEventTitle(eventUser.getEvent().getTitle());
            response.setEventImageUrl(eventUser.getEvent().getImageUrl());
        }
        
        response.setStatus(eventUser.isStatus());
        response.setCompleted(eventUser.isCompleted());
        return response;
    }
}

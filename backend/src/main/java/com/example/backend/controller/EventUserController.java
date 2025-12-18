package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.model.EventUser;
import com.example.backend.service.EventUserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/event-user")
public class EventUserController {
    private final EventUserService eventUserService;

    public EventUserController(EventUserService eventUserService) {
        this.eventUserService = eventUserService;
    }

    @PostMapping("/register/")
    public ResponseEntity<ApiResponse> joinEvent(
            @RequestParam(value = "user_id", required = false) Long userId,
            @RequestParam(value = "event_id", required = false) Long eventId) {
        ApiResponse response =
                new ApiResponse(
                        "User request to join successfully",
                        eventUserService.registerUserToEvent(userId, eventId));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/accept/")
    public ResponseEntity<ApiResponse> acceptUserToEvent(
            @RequestParam(value="event-user_id", required = false) Long id) {
        ApiResponse response =
                new ApiResponse(
                        "User accepted to event successfully",
                        eventUserService.acceptUserInEvent(id));
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @DeleteMapping("/deny/")
    public ResponseEntity<ApiResponse> denyUserToEvent(
            @RequestParam(value="event-user_id", required = false) Long id){
        ApiResponse response =
                new ApiResponse(
                        "User is denied to join event",
                        eventUserService.denyUserInEvent(id));
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }


}

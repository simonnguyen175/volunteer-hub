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

    @DeleteMapping("/leave/")
    public ResponseEntity<ApiResponse> leaveEvent(
            @RequestParam(value="user_id", required = false) Long userId,
            @RequestParam(value="event_id", required = false) Long eventId){
        EventUser eventUser = eventUserService.leaveEvent(userId, eventId);

        if (eventUser == null) {
            ApiResponse response =
                    new ApiResponse(
                            "The event has started", null
                            );
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        ApiResponse response =
                new ApiResponse(
                        "User has left the event successfully",
                        eventUser);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<ApiResponse> getUserbyEvent(@PathVariable Long eventId) {
        ApiResponse response =
                new ApiResponse("Users related to current event retrieved successfully",
                        eventUserService.getUserbyEvent(eventId));
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    // Get events that user has joined (accepted)
    @GetMapping("/joined/{userId}")
    public ResponseEntity<ApiResponse> getJoinedEvents(@PathVariable Long userId) {
        ApiResponse response =
                new ApiResponse("Joined events retrieved successfully",
                        eventUserService.getJoinedEvents(userId));
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    // Get events that user is pending to join
    @GetMapping("/pending/{userId}")
    public ResponseEntity<ApiResponse> getPendingEvents(@PathVariable Long userId) {
        ApiResponse response =
                new ApiResponse("Pending events retrieved successfully",
                        eventUserService.getPendingEvents(userId));
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    // Get all participants for an event (for host management)
    @GetMapping("/event/{eventId}/participants")
    public ResponseEntity<ApiResponse> getEventParticipants(@PathVariable Long eventId) {
        ApiResponse response =
                new ApiResponse("Participants retrieved successfully",
                        eventUserService.getEventParticipants(eventId));
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    // Get pending participants for an event (for host to approve)
    @GetMapping("/event/{eventId}/pending")
    public ResponseEntity<ApiResponse> getPendingParticipants(@PathVariable Long eventId) {
        ApiResponse response =
                new ApiResponse("Pending participants retrieved successfully",
                        eventUserService.getPendingParticipants(eventId));
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    // Get accepted participants for an event
    @GetMapping("/event/{eventId}/accepted")
    public ResponseEntity<ApiResponse> getAcceptedParticipants(@PathVariable Long eventId) {
        ApiResponse response =
                new ApiResponse("Accepted participants retrieved successfully",
                        eventUserService.getAcceptedParticipants(eventId));
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    // Get user's registration status for a specific event
    @GetMapping("/status")
    public ResponseEntity<ApiResponse> getUserEventStatus(
            @RequestParam(value = "user_id") Long userId,
            @RequestParam(value = "event_id") Long eventId) {
        ApiResponse response =
                new ApiResponse("Status retrieved successfully",
                        eventUserService.getUserEventStatus(userId, eventId));
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    // Update participant attendance (mark as completed/attended or absent)
    @PatchMapping("/complete/")
    public ResponseEntity<ApiResponse> markParticipantAttendance(
            @RequestParam(value = "eventUserId") Long eventUserId,
            @RequestParam(value = "completed") boolean completed) {
        ApiResponse response =
                new ApiResponse("Attendance updated successfully",
                        eventUserService.markCompleted(eventUserId, completed));
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
}

package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.EventCreateRequest;
import com.example.backend.dto.EventUpdateRequest;
import com.example.backend.service.EventService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/event")
public class EventController {
    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse> getAllEvents() {
        ApiResponse response =
                new ApiResponse("Events retrieved successfully", eventService.getAllEvents());
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/admin/all")
    public ResponseEntity<ApiResponse> getAllEventsForAdmin() {
        ApiResponse response =
                new ApiResponse("All events retrieved successfully", eventService.getAllEventsForAdmin());
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getEventById(@PathVariable Long id) {
        ApiResponse response =
                new ApiResponse("Event retrieved successfully", eventService.getEventDetailById(id));
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/hosted/{userId}")
    public ResponseEntity<ApiResponse> getHostedEvents(@PathVariable Long userId) {
        ApiResponse response =
                new ApiResponse("Hosted events retrieved successfully", eventService.getHostedEvents(userId));
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/search/")
    public ResponseEntity<ApiResponse> getEvents(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "type", required = false) String type) {

        Object result;
        boolean hasQ = q != null && !q.isBlank();
        boolean hasType = type != null && !type.isBlank();

        if (hasQ && hasType) {
            result = eventService.getEventsByNameAndType(q, type);
        } else if (hasQ) {
            result = eventService.getEventsByName(q);
        } else if (hasType) {
            result = eventService.getEventsByType(type);
        } else {
            result = eventService.getAllEvents();
        }

        ApiResponse response = new ApiResponse("Events retrieved successfully", result);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @PostMapping("/create")
    public ResponseEntity<ApiResponse> createEvent(@RequestBody EventCreateRequest request) {
        ApiResponse response =
                new ApiResponse("Event created successfully", eventService.createEvent(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> updateEvent(
            @PathVariable Long id, @RequestBody EventUpdateRequest request) {
        ApiResponse response =
                new ApiResponse(
                        "Event updated successfully", eventService.updateEvent(id, request));
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @PatchMapping("/{id}/accept")
    public ResponseEntity<ApiResponse> acceptEvent(@PathVariable Long id) {
        ApiResponse response =
                new ApiResponse("Event accepted successfully", eventService.acceptEvent(id));
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteEvent(@PathVariable Long id) {
        eventService.deleteEvent(id);
        ApiResponse response = new ApiResponse("Event deleted successfully", null);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
}

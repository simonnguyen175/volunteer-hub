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
        ApiResponse response = eventService.getAllEvents();
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/create")
    public ResponseEntity<ApiResponse> createEvent(@RequestBody EventCreateRequest request) {
        ApiResponse response = eventService.createEvent(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> updateEvent(@PathVariable Long id, @RequestBody EventUpdateRequest request) {
        ApiResponse response = eventService.updateEvent(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/{id}/accept")
    public ResponseEntity<ApiResponse> acceptEvent(@PathVariable Long id) {
        ApiResponse response = eventService.acceptEvent(id);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteEvent(@PathVariable Long id) {
        ApiResponse response = eventService.deleteEvent(id);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}

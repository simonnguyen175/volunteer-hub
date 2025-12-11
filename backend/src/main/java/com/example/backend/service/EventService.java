package com.example.backend.service;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.EventCreateRequest;
import com.example.backend.dto.EventUpdateRequest;
import com.example.backend.model.Event;
import com.example.backend.model.EventStatus;
import com.example.backend.model.User;
import com.example.backend.repository.EventRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EventService {
    @Autowired private EventRepository eventRepository;
    @Autowired private UserRepository userRepository;

    public ApiResponse getAllEvents() {
        List<Event> events = eventRepository.findAll();
        return new ApiResponse("Events retrieved successfully", events);
    }

    public ApiResponse createEvent(EventCreateRequest request) {
        User manager =
                userRepository
                        .findById(request.getManagerId())
                        .orElseThrow(() -> new RuntimeException("Manager not found"));

        Event event = new Event();
        event.setManager(manager);
        event.setType(request.getType());
        event.setTitle(request.getTitle());
        event.setStartTime(request.getStartTime());
        event.setEndTime(request.getEndTime());
        event.setLocation(request.getLocation());
        event.setDescription(request.getDescription());
        Event saved = eventRepository.save(event);
        return new ApiResponse("Event created successfully", saved);
    }

    public ApiResponse updateEvent(Long id, EventUpdateRequest request) {
        Event existingEvent =
                eventRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "Event with id " + id + " not found"));

        existingEvent.setType(request.getType());
        existingEvent.setStartTime(request.getStartTime());
        existingEvent.setEndTime(request.getEndTime());
        existingEvent.setLocation(request.getLocation());

        Event saved = eventRepository.save(existingEvent);
        return new ApiResponse("Event updated successfully", saved);
    }

    public ApiResponse acceptEvent(Long id) {
        Event existingEvent =
                eventRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "Event with id " + id + " not found"));

        existingEvent.setStatus(EventStatus.ACCEPTED);

        Event saved = eventRepository.save(existingEvent);
        return new ApiResponse("Event accepted successfully", saved);
    }

    public ApiResponse deleteEvent(Long id) {
        if (!eventRepository.existsById(id)) {
            throw new IllegalArgumentException("Event with id " + id + " not found");
        }
        eventRepository.deleteById(id);
        return new ApiResponse("Event deleted successfully", null);
    }
}

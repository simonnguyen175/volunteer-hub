package com.example.backend.service;

import com.example.backend.model.Event;
import com.example.backend.model.EventStatus;
import com.example.backend.repository.EventRepository;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class EventService {
    private final EventRepository eventRepository;

    public EventService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    public Event createEvent(Event event) {
        if (event == null) {
            throw new IllegalArgumentException("Event must not be null");
        }
        if (event.getType() == null || event.getType().isBlank()) {
            throw new IllegalArgumentException("Event type is required");
        }
        if (event.getStartTime() == null) {
            throw new IllegalArgumentException("Event startTime is required");
        }
        if (event.getLocation() == null || event.getLocation().isBlank()) {
            throw new IllegalArgumentException("Event location is required");
        }
        if (event.getManager() == null || event.getManager().getId() == null) {
            throw new IllegalArgumentException("Event manager (with id) is required");
        }
        return eventRepository.save(event);
    }

    public Event updateEvent(Long id, Event event) {
        Event existingEvent = eventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Event with id " + id + " not found"));

        if (event.getType() != null && !event.getType().isBlank()) {
            existingEvent.setType(event.getType());
        }
        if (event.getStartTime() != null) {
            existingEvent.setStartTime(event.getStartTime());
        }
        if (event.getEndTime() != null) {
            existingEvent.setEndTime(event.getEndTime());
        }
        if (event.getLocation() != null && !event.getLocation().isBlank()) {
            existingEvent.setLocation(event.getLocation());
        }
        if (event.getStatus() != null) {
            existingEvent.setStatus(event.getStatus());
        }
        if (event.getManager() != null && event.getManager().getId() != null) {
            existingEvent.setManager(event.getManager());
        }

        return eventRepository.save(existingEvent);
    }

    public Event partialUpdate(Long id, Map<String, Object> updates) {
        Event existingEvent = eventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Event with id " + id + " not found"));

        if (updates.containsKey("type")) {
            String type = (String) updates.get("type");
            if (type != null && !type.isBlank()) {
                existingEvent.setType(type);
            }
        }
        if (updates.containsKey("startTime")) {
            existingEvent.setStartTime((java.time.LocalDateTime) updates.get("startTime"));
        }
        if (updates.containsKey("endTime")) {
            existingEvent.setEndTime((java.time.LocalDateTime) updates.get("endTime"));
        }
        if (updates.containsKey("location")) {
            String location = (String) updates.get("location");
            if (location != null && !location.isBlank()) {
                existingEvent.setLocation(location);
            }
        }
        if (updates.containsKey("status")) {
            existingEvent.setStatus(EventStatus.valueOf((String) updates.get("status")));
        }
        if (updates.containsKey("managerId")) {
            Long managerId = Long.valueOf((Integer) updates.get("managerId"));
            com.example.backend.model.User manager = new com.example.backend.model.User();
            manager.setId(managerId);
            existingEvent.setManager(manager);
        }

        return eventRepository.save(existingEvent);
    }

    public void deleteEvent(Long id) {
        if (!eventRepository.existsById(id)) {
            throw new IllegalArgumentException("Event with id " + id + " not found");
        }
        eventRepository.deleteById(id);
    }
}

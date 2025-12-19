package com.example.backend.service;

import com.example.backend.dto.EventCreateRequest;
import com.example.backend.dto.EventDetailResponse;
import com.example.backend.dto.EventUpdateRequest;
import com.example.backend.model.Event;
import com.example.backend.model.EventStatus;
import com.example.backend.model.User;
import com.example.backend.repository.EventRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EventService {
    @Autowired private EventRepository eventRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private NotificationService notificationService;

    public List<Event> getAllEvents() {
        return eventRepository.findByStatus(EventStatus.ACCEPTED);
    }

    // For admin panel - get all events regardless of status
    public List<Event> getAllEventsForAdmin() {
        return eventRepository.findAll();
    }

    public List<Event> getEventsByName(String name) {
        String lower = name == null ? "" : name.toLowerCase();
        return eventRepository.findAll().stream()
                .filter(e -> e.getTitle() != null && e.getTitle().toLowerCase().contains(lower))
                .collect(Collectors.toList());
    }

    public List<Event> getEventsByType(String type) {
        return eventRepository.findByType(type);
    }

    public List<Event> getEventsByNameAndType(String name, String type) {
        String lower = name == null ? "" : name.toLowerCase();
        return eventRepository.findByType(type).stream()
                .filter(e -> e.getTitle() != null && e.getTitle().toLowerCase().contains(lower))
                .collect(Collectors.toList());
    }

    public Event createEvent(EventCreateRequest request) {
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
        event.setImageUrl(request.getImageUrl());
        return eventRepository.save(event);
    }

    public Event updateEvent(Long id, EventUpdateRequest request) {
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
        existingEvent.setDescription(request.getDescription());
        existingEvent.setImageUrl(request.getImageUrl());

        return eventRepository.save(existingEvent);
    }

    public Event acceptEvent(Long id) {
        Event existingEvent =
                eventRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "Event with id " + id + " not found"));

        existingEvent.setStatus(EventStatus.ACCEPTED);
        notificationService.createAndSendNotification(
                existingEvent.getManager().getId(),
                "Sự kiện "
                        + "<b>" + existingEvent.getTitle() + "</b>"
                        + " đã được chấp nhận",
                "/events/" + existingEvent.getId());
        return eventRepository.save(existingEvent);
    }

    public void deleteEvent(Long id) {
        if (!eventRepository.existsById(id)) {
            throw new IllegalArgumentException("Event with id " + id + " not found");
        }
        eventRepository.deleteById(id);
    }

    public Event getEventById(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event with id " + eventId + " not found"));
    }

    public EventDetailResponse getEventDetailById(Long eventId) {
        Event event = getEventById(eventId);
        return EventDetailResponse.fromEvent(event);
    }

    public List<EventDetailResponse> getHostedEvents(Long userId) {
        User manager = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return eventRepository.findByManager(manager).stream()
                .map(EventDetailResponse::fromEvent)
                .collect(Collectors.toList());
    }
}

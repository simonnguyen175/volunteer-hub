package com.example.backend.service;

import com.example.backend.dto.EventUserResponse;
import com.example.backend.model.Event;
import com.example.backend.model.EventUser;
import com.example.backend.model.User;
import com.example.backend.repository.EventRepository;
import com.example.backend.repository.EventUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventUserService {
    private final EventUserRepository eventUserRepository;
    private final EventService eventService;
    private final UserService userService;
    private final NotificationService notificationService;
    private final EventRepository eventRepository;

    public EventUser registerUserToEvent(Long userId, Long eventId) {
        EventUser eventUser = new EventUser();
        User user = userService.getUserById(userId);
        Event event = eventService.getEventById(eventId);

        if (eventUserRepository.existsByUserIdAndEventId(userId, eventId)) {
            return null; // User has already registered for this event
        }

        eventUser.setUser(user);
        eventUser.setEvent(event);
        eventUser.setStatus(false);
        eventUser.setCompleted(false);

        return eventUserRepository.save(eventUser);
    }

    public EventUser acceptUserInEvent(Long id) {
        EventUser eventUser = eventUserRepository.findById(id).orElse(null);
        Long userId = eventUser.getUser().getId();
        Long eventId = eventUser.getEvent().getId();
        if (eventUser != null) {
            eventUser.setStatus(true);
            notificationService.createAndSendNotification(
                    userId,
                    "Bạn đã được chấp nhận tham gia sự kiện "
                            + "<b>" + eventUser.getEvent().getTitle() + "</b>",
                    "/events/" + eventId);
            return eventUserRepository.save(eventUser);
        }
        return null;
    }

    public EventUser denyUserInEvent(Long id) {
        EventUser eventUser = eventUserRepository.findById(id).orElse(null);
        Long userId = eventUser.getUser().getId();
        Long eventId = eventUser.getEvent().getId();
        if (eventUser != null) {
            eventUserRepository.delete(eventUser);
            notificationService.createAndSendNotification(
                    userId,
                    "Bạn đã bị từ chối tham gia sự kiện "
                            + "<b>" + eventUser.getEvent().getTitle() + "</b>",
                    "/events/" + eventId);
            return eventUser;
        }
        return null;
    }

    public EventUser leaveEvent(Long userId, Long eventId) {
        User user = userService.getUserById(userId);
        Event event = eventService.getEventById(eventId);
        if (event.getStartTime().isBefore(java.time.LocalDateTime.now())) {
            return null;
        }

        System.out.println(user.getUsername() + " " + event.getTitle());

        EventUser eventUser = eventUserRepository.findByUserAndEvent(user, event).orElse(null);
        if (eventUser != null) {
            eventUserRepository.delete(eventUser);
            return eventUser;
        }
        return null;
    }

    public List<EventUserResponse> getUserbyEvent(Long eventId) {
        Event event = eventService.getEventById(eventId);
        return eventUserRepository.findByEvent(event).stream()
                .map(EventUserResponse::fromEventUser)
                .collect(Collectors.toList());
    }

    // Get all events a user is associated with
    public List<Event> getEventsByUser(Long userId) {
        User user = userService.getUserById(userId);
        List<EventUser> eventUsers = eventUserRepository.findByUserAndStatus(user, true);
        return eventUsers.stream()
                .map(EventUser::getEvent)
                .collect(Collectors.toList());
    }

    // Get events user has joined (accepted)
    public List<EventUserResponse> getJoinedEvents(Long userId) {
        User user = userService.getUserById(userId);
        return eventUserRepository.findByUserAndStatus(user, true).stream()
                .map(EventUserResponse::fromEventUser)
                .collect(Collectors.toList());
    }

    // Get events user is pending to join
    public List<EventUserResponse> getPendingEvents(Long userId) {
        User user = userService.getUserById(userId);
        return eventUserRepository.findByUserAndStatus(user, false).stream()
                .map(EventUserResponse::fromEventUser)
                .collect(Collectors.toList());
    }

    // Get all registrations for an event (for host management)
    public List<EventUserResponse> getEventParticipants(Long eventId) {
        Event event = eventService.getEventById(eventId);
        return eventUserRepository.findByEvent(event).stream()
                .map(EventUserResponse::fromEventUser)
                .collect(Collectors.toList());
    }

    // Get pending participants for an event (for host to approve)
    public List<EventUserResponse> getPendingParticipants(Long eventId) {
        Event event = eventService.getEventById(eventId);
        return eventUserRepository.findByEventAndStatus(event, false).stream()
                .map(EventUserResponse::fromEventUser)
                .collect(Collectors.toList());
    }

    // Get accepted participants for an event
    public List<EventUserResponse> getAcceptedParticipants(Long eventId) {
        Event event = eventService.getEventById(eventId);
        return eventUserRepository.findByEventAndStatus(event, true).stream()
                .map(EventUserResponse::fromEventUser)
                .collect(Collectors.toList());
    }

    // Get user's registration status for a specific event
    public EventUserResponse getUserEventStatus(Long userId, Long eventId) {
        User user = userService.getUserById(userId);
        Event event = eventService.getEventById(eventId);
        
        return eventUserRepository.findByUserAndEvent(user, event)
                .map(EventUserResponse::fromEventUser)
                .orElse(null);
    }

    // Mark participant attendance (completed or absent)
    public EventUserResponse markCompleted(Long eventUserId, boolean completed) {
        EventUser eventUser = eventUserRepository.findById(eventUserId).orElse(null);
        if (eventUser != null) {
            eventUser.setCompleted(completed);
            eventUserRepository.save(eventUser);
            return EventUserResponse.fromEventUser(eventUser);
        }
        return null;
    }
}

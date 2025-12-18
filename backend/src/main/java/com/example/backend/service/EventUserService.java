package com.example.backend.service;

import com.example.backend.model.Event;
import com.example.backend.model.EventUser;
import com.example.backend.model.User;
import com.example.backend.repository.EventRepository;
import com.example.backend.repository.EventUserRepository;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EventUserService {
    private final EventUserRepository eventUserRepository;
    private final EventService eventService;
    private final UserService userService;
    private final NotificationService notificationService;

    public EventUser registerUserToEvent(Long userId, Long eventId) {
        EventUser eventUser = new EventUser();
        User user = userService.getUserById(userId);
        Event event = eventService.getEventById(eventId);

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
                    "/event/" + eventId);
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
                    "/event/" + eventId);
            return eventUser;
        }
        return null;
    }
}

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
}

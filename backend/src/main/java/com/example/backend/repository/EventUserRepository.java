package com.example.backend.repository;

import com.example.backend.model.Event;
import com.example.backend.model.EventUser;
import com.example.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EventUserRepository extends JpaRepository<EventUser, Long> {
    void delete(EventUser eventUser);
    
    // Find all event registrations for a user
    List<EventUser> findByUser(User user);
    
    // Find all event registrations for a user by status (accepted or pending)
    List<EventUser> findByUserAndStatus(User user, boolean status);
    
    // Find all participants for an event
    List<EventUser> findByEvent(Event event);
    
    // Find all participants for an event by status
    List<EventUser> findByEventAndStatus(Event event, boolean status);
    
    // Check if user is already registered for an event
    boolean existsByUserAndEvent(User user, Event event);
    
    // Find registration by user and event
    Optional<EventUser> findByUserAndEvent(User user, Event event);
}

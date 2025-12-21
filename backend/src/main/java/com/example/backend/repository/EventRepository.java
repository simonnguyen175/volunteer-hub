package com.example.backend.repository;

import com.example.backend.model.Event;
import com.example.backend.model.EventStatus;
import com.example.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByStatus(EventStatus status);
    List<Event> findByType(String type);
    
    // Find all events managed/hosted by a user
    List<Event> findByManager(User manager);
    
    // Find accepted events hosted by a user
    List<Event> findByManagerAndStatus(User manager, EventStatus status);
    
    // Find top events by accepted participant count
    @Query("SELECT e FROM Event e LEFT JOIN EventUser eu ON eu.event = e AND eu.status = true " +
           "WHERE e.status = 'ACCEPTED' " +
           "GROUP BY e ORDER BY COUNT(eu) DESC")
    List<Event> findTopEventsByParticipants(Pageable pageable);
    
    // Find hottest events by post + comment count
    @Query("SELECT e FROM Event e LEFT JOIN Post p ON p.event = e LEFT JOIN Comment c ON c.post = p " +
           "WHERE e.status = 'ACCEPTED' " +
           "GROUP BY e ORDER BY (COUNT(DISTINCT p) + COUNT(c)) DESC")
    List<Event> findHottestEvents(Pageable pageable);
}

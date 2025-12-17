package com.example.backend.repository;

import com.example.backend.model.Event;
import com.example.backend.model.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByStatus(EventStatus status);
    List<Event> findByType(String type);
}

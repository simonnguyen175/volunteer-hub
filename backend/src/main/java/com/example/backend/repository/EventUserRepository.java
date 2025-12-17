package com.example.backend.repository;

import com.example.backend.model.EventUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventUserRepository extends JpaRepository<EventUser, Long> {
}

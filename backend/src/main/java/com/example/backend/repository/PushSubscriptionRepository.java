package com.example.backend.repository;

import com.example.backend.model.PushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {
    List<PushSubscription> findByUserId(Long userId);
    boolean existsByEndpoint(String endpoint);
}
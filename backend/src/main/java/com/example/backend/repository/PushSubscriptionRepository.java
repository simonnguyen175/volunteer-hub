package com.example.backend.repository;

import com.example.backend.model.PushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {
    List<PushSubscription> findByUserId(Long userId);

    Optional<PushSubscription> findByEndpoint(String endpoint);

    boolean existsByUserIdAndEndpoint(Integer userId, String endpoint);
}
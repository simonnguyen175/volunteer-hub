package com.example.backend.service;

import com.example.backend.dto.PushSubscriptionRequest;
import com.example.backend.model.Notification;
import com.example.backend.model.PushSubscription;
import com.example.backend.model.User;
import com.example.backend.repository.NotificationRepository;
import com.example.backend.repository.PushSubscriptionRepository;
import com.example.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepo;
    private final PushSubscriptionRepository subscriptionRepo;
    private final UserRepository userRepo;
    private final PushService pushService;
    private final ObjectMapper objectMapper;

    @Transactional
    public void createAndSendNotification(Long userId, String content, String link) {
        Notification noti = new Notification();
        User user =
                userRepo.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        noti.setUser(user);
        noti.setContent(content);
        noti.setLink(link);
        notificationRepo.save(noti);

        List<PushSubscription> subscriptions = subscriptionRepo.findByUserId(user.getId());

        // Send push notifications asynchronously in background threads
        for (PushSubscription sub : subscriptions) {
            java.util.concurrent.CompletableFuture.runAsync(() -> sendWebPush(sub, content, link));
        }
    }

    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepo.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public void markAsRead(Long notificationId) {
        Notification noti =
                notificationRepo
                        .findById(notificationId)
                        .orElseThrow(() -> new RuntimeException("Notification not found"));
        noti.setRead(true);
        notificationRepo.save(noti);
    }

    private void sendWebPush(PushSubscription sub, String message, String link) {
        try {
            Map<String, String> payload = new HashMap<>();
            payload.put("title", "Thông báo mới!");
            payload.put("body", message);
            payload.put("url", link);
            String jsonPayload = objectMapper.writeValueAsString(payload);

            Subscription librarySub =
                    new Subscription(
                            sub.getEndpoint(),
                            new Subscription.Keys(sub.getP256dh(), sub.getAuth()));

            nl.martijndwars.webpush.Notification notification =
                    new nl.martijndwars.webpush.Notification(librarySub, jsonPayload);

            pushService.send(notification);

        } catch (Exception e) {
            if (e.getMessage() != null && (e.getMessage().contains("410") || e.getMessage().contains("404"))) {
                subscriptionRepo.delete(sub);
            }
            e.printStackTrace();
        }
    }

    @Transactional
    public void subscribe(Long userId, PushSubscriptionRequest request) {
        String endpoint = request.getEndpoint();
        PushSubscription entity = new PushSubscription();
        entity.setUserId(userId);
        entity.setEndpoint(endpoint);
        if ( subscriptionRepo.existsByUserIdAndEndpoint(userId, endpoint)) {
            return;
        }
        entity.setP256dh(request.getP256dh());
        entity.setAuth(request.getAuth());
        subscriptionRepo.save(entity);
    }

}

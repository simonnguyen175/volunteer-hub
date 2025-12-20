package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.NotificationRequest;
import com.example.backend.dto.PushSubscriptionRequest;
import com.example.backend.model.User;
import com.example.backend.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/notifications")
public class NotificationController {
    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse> getUserNotifications(@PathVariable Long userId) {
        return ResponseEntity.ok(
                new ApiResponse("Success", notificationService.getUserNotifications(userId))
        );
    }

    @PutMapping("/read/{notificationId}")
    public ResponseEntity<ApiResponse> markAsRead(@PathVariable Long notificationId) {
        notificationService.markAsRead(notificationId);
        return ResponseEntity.ok(new ApiResponse("Marked as read", null));
    }

    @PostMapping("/subscribe/{userId}")
    public ResponseEntity<ApiResponse> subscribe(
            @PathVariable Long userId,
            @RequestBody PushSubscriptionRequest request) {
        notificationService.subscribe(userId, request);
        return ResponseEntity.ok(new ApiResponse("Subscription saved", null));
    }

    @PostMapping("/push")
    public ResponseEntity<ApiResponse> pushNotification(@RequestBody NotificationRequest request) {
        notificationService.createAndSendNotification(
                request.getUserId(),
                request.getContent(),
                request.getLink()
        );
        return ResponseEntity.ok(new ApiResponse("Notification sent", null));
    }
}

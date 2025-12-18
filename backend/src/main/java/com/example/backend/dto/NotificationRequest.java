package com.example.backend.dto;

import lombok.Data;

@Data
public class NotificationRequest {
    private Long userId;
    private String content;
    private String link;
}

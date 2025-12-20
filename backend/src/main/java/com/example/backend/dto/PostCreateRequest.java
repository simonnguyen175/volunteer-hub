package com.example.backend.dto;

import lombok.Data;

@Data
public class PostCreateRequest {
    private Long eventId;
    private Long userId;

    private String content;
    private String imageUrl;
}

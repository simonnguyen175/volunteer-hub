package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.PostCreateRequest;
import com.example.backend.service.PostService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/post/")
public class PostController {
    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @PostMapping("/create/")
    public ResponseEntity<ApiResponse> createPost(@RequestBody PostCreateRequest request) {
        ApiResponse apiResponse =
                new ApiResponse("Post created successfully", postService.createPost(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(apiResponse);
    }

    @GetMapping("/{postId}/")
    public ResponseEntity<ApiResponse> getPostById(@PathVariable Long postId) {
        ApiResponse apiResponse =
                new ApiResponse("Post retrieved successfully", postService.getPostById(postId));
        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping
    public ResponseEntity<ApiResponse> getAllPosts() {
        ApiResponse apiResponse =
                new ApiResponse("Posts retrieved successfully", postService.getAllPosts());
        return ResponseEntity.ok(apiResponse);
    }
}

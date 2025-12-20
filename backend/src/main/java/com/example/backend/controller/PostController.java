package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.PostCreateRequest;
import com.example.backend.service.PostService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/post")
public class PostController {
    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @PostMapping("/create")
    public ResponseEntity<ApiResponse> createPost(@RequestBody PostCreateRequest request) {
        ApiResponse apiResponse =
                new ApiResponse("Post created successfully", postService.createPost(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(apiResponse);
    }

    @GetMapping("/{postId}")
    public ResponseEntity<ApiResponse> getPostById(@PathVariable Long postId) {
        ApiResponse apiResponse =
                new ApiResponse("Post retrieved successfully", postService.getPostById(postId));
        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/by-user")
    public ResponseEntity<ApiResponse> getPostsByUserId(@RequestParam Long user_id) {
        ApiResponse apiResponse =
                new ApiResponse("Posts retrieved successfully", postService.getPostsByUserId(user_id));
        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/by-event")
    public ResponseEntity<ApiResponse> getPostsByEventId(@RequestParam Long event_id) {
        ApiResponse apiResponse =
                new ApiResponse("Posts retrieved successfully", postService.getPostsByEventId(event_id));
        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping
    public ResponseEntity<ApiResponse> getAllPosts() {
        ApiResponse apiResponse =
                new ApiResponse("Posts retrieved successfully", postService.getAllPosts());
        return ResponseEntity.ok(apiResponse);
    }

    /**
     * Get news feed posts for a logged-in user.
     * Returns global posts (eventId = null) + posts from events the user has joined.
     */
    @GetMapping("/news-feed")
    public ResponseEntity<ApiResponse> getNewsFeedPosts(@RequestParam(required = false) Long user_id) {
        if (user_id != null) {
            ApiResponse apiResponse =
                    new ApiResponse("News feed posts retrieved successfully", 
                            postService.getNewsFeedPostsForUser(user_id));
            return ResponseEntity.ok(apiResponse);
        } else {
            // For non-logged users, return only global posts
            ApiResponse apiResponse =
                    new ApiResponse("Global news feed posts retrieved successfully", 
                            postService.getGlobalNewsFeedPosts());
            return ResponseEntity.ok(apiResponse);
        }
    }

    @PutMapping("/update/{postId}")
    public ResponseEntity<ApiResponse> updatePost(
            @PathVariable Long postId, @RequestBody PostUpdateRequest request) {
        ApiResponse apiResponse =
                new ApiResponse("Post updated successfully", postService.updatePost(postId, request));
        return ResponseEntity.ok(apiResponse);
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<ApiResponse> deletePost(@PathVariable Long postId) {
        postService.deletePost(postId);
        ApiResponse apiResponse =
                new ApiResponse("Post deleted successfully", postId);
        return ResponseEntity.ok(apiResponse);
    }
}

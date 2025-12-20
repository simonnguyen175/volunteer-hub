package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.model.LikeComment;
import com.example.backend.model.LikePost;
import com.example.backend.service.LikeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/like/")
public class LikeController {
    private final LikeService likeService;

    public LikeController(LikeService likeService) {
        this.likeService = likeService;
    }

    @PostMapping("/post")
    public ResponseEntity<ApiResponse> likePost(
            @RequestParam Long user_id, @RequestParam Long post_id) {
        LikePost likePost = likeService.likePost(user_id, post_id);

        if (likePost == null) {
            ApiResponse apiResponse = new ApiResponse("Unlike post successfully", null);
            return ResponseEntity.ok(apiResponse);
        }

        ApiResponse apiResponse =
                new ApiResponse("Like post successfully", likePost);
        return ResponseEntity.ok(apiResponse);
    }

    @PostMapping("/comment")
    public ResponseEntity<ApiResponse> likeComment(
            @RequestParam Long user_id, @RequestParam Long comment_id) {
        LikeComment likeComment = likeService.likeComment(user_id, comment_id);

        if (likeComment == null) {
            ApiResponse apiResponse = new ApiResponse("Unlike comment successfully", null);
            return ResponseEntity.ok(apiResponse);
        }

        ApiResponse apiResponse =
                new ApiResponse(
                        "Like comment successfully", likeComment);
        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/post/check")
    public ResponseEntity<ApiResponse> checkLikePost(
            @RequestParam Long user_id, @RequestParam Long post_id) {
        LikePost likePost = likeService.likePost(user_id, post_id);
        if (likePost == null) {
            ApiResponse apiResponse = new ApiResponse("Check like post successfully", false);
            return ResponseEntity.ok(apiResponse);
        }
        ApiResponse apiResponse = new ApiResponse("Check like post successfully", true);
        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/comment/check")
    public ResponseEntity<ApiResponse> checkLikeComment(
            @RequestParam Long user_id, @RequestParam Long comment_id) {
        LikeComment likeComment = likeService.likeComment(user_id, comment_id);
        if (likeComment == null) {
            ApiResponse apiResponse = new ApiResponse("Check like comment successfully", false);
            return ResponseEntity.ok(apiResponse);
        }
        ApiResponse apiResponse = new ApiResponse("Check like comment successfully", true);
        return ResponseEntity.ok(apiResponse);
    }
}

package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.CommentRequest;
import com.example.backend.dto.CommentUpdateRequest;
import com.example.backend.service.CommentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/comment")
public class CommentController {
    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @PostMapping("/create/")
    public ResponseEntity<ApiResponse> createComment(@RequestBody CommentRequest commentRequest) {
        ApiResponse apiResponse =
                new ApiResponse(
                        "Comment created successfully",
                        commentService.createComment(commentRequest));
        return ResponseEntity.status(HttpStatus.CREATED).body(apiResponse);
    }

    @GetMapping("/byPost/{postId}")
    public ResponseEntity<ApiResponse> getCommentsByPostId(
            @PathVariable Long postId) {
        ApiResponse apiResponse =
                new ApiResponse(
                        "Comments retrieved successfully",
                        commentService.getCommentsByPostId(postId));
        return ResponseEntity.status(HttpStatus.OK).body(apiResponse);
    }

    @GetMapping("/byParent/{parentId}")
    public ResponseEntity<ApiResponse> getCommentsByParentId(
            @PathVariable Long parentId) {
        ApiResponse apiResponse =
                new ApiResponse(
                        "Comments retrived successfully",
                        commentService.getCommentsByParentId(parentId)
                );
        return ResponseEntity.status(HttpStatus.OK).body(apiResponse);
    }

    @PutMapping("/update/")
    public ResponseEntity<ApiResponse> updateComment(@RequestParam(value="commentId") Long commentId, @RequestBody CommentUpdateRequest commentUpdateRequest) {
        ApiResponse apiResponse =
                new ApiResponse(
                        "Comment updated successfully",
                        commentService.updateComment(commentId, commentUpdateRequest)
                );
        return ResponseEntity.status(HttpStatus.OK).body(apiResponse);
    }

    @DeleteMapping("/delete/")
    public ResponseEntity<ApiResponse> deleteComment(@RequestParam(value="commentId") Long commentId) {
        commentService.deleteComment(commentId);
        ApiResponse apiResponse =
                new ApiResponse(
                        "Comment deleted successfully",
                        commentId
                );
        return ResponseEntity.status(HttpStatus.OK).body(apiResponse);
    }
}

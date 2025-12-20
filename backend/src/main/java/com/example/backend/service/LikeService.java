package com.example.backend.service;

import com.example.backend.model.*;
import com.example.backend.repository.*;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class LikeService {
    private final LikePostRepository likePostRepository;
    private final LikeCommentRepository likeCommentRepository;
    private final UserService userService;
    private final PostService postService;
    private final CommentService commentService;

    public LikePost likePost(Long userId, Long postId) {
        LikePost likePost = checkLikePost(userId, postId);
        if (likePost != null) {
            postService.decLikeCount(likePost.getPost());
            likePostRepository.delete(likePost);
            return null;
        }

        likePost = new LikePost();

        User user = userService.getUserById(userId);
        likePost.setUser(user);

        Post post = postService.getPostById(postId);
        likePost.setPost(post);
        postService.incLikeCount(post);

        return likePostRepository.save(likePost);
    }

    public LikeComment likeComment(Long userId, Long commentId) {
        LikeComment likeComment = checkLikeComment(userId, commentId);
        if (likeComment != null) {
            likeCommentRepository.delete(likeComment);
            commentService.decLikesCount(likeComment.getComment());
            return null;
        }

        likeComment = new LikeComment();

        User user = userService.getUserById(userId);
        commentService.incLikesCount(likeComment.getComment());
        likeComment.setUser(user);

        Comment comment = commentService.getCommentById(commentId);
        likeComment.setComment(comment);

        return likeCommentRepository.save(likeComment);
    }

    public LikePost checkLikePost(Long userId, Long postId) {
        User user = userService.getUserById(userId);
        Post post = postService.getPostById(postId);
        return likePostRepository.findByUserAndPost(user, post);
    }

    public LikeComment checkLikeComment(Long userId, Long commentId) {
        User user = userService.getUserById(userId);
        Comment comment = commentService.getCommentById(commentId);
        return likeCommentRepository.findByUserAndComment(user, comment);
    }
}

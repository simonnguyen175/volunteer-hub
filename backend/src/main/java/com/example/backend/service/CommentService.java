package com.example.backend.service;

import com.example.backend.dto.CommentRequest;
import com.example.backend.dto.CommentUpdateRequest;
import com.example.backend.model.Comment;
import com.example.backend.model.Post;
import com.example.backend.model.User;
import com.example.backend.repository.CommentRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class CommentService {
    private final CommentRepository commentRepository;
    private final UserService userService;
    private final PostService postService;

    @Transactional
    public Comment createComment(CommentRequest commentRequest) {
        Comment comment = new Comment();

        Post post = postService.getPostById(commentRequest.getPostId());
        postService.incCommentCount(post);
        comment.setPost(post);

        User user = userService.getUserById(commentRequest.getUserId());
        comment.setUser(user);

        comment.setContent(commentRequest.getContent());

        Comment parentComment =
                commentRepository.findById(commentRequest.getParentCommentId()).orElse(null);
        comment.setParentComment(parentComment);
        
        // Increment repliesCount of parent comment if this is a reply
        if (parentComment != null) {
            incRepliesCount(parentComment);
        }

        comment.setLikesCount(0);
        comment.setRepliesCount(0);

        return commentRepository.save(comment);
    }

    public void incRepliesCount(Comment comment) {
        comment.setRepliesCount(comment.getRepliesCount() + 1);
        commentRepository.save(comment);
    }

    public void decRepliesCount(Comment comment) {
        comment.setRepliesCount(comment.getRepliesCount() - 1);
        commentRepository.save(comment);
    }

    public void incLikesCount(Comment comment) {
        comment.setLikesCount(comment.getLikesCount() + 1);
        commentRepository.save(comment);
    }

    public void decLikesCount(Comment comment) {
        comment.setLikesCount(comment.getLikesCount() - 1);
        commentRepository.save(comment);
    }

    public Comment getCommentById(Long commentId) {
        return commentRepository
                .findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid comment ID"));
    }

    public List<Comment> getCommentsByPostId(Long postId) {
        Post post = postService.getPostById(postId);
        return commentRepository.findByPostAndParentCommentOrderByCreatedAtDesc(post, null);
    }

    public List<Comment> getCommentsByParentId(Long parentId){
        Comment parentComment = getCommentById(parentId);
        return commentRepository.findByParentCommentOrderByCreatedAtDesc(parentComment);
    }

    public Comment updateComment(Long commentId, CommentUpdateRequest commentUpdateRequest) {
        Comment comment = getCommentById(commentId);
        comment.setContent(commentUpdateRequest.getContent());
        return commentRepository.save(comment);
    }

    public void deleteComment(Long commentId) {
        Comment comment = getCommentById(commentId);
        Post post = comment.getPost();
        postService.decCommentCount(post);
        
        // Decrement repliesCount of parent comment if this is a reply
        Comment parentComment = comment.getParentComment();
        if (parentComment != null) {
            decRepliesCount(parentComment);
        }
        
        commentRepository.delete(comment);
    }
}

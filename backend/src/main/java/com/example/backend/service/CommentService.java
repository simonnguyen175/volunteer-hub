package com.example.backend.service;

import com.example.backend.dto.CommentRequest;
import com.example.backend.dto.CommentUpdateRequest;
import com.example.backend.model.Comment;
import com.example.backend.model.LikeComment;
import com.example.backend.model.Post;
import com.example.backend.model.User;
import com.example.backend.repository.CommentRepository;
import com.example.backend.repository.LikeCommentRepository;
import com.example.backend.repository.PostRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class CommentService {
    private final CommentRepository commentRepository;
    private final LikeCommentRepository likeCommentRepository;
    private final UserService userService;
    private final PostRepository postRepository;

    void incCommentCount(Post post) {
        post.setCommentsCount(post.getCommentsCount() + 1);
        postRepository.save(post);
    }

    void decCommentCount(Post post) {
        post.setCommentsCount(post.getCommentsCount() - 1);
        postRepository.save(post);
    }

    @Transactional
    public Comment createComment(CommentRequest commentRequest) {
        Comment comment = new Comment();

        Post post = postRepository.findById(commentRequest.getPostId()).orElseThrow(() -> new IllegalArgumentException("Invalid post ID"));
        incCommentCount(post);
        comment.setPost(post);

        User user = userService.getUserById(commentRequest.getUserId());
        comment.setUser(user);

        comment.setContent(commentRequest.getContent());

        Comment parentComment =
                commentRepository.findById(commentRequest.getParentCommentId()).orElse(null);
        if (parentComment != null) {
            parentComment.setRepliesCount(parentComment.getRepliesCount() + 1);
            commentRepository.save(parentComment);
        }
        comment.setParentComment(parentComment);

        comment.setLikesCount(0);
        comment.setRepliesCount(0);

        return commentRepository.save(comment);
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
        Post post = postRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("Invalid post ID"));
        return commentRepository.findByPostAndParentComment(post, null);
    }

    public List<Comment> getCommentsByParentId(Long parentId){
        Comment parentComment = getCommentById(parentId);
        return commentRepository.findByParentComment(parentComment);
    }

    public Comment updateComment(Long commentId, CommentUpdateRequest commentUpdateRequest) {
        Comment comment = getCommentById(commentId);
        comment.setContent(commentUpdateRequest.getContent());
        return commentRepository.save(comment);
    }

    public void deleteComment(Long commentId) {
        List<Comment> comments = getCommentsByParentId(commentId);

        for (Comment c : comments) {
            deleteComment(c.getId());
        }

        Comment comment = getCommentById(commentId);

        List<LikeComment> likeComments = likeCommentRepository.findByComment(comment);
        likeCommentRepository.deleteAll(likeComments);

        Post post = comment.getPost();
        decCommentCount(post);
        
        // Decrement repliesCount of parent comment if this is a reply
        Comment parentComment = comment.getParentComment();
        if (parentComment != null) {
            decRepliesCount(parentComment);
        }
        
        commentRepository.delete(comment);
    }
}

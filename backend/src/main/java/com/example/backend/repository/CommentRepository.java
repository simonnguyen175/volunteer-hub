package com.example.backend.repository;

import com.example.backend.model.Comment;
import com.example.backend.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByParentCommentOrderByCreatedAtDesc(Comment parentComment);

    List<Comment> findByPostAndParentCommentOrderByCreatedAtDesc(Post post, Object o);

    List<Comment> findByPostOrderByCreatedAtDesc(Post post);
}

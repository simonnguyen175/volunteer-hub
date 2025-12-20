package com.example.backend.repository;

import com.example.backend.model.Comment;
import com.example.backend.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByParentComment(Comment parentComment);

    List<Comment> findByPostAndParentComment(Post post, Object o);
}

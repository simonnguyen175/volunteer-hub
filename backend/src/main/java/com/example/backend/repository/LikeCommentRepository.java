package com.example.backend.repository;

import com.example.backend.model.Comment;
import com.example.backend.model.LikeComment;
import com.example.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LikeCommentRepository extends JpaRepository<LikeComment, Integer> {
    LikeComment findByUserAndComment(User user, Comment comment);
}

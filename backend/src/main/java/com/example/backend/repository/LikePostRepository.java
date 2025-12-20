package com.example.backend.repository;

import com.example.backend.model.LikePost;
import com.example.backend.model.Post;
import com.example.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LikePostRepository extends JpaRepository<LikePost, Integer> {
    LikePost findByUserAndPost(User user, Post post);
}

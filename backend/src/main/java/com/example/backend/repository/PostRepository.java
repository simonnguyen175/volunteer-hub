package com.example.backend.repository;

import com.example.backend.model.Event;
import com.example.backend.model.Post;
import com.example.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByEvent(Event event);

    List<Post> findByUser(User user);
}

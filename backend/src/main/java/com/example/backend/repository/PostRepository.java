package com.example.backend.repository;

import com.example.backend.model.Event;
import com.example.backend.model.Post;
import com.example.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByEventOrderByCreatedAtDesc(Event event);

    List<Post> findByUserOrderByCreatedAtDesc(User user);

    List<Post> findByEvent(Event event);

    List<Post> findByUser(User user);

    // Find all posts with null event (global posts for news feed)
    List<Post> findByEventIsNullOrderByCreatedAtDesc(org.springframework.data.domain.Pageable pageable);

    // Find posts for multiple events
    @Query("SELECT p FROM Post p WHERE p.event IN :events ORDER BY p.createdAt DESC")
    List<Post> findByEventInOrderByCreatedAtDesc(@Param("events") List<Event> events, org.springframework.data.domain.Pageable pageable);

    // Find all global posts + posts from specific events (for news feed)
    @Query("SELECT p FROM Post p WHERE p.event IS NULL OR p.event IN :events ORDER BY p.createdAt DESC")
    List<Post> findNewsFeedPosts(@Param("events") List<Event> events, org.springframework.data.domain.Pageable pageable);

    // Find all posts ordered by creation time (for non-logged users)
    List<Post> findAllByOrderByCreatedAtDesc();
}

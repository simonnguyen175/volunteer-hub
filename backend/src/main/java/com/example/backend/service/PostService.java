package com.example.backend.service;

import com.example.backend.controller.PostUpdateRequest;
import com.example.backend.dto.PostCreateRequest;
import com.example.backend.model.*;
import com.example.backend.repository.CommentRepository;
import com.example.backend.repository.LikePostRepository;
import com.example.backend.repository.PostRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class PostService {
    private final PostRepository postRepository;
    private final UserService userService;
    private final EventService eventService;
    private final EventUserService eventUserService;
    private final CommentRepository commentRepository;
    private final CommentService commentService;
    private final LikePostRepository likePostRepository;

    public Post createPost(PostCreateRequest request) {
        Post post = new Post();
        
        // Handle null eventId for general news feed posts
        if (request.getEventId() != null) {
            Event event = eventService.getEventById(request.getEventId());
            post.setEvent(event);
        } else {
            post.setEvent(null);
        }
        
        User user = userService.getUserById(request.getUserId());
        post.setUser(user);
        post.setContent(request.getContent());
        post.setImageUrl(request.getImageUrl());
        post.setCommentsCount(0);
        post.setLikesCount(0);

        return postRepository.save(post);
    }

    public void incLikeCount(Post post) {
        post.setLikesCount(post.getLikesCount() + 1);
        postRepository.save(post);
    }

    public void decLikeCount(Post post) {
        post.setLikesCount(post.getLikesCount() - 1);
        postRepository.save(post);
    }

    public Post getPostById(Long postId) {
        return postRepository
                .findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid post ID"));
    }

    public List<Post> getAllPosts() {
        return postRepository.findAll();
    }

    public List<Post> getPostsByEventId(Long eventId) {
        Event event = eventService.getEventById(eventId);
        return postRepository.findByEventOrderByCreatedAtDesc(event);
    }

    public List<Post> getPostsByUserId(Long userId) {
        User user = userService.getUserById(userId);
        List<Post> posts = postRepository.findByUserOrderByCreatedAtDesc(user);
        List<Event> events = eventUserService.getEventsByUser(userId);
        for (Event event : events) {
            posts.addAll(postRepository.findByEventOrderByCreatedAtDesc(event));
        }
        return posts;
    }

    /**
     * Get news feed posts for a logged-in user.
     * Includes: global posts (eventId = null) + posts from events the user has joined
     */
    public List<Post> getNewsFeedPostsForUser(Long userId) {
        List<Event> joinedEvents = eventUserService.getEventsByUser(userId);
        
        if (joinedEvents.isEmpty()) {
            // Only return global posts if user hasn't joined any events
            return postRepository.findByEventIsNullOrderByCreatedAtDesc();
        }
        
        return postRepository.findNewsFeedPosts(joinedEvents);
    }

    /**
     * Get news feed posts for non-logged users.
     * Only includes global posts (eventId = null)
     */
    public List<Post> getGlobalNewsFeedPosts() {
        return postRepository.findByEventIsNullOrderByCreatedAtDesc();
    }

    public Post updatePost(Long postId, PostUpdateRequest request) {
        Post post = getPostById(postId);
        post.setContent(request.getContent());
        post.setImageUrl(request.getImageUrl());

        return postRepository.save(post);
    }

    public void deletePost(Long postId) {
        Post post = getPostById(postId);

        List<Comment> comments = commentRepository.findByPost(post);
        for (Comment comment : comments) {
            commentService.deleteComment(comment.getId());
        }

        List<LikePost> likePosts = likePostRepository.findByPost(post);
        likePostRepository.deleteAll(likePosts);

        postRepository.delete(post);
    }
}

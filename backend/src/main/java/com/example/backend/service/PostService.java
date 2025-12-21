package com.example.backend.service;

import com.example.backend.controller.PostUpdateRequest;
import com.example.backend.dto.EventUserResponse;
import com.example.backend.dto.PostCreateRequest;
import com.example.backend.model.*;
import com.example.backend.repository.CommentRepository;
import com.example.backend.repository.LikeCommentRepository;
import com.example.backend.repository.LikePostRepository;
import com.example.backend.repository.PostRepository;
import com.example.backend.repository.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
    private final LikePostRepository likePostRepository;
    private final LikeCommentRepository likeCommentRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    /**
     * Get current authenticated user from SecurityContext
     */
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("User not authenticated");
        }
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AccessDeniedException("User not found"));
    }

    /**
     * Check if current user can modify the post (owner or admin)
     */
    private boolean canModifyPost(Post post, User currentUser) {
        // Admin can modify any post
        if (currentUser.getRole().getName() == RoleName.ADMIN) {
            return true;
        }
        // User can only modify their own posts
        return post.getUser().getId().equals(currentUser.getId());
    }

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

        List<EventUserResponse> users = eventUserService.getUserbyEvent(request.getEventId());
        for (EventUserResponse u : users) {
            if (!u.getUserId().equals(request.getUserId())) {
                notificationService.createAndSendNotification(
                        u.getId(),
                        "Có một bài viết mới trong sự kiện "
                                + "<b>" + (request.getEventId() != null ? eventService.getEventById(request.getEventId()).getTitle() : "Chung") + "</b>",
                        request.getEventId() != null ? "/events/" + request.getEventId() : "/news-feed");
            }
        }

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
    public List<Post> getNewsFeedPostsForUser(Long userId, int page, int size) {
        List<Event> joinedEvents = eventUserService.getEventsByUser(userId);
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        
        if (joinedEvents.isEmpty()) {
            // Only return global posts if user hasn't joined any events
            return postRepository.findByEventIsNullOrderByCreatedAtDesc(pageable);
        }
        
        return postRepository.findNewsFeedPosts(joinedEvents, pageable);
    }

    /**
     * Get news feed posts for non-logged users.
     * Only includes global posts (eventId = null)
     */
    public List<Post> getGlobalNewsFeedPosts(int page, int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        return postRepository.findByEventIsNullOrderByCreatedAtDesc(pageable);
    }

    public Post updatePost(Long postId, PostUpdateRequest request) {
        Post post = getPostById(postId);

        // Check if current user can modify this post
        User currentUser = getCurrentUser();
        if (!canModifyPost(post, currentUser)) {
            throw new AccessDeniedException("You don't have permission to modify this post");
        }

        post.setContent(request.getContent());
        post.setImageUrl(request.getImageUrl());

        return postRepository.save(post);
    }

    public void deletePost(Long postId) {
        Post post = getPostById(postId);

        // Check if current user can modify this post
        User currentUser = getCurrentUser();
        if (!canModifyPost(post, currentUser)) {
            throw new AccessDeniedException("You don't have permission to delete this post");
        }

        // Delete all comments and their likes for this post
        List<Comment> comments = commentRepository.findByPost(post);
        for (Comment comment : comments) {
            // Delete likes on this comment
            List<LikeComment> commentLikes = likeCommentRepository.findByComment(comment);
            likeCommentRepository.deleteAll(commentLikes);

            // Delete replies to this comment recursively
            deleteCommentReplies(comment);
        }

        // Delete all parent comments
        commentRepository.deleteAll(comments);

        // Delete likes on post
        List<LikePost> likePosts = likePostRepository.findByPost(post);
        likePostRepository.deleteAll(likePosts);

        // Delete the post
        postRepository.delete(post);
    }

    /**
     * Recursively delete all replies to a comment
     */
    private void deleteCommentReplies(Comment parentComment) {
        List<Comment> replies = commentRepository.findByParentCommentOrderByCreatedAtDesc(parentComment);
        for (Comment reply : replies) {
            // Delete likes on reply
            List<LikeComment> replyLikes = likeCommentRepository.findByComment(reply);
            likeCommentRepository.deleteAll(replyLikes);

            // Recursively delete sub-replies
            deleteCommentReplies(reply);

            // Delete the reply itself
            commentRepository.delete(reply);
        }
    }
}

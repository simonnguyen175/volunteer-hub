package com.example.backend.service;

import com.example.backend.controller.PostUpdateRequest;
import com.example.backend.dto.PostCreateRequest;
import com.example.backend.model.*;
import com.example.backend.repository.CommentRepository;
import com.example.backend.repository.LikePostRepository;
import com.example.backend.repository.PostRepository;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authorization.method.AuthorizeReturnObject;
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
        Event event = eventService.getEventById(request.getEventId());
        User user = userService.getUserById(request.getUserId());
        post.setEvent(event);
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
        return postRepository.findByEvent(event);
    }

    public List<Post> getPostsByUserId(Long userId) {
        User user = userService.getUserById(userId);
        List<Post> posts = postRepository.findByUser(user);
        List<Event> events = eventUserService.getEventsByUser(userId);
        for (Event event : events) {
            posts.addAll(postRepository.findByEvent(event));
        }
        return posts;
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

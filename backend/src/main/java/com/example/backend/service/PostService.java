package com.example.backend.service;

import com.example.backend.dto.PostCreateRequest;
import com.example.backend.model.Event;
import com.example.backend.model.Post;
import com.example.backend.model.User;
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

    public void incCommentCount(Post post) {
        post.setCommentsCount(post.getCommentsCount() + 1);
        postRepository.save(post);
    }

    public void decCommentCount(Post post) {
        post.setCommentsCount(post.getCommentsCount() - 1);
        postRepository.save(post);
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
}

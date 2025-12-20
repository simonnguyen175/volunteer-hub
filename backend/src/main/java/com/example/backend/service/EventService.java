package com.example.backend.service;

import com.example.backend.dto.EventCreateRequest;
import com.example.backend.dto.EventDetailResponse;
import com.example.backend.dto.EventUpdateRequest;
import com.example.backend.model.Comment;
import com.example.backend.model.Event;
import com.example.backend.model.EventStatus;
import com.example.backend.model.EventUser;
import com.example.backend.model.LikeComment;
import com.example.backend.model.LikePost;
import com.example.backend.model.Post;
import com.example.backend.model.User;
import com.example.backend.repository.CommentRepository;
import com.example.backend.repository.EventRepository;
import com.example.backend.repository.EventUserRepository;
import com.example.backend.repository.LikeCommentRepository;
import com.example.backend.repository.LikePostRepository;
import com.example.backend.repository.PostRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;
import jakarta.transaction.Transactional;

@Service
public class EventService {
    @Autowired private EventRepository eventRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private NotificationService notificationService;
    @Autowired private PostRepository postRepository;
    @Autowired private EventUserRepository eventUserRepository;
    @Autowired private CommentRepository commentRepository;
    @Autowired private LikePostRepository likePostRepository;
    @Autowired private LikeCommentRepository likeCommentRepository;

    public List<EventDetailResponse> getAllEvents() {
        return eventRepository.findByStatus(EventStatus.ACCEPTED).stream()
                .map(EventDetailResponse::fromEvent)
                .collect(Collectors.toList());
    }

    // For admin panel - get all events regardless of status
    public List<EventDetailResponse> getAllEventsForAdmin() {
        return eventRepository.findAll().stream()
                .map(EventDetailResponse::fromEvent)
                .collect(Collectors.toList());
    }

    public List<EventDetailResponse> getEventsByName(String name) {
        String lower = name == null ? "" : name.toLowerCase();
        return eventRepository.findAll().stream()
                .filter(e -> e.getTitle() != null && e.getTitle().toLowerCase().contains(lower))
                .map(EventDetailResponse::fromEvent)
                .collect(Collectors.toList());
    }

    public List<EventDetailResponse> getEventsByType(String type) {
        return eventRepository.findByType(type).stream()
                .map(EventDetailResponse::fromEvent)
                .collect(Collectors.toList());
    }

    public List<EventDetailResponse> getEventsByNameAndType(String name, String type) {
        String lower = name == null ? "" : name.toLowerCase();
        return eventRepository.findByType(type).stream()
                .filter(e -> e.getTitle() != null && e.getTitle().toLowerCase().contains(lower))
                .map(EventDetailResponse::fromEvent)
                .collect(Collectors.toList());
    }

    public Event createEvent(EventCreateRequest request) {
        User manager =
                userRepository
                        .findById(request.getManagerId())
                        .orElseThrow(() -> new RuntimeException("Manager not found"));

        Event event = new Event();
        event.setManager(manager);
        event.setType(request.getType());
        event.setTitle(request.getTitle());
        event.setStartTime(request.getStartTime());
        event.setEndTime(request.getEndTime());
        event.setLocation(request.getLocation());
        event.setDescription(request.getDescription());
        event.setImageUrl(request.getImageUrl());
        return eventRepository.save(event);
    }

    public Event updateEvent(Long id, EventUpdateRequest request) {
        Event existingEvent =
                eventRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "Event with id " + id + " not found"));

        existingEvent.setTitle(request.getTitle());
        existingEvent.setType(request.getType());
        existingEvent.setStartTime(request.getStartTime());
        existingEvent.setEndTime(request.getEndTime());
        existingEvent.setLocation(request.getLocation());
        existingEvent.setDescription(request.getDescription());
        existingEvent.setImageUrl(request.getImageUrl());

        return eventRepository.save(existingEvent);
    }

    public Event acceptEvent(Long id) {
        Event existingEvent =
                eventRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "Event with id " + id + " not found"));

        existingEvent.setStatus(EventStatus.ACCEPTED);
        Event savedEvent = eventRepository.save(existingEvent);
        
        // Notify the event manager
        notificationService.createAndSendNotification(
                existingEvent.getManager().getId(),
                "Sự kiện "
                        + "<b>" + existingEvent.getTitle() + "</b>"
                        + " đã được chấp nhận",
                "/events/" + existingEvent.getId());
        
        // Create a global news feed post to announce the new event
        createNewEventAnnouncement(savedEvent);
        
        return savedEvent;
    }

    /**
     * Creates a global news feed post announcing a new event.
     * This post will appear in everyone's news feed.
     */
    private void createNewEventAnnouncement(Event event) {
        Post post = new Post();
        post.setEvent(null); // Global post (null event = appears in everyone's feed)
        post.setUser(event.getManager());
        
        // Format the event date
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy 'at' HH:mm");
        String startDate = event.getStartTime() != null ? event.getStartTime().format(formatter) : "TBD";
        
        // Create announcement content
        String content = "🎉 New Event Announcement!\n\n" +
                "📢 " + event.getTitle() + "\n\n" +
                "📍 Location: " + event.getLocation() + "\n" +
                "📅 Date: " + startDate + "\n\n" +
                (event.getDescription() != null && event.getDescription().length() > 150 
                    ? event.getDescription().substring(0, 150) + "..." 
                    : event.getDescription()) + "\n\n" +
                "Join us and make a difference! Click to learn more and register.";
        
        post.setContent(content);
        post.setImageUrl(event.getImageUrl()); // Use the event's image
        post.setLikesCount(0);
        post.setCommentsCount(0);
        
        postRepository.save(post);
    }

    @Transactional
    public void deleteEvent(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Event with id " + id + " not found"));
        
        // 1. Delete all EventUser registrations for this event
        List<EventUser> eventUsers = eventUserRepository.findByEvent(event);
        eventUserRepository.deleteAll(eventUsers);
        
        // 2. Get all posts associated with this event
        List<Post> posts = postRepository.findByEvent(event);
        
        // 3. For each post, delete comments and likes
        for (Post post : posts) {
            // Get all comments for this post
            List<Comment> comments = commentRepository.findByPost(post);
            
            // Delete likes on comments
            for (Comment comment : comments) {
                List<LikeComment> commentLikes = likeCommentRepository.findByComment(comment);
                likeCommentRepository.deleteAll(commentLikes);
            }
            
            // Delete child comments first (replies), then parent comments
            for (Comment comment : comments) {
                List<Comment> replies = commentRepository.findByParentComment(comment);
                // Delete likes on replies
                for (Comment reply : replies) {
                    List<LikeComment> replyLikes = likeCommentRepository.findByComment(reply);
                    likeCommentRepository.deleteAll(replyLikes);
                }
                commentRepository.deleteAll(replies);
            }
            
            // Now delete all parent comments
            commentRepository.deleteAll(comments);
            
            // Delete likes on post
            List<LikePost> postLikes = likePostRepository.findByPost(post);
            likePostRepository.deleteAll(postLikes);
        }
        
        // 4. Delete all posts for this event
        postRepository.deleteAll(posts);
        
        // 5. Finally delete the event
        eventRepository.delete(event);
    }

    public Event getEventById(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event with id " + eventId + " not found"));
    }

    public EventDetailResponse getEventDetailById(Long eventId) {
        Event event = getEventById(eventId);
        return EventDetailResponse.fromEvent(event);
    }

    public List<EventDetailResponse> getHostedEvents(Long userId) {
        User manager = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return eventRepository.findByManager(manager).stream()
                .map(EventDetailResponse::fromEvent)
                .collect(Collectors.toList());
    }
}

package com.example.backend.service;

import com.example.backend.model.Event;
import com.example.backend.model.Role;
import com.example.backend.model.RoleName;
import com.example.backend.model.User;
import com.example.backend.repository.EventRepository;
import com.example.backend.repository.RoleRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final NotificationService notificationService;
    private final EventRepository eventRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<User> getUserByName(String name) {
        String lower = name == null ? "" : name.toLowerCase();
        return userRepository.findAll().stream()
                .filter(u -> u.getUsername() != null && u.getUsername().toLowerCase().contains(lower))
                .collect(Collectors.toList());
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    public User updateUser(Long id, RoleName roleName) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User with id " + id + " not found"));

        Role oldRole = existingUser.getRole();
        
        // Check if user is a HOST with events - prevent role change
        if (oldRole != null && oldRole.getName() == RoleName.HOST) {
            List<Event> hostedEvents = eventRepository.findByManager(existingUser);
            if (!hostedEvents.isEmpty()) {
                throw new IllegalStateException(
                        "Cannot change role of a host who has events. User '" + existingUser.getUsername() 
                        + "' has " + hostedEvents.size() + " event(s).");
            }
        }
        
        Role newRole = roleRepository.findByName(roleName)
                .orElseThrow(() -> new IllegalArgumentException("Role " + roleName + " not found"));

        existingUser.setRole(newRole);
        User savedUser = userRepository.save(existingUser);

        // Notify user about role change
        if (oldRole == null || !oldRole.getName().equals(newRole.getName())) {
            notificationService.createAndSendNotification(
                    id,
                    "[ROLE_CHANGED] Your role has been changed to <b>" + roleName.name() + "</b>. Please refresh to apply changes.",
                    "/");
        }

        return savedUser;
    }

    public User updateUser(Long id, String roleParam) {
        if (roleParam == null) {
            throw new IllegalArgumentException("role parameter is required");
        }

        try {
            Long roleId = Long.parseLong(roleParam);
            Role role = roleRepository.findById(roleId)
                    .orElseThrow(() -> new IllegalArgumentException("Role with id " + roleId + " not found"));
            User existingUser = userRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("User with id " + id + " not found"));
            existingUser.setRole(role);
            return userRepository.save(existingUser);
        } catch (NumberFormatException e) {
            try {
                RoleName rn = RoleName.valueOf(roleParam);
                return updateUser(id, rn);
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Invalid role parameter: " + roleParam);
            }
        }
    }

    public User lockUser(Long id) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User with id " + id + " not found"));
        existingUser.setLocked(!existingUser.isLocked());
        return userRepository.save(existingUser);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User with id " + userId + " not found"));
    }
}

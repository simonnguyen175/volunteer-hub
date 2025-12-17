package com.example.backend.service;

import com.example.backend.model.Role;
import com.example.backend.model.RoleName;
import com.example.backend.model.User;
import com.example.backend.repository.RoleRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public UserService(UserRepository userRepository, RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

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

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new IllegalArgumentException("Role " + roleName + " not found"));

        existingUser.setRole(role);
        return userRepository.save(existingUser);
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

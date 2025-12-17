package com.example.backend.controller;

import com.example.backend.model.Role;
import com.example.backend.model.User;
import com.example.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/user")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping()
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/?name={name}")
    public ResponseEntity<List<User>> getUserByName(String name) {
        List<User> users = userService.getUserByName(name);
        return ResponseEntity.ok(users);
    }

    @PatchMapping("/{id}/?role={role}")
    public ResponseEntity<User> updateUser(Long id, Role role) {
        User updated = userService.updateUser(id, role);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/lock")
    public ResponseEntity<User> lockUser(Long id) {
        User locked = userService.lockUser(id);
        return ResponseEntity.ok(locked);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}

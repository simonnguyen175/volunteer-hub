package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.model.User;
import com.example.backend.service.UserService;
import org.springframework.http.HttpStatus;
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
    public ResponseEntity<ApiResponse> getAllUsers() {
        List<User> users = userService.getAllUsers();
        ApiResponse response = new ApiResponse("Fetched all users", users);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/search/")
    public ResponseEntity<ApiResponse> getUserByName(
            @RequestParam(value = "q", required = false) String q) {
        Object result;
        result = userService.getUserByName(q);
        if (result == null || ((List<?>) result).isEmpty()) {
            System.out.println("Find by Email " + q);
            result = userService.getUserByEmail(q);
        }
        ApiResponse response = new ApiResponse("Users retrieved successfully", result);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @PatchMapping("/{id}/")
    public ResponseEntity<ApiResponse> updateUser(@PathVariable Long id, @RequestParam String role) {
        User updated = userService.updateUser(id, role);
        ApiResponse response = new ApiResponse("User updated successfully", updated);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @PatchMapping("/{id}/(un)lock")
    public ResponseEntity<ApiResponse> lockUser(@PathVariable Long id) {
        User locked = userService.lockUser(id);
        ApiResponse response = new ApiResponse("User lock status toggled successfully", locked);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        ApiResponse response = new ApiResponse("User deleted successfully", id);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
}

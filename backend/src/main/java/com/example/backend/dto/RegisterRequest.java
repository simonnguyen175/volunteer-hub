package com.example.backend.dto;

import com.example.backend.model.RoleName;
import lombok.Data;

@Data
public class RegisterRequest {
    private String username;

    private String email;

    private String password;
    private RoleName role; // USER, HOST, ADMIN
}

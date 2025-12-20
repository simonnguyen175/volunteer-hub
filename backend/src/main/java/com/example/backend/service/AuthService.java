package com.example.backend.service;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.AuthResponse;
import com.example.backend.dto.LoginRequest;
import com.example.backend.dto.RegisterRequest;
import com.example.backend.exception.AppException;
import com.example.backend.model.Role;
import com.example.backend.model.RoleName;
import com.example.backend.model.User;
import com.example.backend.repository.RoleRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public ApiResponse register(RegisterRequest request) {

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException("Username already taken", HttpStatus.CONFLICT);
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException("Email already taken", HttpStatus.CONFLICT);
        }

        RoleName roleName = request.getRole() == null ? RoleName.USER : request.getRole();

        Role role =
                roleRepository
                        .findByName(roleName)
                        .orElseThrow(
                                () -> new AppException("Role not found", HttpStatus.BAD_REQUEST));

        User user =
                User.builder()
                        .username(request.getUsername())
                        .email(request.getEmail())
                        .password(passwordEncoder.encode(request.getPassword()))
                        .role(role)
                        .build();

        User saved = userRepository.save(user);

        return new ApiResponse("User registered successfully", saved);
    }

    public ApiResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getUsername()).orElse(null);
        if (user == null) {
            user =
                    userRepository
                            .findByUsername(request.getUsername())
                            .orElseThrow(
                                    () ->
                                            new AppException(
                                                    "User doesn't exist", HttpStatus.NOT_FOUND));
        }

        // Check if user is locked
        if (user.isLocked()) {
            throw new AppException("ACCOUNT_LOCKED", HttpStatus.FORBIDDEN);
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            user.getUsername(), request.getPassword()));
        } catch (BadCredentialsException ex) {
            throw new AppException("Invalid password", HttpStatus.UNAUTHORIZED);
        }

        String token = jwtService.generateToken(user.getUsername());

        AuthResponse authResponse =
                new AuthResponse(token, user);

        return new ApiResponse("Login successful", authResponse);
    }
}

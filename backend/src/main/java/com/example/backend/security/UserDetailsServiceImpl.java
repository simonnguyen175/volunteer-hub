package com.example.backend.security;

import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        User user =
                userRepository
                        .findByUsername(username)
                        .orElseThrow(
                                () -> new UsernameNotFoundException("User not found: " + username));

        String roleName = "ROLE_" + user.getRole().getName().name(); // ROLE_USER etc

        return org.springframework.security.core.userdetails.User.withUsername(user.getUsername())
                .password(user.getPassword())
                .authorities(roleName)
                .build();
    }

    public boolean isUserLocked(String username) {
        return userRepository
                .findByUsername(username)
                .map(User::isLocked)
                .orElse(false);
    }
}

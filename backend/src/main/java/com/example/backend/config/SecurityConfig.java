package com.example.backend.config;

import com.example.backend.security.AccessDeniedHandlerImpl;
import com.example.backend.security.AuthenticationEntryPointImpl;
import com.example.backend.security.UserDetailsServiceImpl;
import com.example.backend.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsServiceImpl userDetailsService;
    private final AuthenticationEntryPointImpl authenticationEntryPoint;
    private final AccessDeniedHandlerImpl accessDeniedHandler;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http.cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(
                        session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(
                        ex ->
                                ex.authenticationEntryPoint(authenticationEntryPoint)
                                        .accessDeniedHandler(accessDeniedHandler))
                .authorizeHttpRequests(
                        auth -> auth
                                // Public endpoints - không cần đăng nhập
                                .requestMatchers("/auth/**").permitAll()
                                .requestMatchers("/", "/index.html", "/sw.js", "/push-notifications.js").permitAll()
                                .requestMatchers("/*.png", "/*.ico", "/*.css", "/*.js").permitAll()
                                .requestMatchers(HttpMethod.GET, "/event", "/event/search/**", "/event/{id}", "/event/top", "/event/hottest").permitAll()
                                .requestMatchers(HttpMethod.GET, "/event/hosted/{userId}").permitAll()
                                .requestMatchers(HttpMethod.GET, "/post/**", "/comment/**").permitAll()
                                .requestMatchers(HttpMethod.GET, "/like/**").permitAll()
                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                                // Admin only endpoints
                                .requestMatchers("/event/admin/**").hasAuthority("ADMIN")
                                .requestMatchers(HttpMethod.PATCH, "/event/{id}/accept").hasAuthority("ADMIN")
                                .requestMatchers("/user/**").hasAuthority("ADMIN")

                                // Host and Admin endpoints - tạo event
                                .requestMatchers(HttpMethod.POST, "/event/create").hasAnyAuthority("HOST", "ADMIN")

                                // Authenticated endpoints - sửa/xóa event (logic check owner trong service)
                                .requestMatchers(HttpMethod.PUT, "/event/{id}").hasAnyAuthority("HOST", "ADMIN")
                                .requestMatchers(HttpMethod.DELETE, "/event/{id}").hasAnyAuthority("HOST", "ADMIN")

                                // Event user management - authenticated users
                                .requestMatchers(HttpMethod.GET, "/event-user/**").authenticated()
                                .requestMatchers(HttpMethod.POST, "/event-user/register/**").authenticated()
                                .requestMatchers(HttpMethod.POST, "/event-user/accept/**").hasAnyAuthority("HOST", "ADMIN")
                                .requestMatchers(HttpMethod.DELETE, "/event-user/deny/**").hasAnyAuthority("HOST", "ADMIN")
                                .requestMatchers(HttpMethod.DELETE, "/event-user/leave/**").authenticated()

                                // Post endpoints - authenticated users (logic check owner trong service)
                                .requestMatchers(HttpMethod.POST, "/post/create").authenticated()
                                .requestMatchers(HttpMethod.PUT, "/post/update/{postId}").authenticated()
                                .requestMatchers(HttpMethod.DELETE, "/post/{postId}").authenticated()

                                // Comment endpoints - authenticated users (logic check owner trong service)
                                .requestMatchers(HttpMethod.POST, "/comment/create").authenticated()
                                .requestMatchers(HttpMethod.PUT, "/comment/update").authenticated()
                                .requestMatchers(HttpMethod.DELETE, "/comment/delete").authenticated()

                                // Like endpoints - authenticated users
                                .requestMatchers(HttpMethod.POST, "/like/**").authenticated()

                                // Notification endpoints - authenticated users
                                .requestMatchers("/notifications/**").authenticated()

                                // Các request còn lại cần authenticated
                                .anyRequest().authenticated())
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList(
                "http://localhost:5173", 
                "http://localhost:3000",
                "https://*.vercel.app"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

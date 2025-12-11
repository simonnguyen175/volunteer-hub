package com.example.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsServiceImpl userDetailsService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        // DEBUG LOG 1
        System.out.println("---------- JWT FILTER START (" + request.getMethod() + ") ----------");
        System.out.println("URL: " + request.getRequestURI());

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println(">> Bỏ qua: Không có Header hoặc sai định dạng");
            filterChain.doFilter(request, response);
            return;
        }

        final String token = authHeader.substring(7);
        System.out.println(">> Token tìm thấy. Đang kiểm tra tính hợp lệ...");

        // Thêm Try-Catch cho đoạn validate để chắc chắn không bị lỗi ngầm
        try {
            if (!jwtService.isTokenValid(token)) {
                System.out.println(">> Token KHÔNG hợp lệ hoặc hết hạn!");
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                Map<String, Object> body = new HashMap<>();
                body.put("message", "Invalid or expired token");
                response.getWriter().write(objectMapper.writeValueAsString(body));
                return;
            }
        } catch (Exception e) {
            System.out.println(">> Lỗi khi validate token: " + e.getMessage());
            e.printStackTrace();
            // Cho phép request đi tiếp để ErrorHandler xử lý (hoặc return 401 tại đây)
            filterChain.doFilter(request, response);
            return;
        }

        String username = jwtService.extractUsername(token);
        System.out.println(">> Username extract được: " + username);

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            System.out.println(">> Đang load user từ DB...");
            try {
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                System.out.println(">> Load user thành công: " + userDetails.getUsername() + " | Authorities: " + userDetails.getAuthorities());

                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());

                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // QUAN TRỌNG: Set vào context
                SecurityContextHolder.getContext().setAuthentication(authToken);
                System.out.println(">> Đã set Authentication vào Context!");

            } catch (Exception e) {
                System.out.println(">> LỖI KHI LOAD USER: " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            System.out.println(">> Skip: Username null hoặc Context đã có Auth");
        }

        System.out.println("---------- JWT FILTER END -> CHAIN CONTINUE ----------");
        filterChain.doFilter(request, response);
    }
}
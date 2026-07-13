package com.desibites.controller;

import com.desibites.security.JwtUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class AuthController {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private com.desibites.repository.UserRepository userRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials, HttpServletResponse response) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        java.util.Optional<com.desibites.entity.User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isPresent() && passwordEncoder.matches(password, userOpt.get().getPassword())) {
            com.desibites.entity.User dbUser = userOpt.get();
            Long restaurantId = dbUser.getRestaurant() != null ? dbUser.getRestaurant().getId() : null;
            String token = jwtUtil.generateToken(email, dbUser.getRole(), restaurantId);

            Cookie cookie = new Cookie("token", token);
            cookie.setHttpOnly(true);
            cookie.setPath("/");
            cookie.setMaxAge(24 * 60 * 60); // 1 day
            response.addCookie(cookie);

            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            
            Map<String, String> user = new HashMap<>();
            user.put("email", email);
            user.put("role", dbUser.getRole());
            if (restaurantId != null) {
                user.put("restaurantId", restaurantId.toString());
            }
            resp.put("user", user);
            
            return ResponseEntity.ok(resp);
        }

        Map<String, Object> errorResp = new HashMap<>();
        errorResp.put("success", false);
        errorResp.put("message", "Invalid credentials");
        return ResponseEntity.status(401).body(errorResp);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        Cookie cookie = new Cookie("token", null);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);

        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/me")
    public ResponseEntity<?> me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            
            Map<String, String> user = new HashMap<>();
            user.put("email", auth.getName());
            // Extract role by removing ROLE_ prefix
            String role = auth.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "").toUpperCase();
            user.put("role", role);
            
            if (auth.getPrincipal() instanceof com.desibites.security.CustomUserDetails) {
                com.desibites.security.CustomUserDetails userDetails = (com.desibites.security.CustomUserDetails) auth.getPrincipal();
                if (userDetails.getRestaurantId() != null) {
                    user.put("restaurantId", userDetails.getRestaurantId().toString());
                }
            }
            
            resp.put("user", user);
            return ResponseEntity.ok(resp);
        }
        
        Map<String, Object> errorResp = new HashMap<>();
        errorResp.put("success", false);
        return ResponseEntity.status(401).body(errorResp);
    }
}

package com.desibites.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.Collection;
import java.util.List;

public class CustomUserDetails implements UserDetails {

    private String username;
    private Long restaurantId;
    private Collection<? extends GrantedAuthority> authorities;

    public CustomUserDetails(String username, Long restaurantId, Collection<? extends GrantedAuthority> authorities) {
        this.username = username;
        this.restaurantId = restaurantId;
        this.authorities = authorities;
    }

    public Long getRestaurantId() {
        return restaurantId;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return null;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return true; }
}

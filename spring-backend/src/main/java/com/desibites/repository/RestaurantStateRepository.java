package com.desibites.repository;

import com.desibites.entity.RestaurantState;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RestaurantStateRepository extends JpaRepository<RestaurantState, Long> {
    Optional<RestaurantState> findByRestaurantId(Long restaurantId);
}

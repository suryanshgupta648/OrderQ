package com.desibites.repository;

import com.desibites.entity.RestaurantState;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RestaurantStateRepository extends JpaRepository<RestaurantState, Long> {
}

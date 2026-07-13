package com.desibites.repository;

import com.desibites.entity.RestaurantOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<RestaurantOrder, String> {
    List<RestaurantOrder> findByRestaurantId(Long restaurantId);
}

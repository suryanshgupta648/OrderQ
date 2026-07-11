package com.desibites.repository;

import com.desibites.entity.RestaurantOrder;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<RestaurantOrder, String> {
}

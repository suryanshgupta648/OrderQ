package com.desibites.repository;

import com.desibites.entity.WaiterRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WaiterRequestRepository extends JpaRepository<WaiterRequest, String> {
    List<WaiterRequest> findByRestaurantId(Long restaurantId);
}

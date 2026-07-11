package com.desibites.repository;

import com.desibites.entity.WaiterRequest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WaiterRequestRepository extends JpaRepository<WaiterRequest, String> {
}

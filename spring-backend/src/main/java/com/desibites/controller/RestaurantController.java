package com.desibites.controller;

import com.desibites.entity.RestaurantOrder;
import com.desibites.entity.RestaurantState;
import com.desibites.entity.WaiterRequest;
import com.desibites.repository.OrderRepository;
import com.desibites.repository.RestaurantStateRepository;
import com.desibites.repository.WaiterRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class RestaurantController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private WaiterRequestRepository waiterRequestRepository;

    @Autowired
    private RestaurantStateRepository stateRepository;

    private RestaurantState getState() {
        return stateRepository.findById(1L).orElseGet(() -> {
            RestaurantState state = new RestaurantState();
            state.setId(1L);
            return stateRepository.save(state);
        });
    }

    // --- Orders ---
    @GetMapping("/orders")
    public List<RestaurantOrder> getOrders() {
        return orderRepository.findAll().stream().distinct().toList();
    }

    @PostMapping("/orders")
    public ResponseEntity<?> createOrder(@RequestBody RestaurantOrder order) {
        RestaurantOrder savedOrder = orderRepository.save(order);
        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("order", savedOrder);
        return ResponseEntity.ok(resp);
    }

    @PatchMapping("/orders/{id}")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<?> updateOrder(@PathVariable String id, @RequestBody Map<String, Object> updates) {
        Optional<RestaurantOrder> orderOpt = orderRepository.findById(id);
        if (orderOpt.isPresent()) {
            RestaurantOrder order = orderOpt.get();
            if (updates.containsKey("status")) {
                order.setStatus((String) updates.get("status"));
            }
            if (updates.containsKey("rejectReason")) {
                order.setRejectReason((String) updates.get("rejectReason"));
            }
            orderRepository.save(order);
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("order", order);
            return ResponseEntity.ok(resp);
        }
        return ResponseEntity.notFound().build();
    }

    // --- Kitchen Status ---
    @GetMapping("/kitchen-status")
    public Map<String, String> getKitchenStatus() {
        Map<String, String> resp = new HashMap<>();
        resp.put("status", getState().getKitchenStatus());
        return resp;
    }

    @PostMapping("/kitchen-status")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<?> updateKitchenStatus(@RequestBody Map<String, String> body) {
        RestaurantState state = getState();
        state.setKitchenStatus(body.get("status"));
        stateRepository.save(state);
        
        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("status", state.getKitchenStatus());
        return ResponseEntity.ok(resp);
    }

    // --- Menu Status ---
    @GetMapping("/menu-status")
    public Map<String, Object> getMenuStatus() {
        RestaurantState state = getState();
        Map<String, Object> resp = new HashMap<>();
        resp.put("disabledItems", state.getDisabledItems());
        resp.put("disabledCategories", state.getDisabledCategories());
        return resp;
    }

    @PostMapping("/menu-status/items")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<?> updateDisabledItems(@RequestBody Map<String, List<String>> body) {
        RestaurantState state = getState();
        state.setDisabledItems(body.get("items"));
        stateRepository.save(state);
        
        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("disabledItems", state.getDisabledItems());
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/menu-status/categories")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<?> updateDisabledCategories(@RequestBody Map<String, List<String>> body) {
        RestaurantState state = getState();
        state.setDisabledCategories(body.get("categories"));
        stateRepository.save(state);
        
        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("disabledCategories", state.getDisabledCategories());
        return ResponseEntity.ok(resp);
    }

    // --- Waiter Requests ---
    @GetMapping("/waiter-requests")
    public List<WaiterRequest> getWaiterRequests() {
        return waiterRequestRepository.findAll();
    }

    @PostMapping("/waiter-requests")
    public ResponseEntity<?> createWaiterRequest(@RequestBody WaiterRequest request) {
        WaiterRequest saved = waiterRequestRepository.save(request);
        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("request", saved);
        return ResponseEntity.ok(resp);
    }

    @PatchMapping("/waiter-requests/{id}")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<?> updateWaiterRequest(@PathVariable String id, @RequestBody Map<String, Object> updates) {
        Optional<WaiterRequest> reqOpt = waiterRequestRepository.findById(id);
        if (reqOpt.isPresent()) {
            WaiterRequest req = reqOpt.get();
            if (updates.containsKey("status")) {
                req.setStatus((String) updates.get("status"));
            }
            waiterRequestRepository.save(req);
            
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("request", req);
            return ResponseEntity.ok(resp);
        }
        return ResponseEntity.notFound().build();
    }
}

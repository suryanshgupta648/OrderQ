package com.desibites.controller;

import com.desibites.entity.RestaurantOrder;
import com.desibites.entity.RestaurantState;
import com.desibites.entity.WaiterRequest;
import com.desibites.entity.Restaurant;
import com.desibites.repository.OrderRepository;
import com.desibites.repository.RestaurantStateRepository;
import com.desibites.repository.WaiterRequestRepository;
import com.desibites.repository.RestaurantRepository;
import com.desibites.security.CustomUserDetails;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
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

    @Autowired
    private RestaurantRepository restaurantRepository;

    private Long getRestaurantId(String headerId) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails userDetails) {
            return userDetails.getRestaurantId();
        }
        if (headerId != null && !headerId.isEmpty()) {
            return Long.parseLong(headerId);
        }
        return 1L; // Fallback to seeded restaurant for demo
    }

    private Restaurant getRestaurant(Long id) {
        return restaurantRepository.findById(id).orElseGet(() -> {
            Restaurant r = new Restaurant();
            r.setId(id);
            return r;
        });
    }

    private RestaurantState getState(Long restaurantId) {
        return stateRepository.findByRestaurantId(restaurantId).orElseGet(() -> {
            RestaurantState state = new RestaurantState();
            state.setRestaurant(getRestaurant(restaurantId));
            return stateRepository.save(state);
        });
    }

    // --- Orders ---
    @GetMapping("/orders")
    public List<RestaurantOrder> getOrders(@RequestHeader(value = "X-Restaurant-Id", required = false) String headerId) {
        return orderRepository.findByRestaurantId(getRestaurantId(headerId)).stream().distinct().toList();
    }

    @PostMapping("/orders")
    public ResponseEntity<?> createOrder(@RequestHeader(value = "X-Restaurant-Id", required = false) String headerId, @RequestBody RestaurantOrder order) {
        Long restaurantId = getRestaurantId(headerId);
        order.setRestaurant(getRestaurant(restaurantId));
        RestaurantOrder savedOrder = orderRepository.save(order);
        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("order", savedOrder);
        return ResponseEntity.ok(resp);
    }

    @PatchMapping("/orders/{id}")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<?> updateOrder(@RequestHeader(value = "X-Restaurant-Id", required = false) String headerId, @PathVariable String id, @RequestBody Map<String, Object> updates) {
        Optional<RestaurantOrder> orderOpt = orderRepository.findById(id);
        if (orderOpt.isPresent()) {
            RestaurantOrder order = orderOpt.get();
            // Optional: verify order.getRestaurant().getId() == getRestaurantId(headerId)
            if (updates.containsKey("status")) {
                order.setStatus((String) updates.get("status"));
            }
            if (updates.containsKey("rejectReason")) {
                order.setRejectReason((String) updates.get("rejectReason"));
            }
            if (updates.containsKey("discount")) {
                order.setDiscount(((Number) updates.get("discount")).doubleValue());
            }
            if (updates.containsKey("tax")) {
                order.setTax(((Number) updates.get("tax")).doubleValue());
            }
            if (updates.containsKey("paymentMethod")) {
                order.setPaymentMethod((String) updates.get("paymentMethod"));
            }
            if (updates.containsKey("cashierName")) {
                order.setCashierName((String) updates.get("cashierName"));
            }
            if (updates.containsKey("invoiceNumber")) {
                order.setInvoiceNumber((String) updates.get("invoiceNumber"));
            }
            if (updates.containsKey("orderType")) {
                order.setOrderType((String) updates.get("orderType"));
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
    public Map<String, String> getKitchenStatus(@RequestHeader(value = "X-Restaurant-Id", required = false) String headerId) {
        Map<String, String> resp = new HashMap<>();
        resp.put("status", getState(getRestaurantId(headerId)).getKitchenStatus());
        return resp;
    }

    @PostMapping("/kitchen-status")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<?> updateKitchenStatus(@RequestHeader(value = "X-Restaurant-Id", required = false) String headerId, @RequestBody Map<String, String> body) {
        RestaurantState state = getState(getRestaurantId(headerId));
        state.setKitchenStatus(body.get("status"));
        stateRepository.save(state);
        
        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("status", state.getKitchenStatus());
        return ResponseEntity.ok(resp);
    }

    // --- Menu Status ---
    @GetMapping("/menu-status")
    public Map<String, Object> getMenuStatus(@RequestHeader(value = "X-Restaurant-Id", required = false) String headerId) {
        RestaurantState state = getState(getRestaurantId(headerId));
        Map<String, Object> resp = new HashMap<>();
        resp.put("disabledItems", state.getDisabledItems());
        resp.put("disabledCategories", state.getDisabledCategories());
        return resp;
    }

    @PostMapping("/menu-status/items")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<?> updateDisabledItems(@RequestHeader(value = "X-Restaurant-Id", required = false) String headerId, @RequestBody Map<String, List<String>> body) {
        RestaurantState state = getState(getRestaurantId(headerId));
        state.setDisabledItems(body.get("items"));
        stateRepository.save(state);
        
        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("disabledItems", state.getDisabledItems());
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/menu-status/categories")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<?> updateDisabledCategories(@RequestHeader(value = "X-Restaurant-Id", required = false) String headerId, @RequestBody Map<String, List<String>> body) {
        RestaurantState state = getState(getRestaurantId(headerId));
        state.setDisabledCategories(body.get("categories"));
        stateRepository.save(state);
        
        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("disabledCategories", state.getDisabledCategories());
        return ResponseEntity.ok(resp);
    }

    // --- Waiter Requests ---
    @GetMapping("/waiter-requests")
    public List<WaiterRequest> getWaiterRequests(@RequestHeader(value = "X-Restaurant-Id", required = false) String headerId) {
        return waiterRequestRepository.findByRestaurantId(getRestaurantId(headerId));
    }

    @PostMapping("/waiter-requests")
    public ResponseEntity<?> createWaiterRequest(@RequestHeader(value = "X-Restaurant-Id", required = false) String headerId, @RequestBody WaiterRequest request) {
        Long restaurantId = getRestaurantId(headerId);
        request.setRestaurant(getRestaurant(restaurantId));
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

package com.desibites.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "order_items")
@JsonIgnoreProperties(ignoreUnknown = true)
public class OrderItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long orderItemId;
    
    private String id;
    
    private String name;
    private String category;
    private Integer quantity;
    private Double price;
    
    @Embedded
    private SelectedSize selectedSize;

    // Getters and setters
    public Long getOrderItemId() { return orderItemId; }
    public void setOrderItemId(Long orderItemId) { this.orderItemId = orderItemId; }
    
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
    
    public SelectedSize getSelectedSize() { return selectedSize; }
    public void setSelectedSize(SelectedSize selectedSize) { this.selectedSize = selectedSize; }
}

package com.desibites.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@Entity
@Table(name = "restaurant_state")
@JsonIgnoreProperties(ignoreUnknown = true)
public class RestaurantState {
    
    @Id
    private Long id = 1L; // Singleton pattern essentially
    
    private String kitchenStatus = "LIVE";
    
    @ElementCollection(fetch = FetchType.EAGER)
    private List<String> disabledItems;
    
    @ElementCollection(fetch = FetchType.EAGER)
    private List<String> disabledCategories;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getKitchenStatus() { return kitchenStatus; }
    public void setKitchenStatus(String kitchenStatus) { this.kitchenStatus = kitchenStatus; }
    
    public List<String> getDisabledItems() { return disabledItems; }
    public void setDisabledItems(List<String> disabledItems) { this.disabledItems = disabledItems; }
    
    public List<String> getDisabledCategories() { return disabledCategories; }
    public void setDisabledCategories(List<String> disabledCategories) { this.disabledCategories = disabledCategories; }
}

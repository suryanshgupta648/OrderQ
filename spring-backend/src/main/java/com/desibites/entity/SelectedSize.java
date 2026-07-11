package com.desibites.entity;

import jakarta.persistence.Embeddable;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Embeddable
@JsonIgnoreProperties(ignoreUnknown = true)
public class SelectedSize {
    private String sizeName;
    private Double sizePrice;

    public String getName() { return sizeName; }
    public void setName(String name) { this.sizeName = name; }

    public Double getPrice() { return sizePrice; }
    public void setPrice(Double price) { this.sizePrice = price; }
}

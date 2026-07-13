package com.desibites.config;

import com.desibites.entity.User;
import com.desibites.entity.Restaurant;
import com.desibites.repository.UserRepository;
import com.desibites.repository.RestaurantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        Restaurant r1;
        if (restaurantRepository.count() == 0) {
            r1 = new Restaurant();
            r1.setName("Desi Bites Default Location");
            r1.setAddress("123 Street");
            r1.setPhone("1234567890");
            r1 = restaurantRepository.save(r1);
        } else {
            r1 = restaurantRepository.findAll().get(0);
        }

        if (userRepository.findByEmail("admin@desibites.com").isEmpty()) {
            User admin = new User();
            admin.setEmail("admin@desibites.com");
            admin.setPassword(passwordEncoder.encode("password123"));
            admin.setRole("MANAGER");
            admin.setRestaurant(r1);
            userRepository.save(admin);
            System.out.println("Seeded admin user");
        }

        if (userRepository.findByEmail("cashier@desibites.com").isEmpty()) {
            User cashier = new User();
            cashier.setEmail("cashier@desibites.com");
            cashier.setPassword(passwordEncoder.encode("password123"));
            cashier.setRole("CASHIER");
            cashier.setRestaurant(r1);
            userRepository.save(cashier);
            System.out.println("Seeded cashier user");
        }

        if (userRepository.findByEmail("kitchen@desibites.com").isEmpty()) {
            User kitchen = new User();
            kitchen.setEmail("kitchen@desibites.com");
            kitchen.setPassword(passwordEncoder.encode("password123"));
            kitchen.setRole("KITCHEN");
            kitchen.setRestaurant(r1);
            userRepository.save(kitchen);
            System.out.println("Seeded kitchen user");
        }
    }
}

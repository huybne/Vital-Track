package com.elderguard.backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;

import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void init() {
        try {
            // Sử dụng ClassLoader để lấy InputStream từ tài nguyên trong classpath
            InputStream serviceAccount = getClass().getClassLoader().getResourceAsStream("vitaltrack-92b70-firebase-adminsdk-zdri6-345634489c.json");

            if (serviceAccount == null) {
                throw new IllegalStateException("Service account key file not found in classpath.");
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
            }

            System.out.println("Firebase initialized.");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

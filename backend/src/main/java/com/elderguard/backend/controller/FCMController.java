package com.elderguard.backend.controller;

import com.elderguard.backend.dto.request.FCMTokenRequest;
import com.elderguard.backend.dto.response.ApiResponse;
import com.elderguard.backend.dto.response.UserFCMTokenResponse;
import com.elderguard.backend.service.UserFCMTokenService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;

@RestController
@RequestMapping("api/v1/health")
@RequiredArgsConstructor
public class FCMController {
    private static final Logger log = LoggerFactory.getLogger(UserController.class);

    private static final Logger logger = LoggerFactory.getLogger(FCMController.class);
    @Autowired
    private UserFCMTokenService fcmTokenService;

    @PostMapping("/request/{userId}")
    public ResponseEntity<ApiResponse<Void>> requestFCMToken(@PathVariable Long userId) {
        try {
            String requestType = "READ";  // Nội dung yêu cầu đọc dữ liệu
            boolean success = fcmTokenService.sendHealthRequest(userId, requestType);
            if (success) {
                return ResponseEntity.ok(
                        new ApiResponse<>("Health data request (READ) sent successfully.", new Date(), HttpStatus.OK, null)
                );
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse<>("User's FCM Token not found.", new Date(), HttpStatus.NOT_FOUND, null));
            }
        } catch (Exception e) {
            logger.error("Error sending health data request for userId: {}", userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>("Error sending health data request.", new Date(), HttpStatus.INTERNAL_SERVER_ERROR, null));
        }
    }
    @PostMapping("/stop/{userId}")
    public ResponseEntity<ApiResponse<Void>> stopFCMToken(@PathVariable Long userId) {
        try {
            String requestType = "STOP_READ";  // Nội dung yêu cầu ngừng đọc dữ liệu
            boolean success = fcmTokenService.sendHealthRequest(userId, requestType);
            if (success) {
                return ResponseEntity.ok(
                        new ApiResponse<>("Stop health data request (STOP_READ) sent successfully.", new Date(), HttpStatus.OK, null)
                );
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse<>("User's FCM Token not found.", new Date(), HttpStatus.NOT_FOUND, null));
            }
        } catch (Exception e) {
            logger.error("Error sending stop health data request for userId: {}", userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>("Error sending stop health data request.", new Date(), HttpStatus.INTERNAL_SERVER_ERROR, null));
        }
    }
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserFCMTokenResponse>> registerFCMToken(@RequestBody @Valid FCMTokenRequest request) {
        try {
               UserFCMTokenResponse response =  fcmTokenService.createFCMToken(request);
            return ResponseEntity.ok(new ApiResponse<>("FCM Token created successfully", new Date(), HttpStatus.CREATED, response));
        } catch (Exception e) {
            log.error("User creation failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>("FCM Token creation failed", new Date(), HttpStatus.INTERNAL_SERVER_ERROR, null));
        }
    }



    @GetMapping("/{userId}")
    public ResponseEntity<String> getFCMToken(@PathVariable Long userId) {
        try {
            String fcmToken = fcmTokenService.getFCMTokenByUserId(userId);
            return ResponseEntity.ok(fcmToken);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }


}

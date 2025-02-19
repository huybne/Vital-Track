package com.elderguard.backend.controller;

import com.elderguard.backend.dto.request.AlertData;
import com.elderguard.backend.dto.response.AllFollowersResponse;
import com.elderguard.backend.dto.response.ApiResponse;
import com.elderguard.backend.dto.response.UserResponseById;
import com.elderguard.backend.exceptions.UserNotFoundException;
import com.elderguard.backend.service.serviceIml.AlertServiceImpl;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/v1/alert")
@RequiredArgsConstructor

public class AlertController {
    private static final Logger log = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private AlertServiceImpl alertService;

    @PostMapping
    public ResponseEntity<String> handleFallAlert(@RequestBody AlertData request) {
        alertService.processAlert(request);
        return ResponseEntity.ok("Alert received and processed.");
    }

//    @GetMapping
//    public ResponseEntity<ApiResponse<UserResponseById>> getUser(@RequestBody AlertData request) {
//        try {
//            UserResponseById response = alertService.getUserByDeviceId(request);
//            return ResponseEntity.ok(new ApiResponse<>("User retrieved successfully", new Date(), HttpStatus.OK, response));
//        } catch (Exception e) {
//            log.error("Failed to retrieve user", e);
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(new ApiResponse<>("Failed to retrieve user", new Date(), HttpStatus.INTERNAL_SERVER_ERROR, null));
//        }
//    }

    @GetMapping
    public ResponseEntity<List<AllFollowersResponse>> getAllFollowers(@RequestBody AlertData request) {
        try {
            // Lấy danh sách followers của người dùng hiện tại
            List<AllFollowersResponse> followers = alertService.getAllFollowersOfCurrentUser(request);

            return ResponseEntity.ok(followers);
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

}

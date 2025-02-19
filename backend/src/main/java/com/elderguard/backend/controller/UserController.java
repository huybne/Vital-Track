package com.elderguard.backend.controller;

import com.elderguard.backend.dto.request.*;
import com.elderguard.backend.dto.response.*;
import com.elderguard.backend.exceptions.EmailAlreadyExistsException;
import com.elderguard.backend.exceptions.UserNotFoundException;
import com.elderguard.backend.exceptions.UsernameAlreadyExist;
import com.elderguard.backend.service.OtpTokenService;
import com.elderguard.backend.service.UserFollowService;
import com.elderguard.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {
    private static final Logger log = LoggerFactory.getLogger(UserController.class);
    private final UserService userService;
    private final OtpTokenService otpService;
    private final UserFollowService userFollowService;


    @PutMapping("/setCloseFriend")
    public ResponseEntity<ApiResponse<Void>> setCloseFriend(@RequestBody SetCloseFriendRequest request) {
        try {
            userService.setCloseFriend(request.getUsername());

            ApiResponse<Void> response = new ApiResponse<>("User set as close friend successfully", new Date(), HttpStatus.OK, null);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to set close friend", e);
            ApiResponse<Void> errorResponse = new ApiResponse<>(e.getMessage(), new Date(), HttpStatus.INTERNAL_SERVER_ERROR, null);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    @GetMapping("/followers")
    public ResponseEntity<List<AllFollowersResponse>> getAllFollowers() {
        try {
            // Lấy danh sách followers của người dùng hiện tại
            List<AllFollowersResponse> followers = userFollowService.getAllFollowersOfCurrentUser();

            return ResponseEntity.ok(followers);
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @DeleteMapping("/unfollow")
    public ResponseEntity<ApiResponse<Void>> deleteFollowed(@RequestParam String usernameToUnfollow) {
        try {
            userFollowService.deleteUserFollowed(usernameToUnfollow);
            return ResponseEntity.ok(new ApiResponse<>("Unfollowed successfully.", new Date(), HttpStatus.OK, null));
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>("User not found: " + e.getMessage(), new Date(), HttpStatus.NOT_FOUND, null));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>("Invalid request: " + e.getMessage(), new Date(), HttpStatus.BAD_REQUEST, null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>("An unexpected error occurred: " + e.getMessage(), new Date(), HttpStatus.INTERNAL_SERVER_ERROR, null));
        }
    }

    @PostMapping("/deny")
    public ResponseEntity<ApiResponse<Void>> denyFollow(@RequestBody AcceptRequest request) {
        try {
            // Gọi đến service để thực hiện từ chối yêu cầu follow
            userFollowService.denyFollowRequest(request);
            return ResponseEntity.ok(new ApiResponse<>(
                    "Follow request denied successfully.",
                    new Date(),
                    HttpStatus.OK,
                    null
            ));
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(
                            "User not found: " + e.getMessage(),
                            new Date(),
                            HttpStatus.NOT_FOUND,
                            null
                    ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(
                            "Invalid request: " + e.getMessage(),
                            new Date(),
                            HttpStatus.BAD_REQUEST,
                            null
                    ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(
                            "An unexpected error occurred: " + e.getMessage(),
                            new Date(),
                            HttpStatus.INTERNAL_SERVER_ERROR,
                            null
                    ));
        }
    }

    @PostMapping("/add")
    public ResponseEntity<ApiResponse<Void>> addFollow(@RequestBody FollowRequest request) {
        try {
            userFollowService.sendFollowRequest(request);
            return ResponseEntity.ok(new ApiResponse<>(
                    "Follow request sent successfully.",
                    new Date(),
                    HttpStatus.OK,
                    null
            ));
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(
                            "User not found: " + e.getMessage(),
                            new Date(),
                            HttpStatus.NOT_FOUND,
                            null
                    ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(
                            "Invalid request: " + e.getMessage(),
                            new Date(),
                            HttpStatus.BAD_REQUEST,
                            null
                    ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(
                            "An unexpected error occurred: " + e.getMessage(),
                            new Date(),
                            HttpStatus.INTERNAL_SERVER_ERROR,
                            null
                    ));
        }
    }


    @PostMapping("/accept")
    public ResponseEntity<ApiResponse<Void>> acceptFollow(@RequestBody AcceptRequest request) {
        try {
            userFollowService.acceptFollowRequest(request);
            return ResponseEntity.ok(new ApiResponse<>(
                    "Follow request accepted successfully.",
                    new Date(),
                    HttpStatus.OK,
                    null
            ));
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(
                            "User not found: " + e.getMessage(),
                            new Date(),
                            HttpStatus.NOT_FOUND,
                            null
                    ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(
                            "Invalid request: " + e.getMessage(),
                            new Date(),
                            HttpStatus.BAD_REQUEST,
                            null
                    ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(
                            "An unexpected error occurred: " + e.getMessage(),
                            new Date(),
                            HttpStatus.INTERNAL_SERVER_ERROR,
                            null
                    ));
        }
    }

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<AllFollowersResponse>>> getPendingFollowRequests() {
        try {
            List<AllFollowersResponse> pendingRequests = userFollowService.getPendingFollowRequestsForCurrentUser();
            return ResponseEntity.ok(new ApiResponse<>(
                    "Lấy danh sách yêu cầu follow thành công.",
                    new Date(),
                    HttpStatus.OK,
                    pendingRequests
            ));
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(
                            "Không tìm thấy người dùng: " + e.getMessage(),
                            new Date(),
                            HttpStatus.NOT_FOUND,
                            null
                    ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(
                            "Có lỗi xảy ra: " + e.getMessage(),
                            new Date(),
                            HttpStatus.INTERNAL_SERVER_ERROR,
                            null
                    ));
        }
    }


    @PutMapping("/grant-role")
    public ResponseEntity<ApiResponse<Void>> grantRole(@RequestBody GrantRoleRequest request) {
        try {
            userService.grantRole(request);
            return ResponseEntity.ok(new ApiResponse<>("Grant successfully.", new Date(), HttpStatus.OK, null));
        } catch (Exception e) {
            // Lấy thông báo lỗi từ exception
            String errorMessage = e.getMessage();

            // Log lỗi ra console để dễ dàng kiểm tra (tuỳ chọn)
            e.printStackTrace();

            // Trả về phản hồi API chứa chi tiết lỗi
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>("Failed to grant role: " + errorMessage, new Date(), HttpStatus.INTERNAL_SERVER_ERROR, null));
        }
    }

    @PostMapping("/request-otp")
    public ResponseEntity<ApiResponse<Void>> requestOtp(@RequestBody @Valid EmailToGetOtpRequest request){
        try {
            otpService.createOtp(request.getEmail());
            return ResponseEntity.ok(new ApiResponse<>("OTP has been sent to your email.", new Date(), HttpStatus.OK, null));
        }catch (Exception e) {
            log.error("Failed to send OTP", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>("Failed to send OTP", new Date(), HttpStatus.INTERNAL_SERVER_ERROR, null));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Void>> verifyOtp(@RequestBody @Valid VerifyOtp request) {
        try {
            otpService.validateOtp(request.getEmail(), request.getOtpCode());
            return ResponseEntity.ok(new ApiResponse<>("OTP verified successfully", new Date(), HttpStatus.OK, null));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(e.getMessage(), new Date(), HttpStatus.BAD_REQUEST, null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>("An unexpected error occurred: " + e.getMessage(), new Date(), HttpStatus.INTERNAL_SERVER_ERROR, null));
        }
    }
    @PutMapping("/device")
    public ResponseEntity<ApiResponse<Void>> setDeviceId(@RequestBody @Valid ConnectDevice request) {
        try {
            userService.setDeviceId(request);
            return ResponseEntity.ok(new ApiResponse<>(
                    "Device ID set successfully and DEVICE_ACTIVE role added (if not already present).",
                    new Date(),
                    HttpStatus.OK,
                    null
            ));
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(
                            "User not found: " + e.getMessage(),
                            new Date(),
                            HttpStatus.NOT_FOUND,
                            null
                    ));
        } catch (Exception e) {
            log.error("Failed to set device ID", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(
                            "Failed to set device ID: " + e.getMessage(),
                            new Date(),
                            HttpStatus.INTERNAL_SERVER_ERROR,
                            null
                    ));
        }
    }
    @DeleteMapping("/device/{id}")
    public ResponseEntity<ApiResponse<Void>> removeDeviceId(@PathVariable @Valid Long id) {
        try {
            userService.removeDeviceId(id);
            return ResponseEntity.ok(new ApiResponse<>(
                    "Device ID removed ",
                    new Date(),
                    HttpStatus.OK,
                    null
            ));
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(
                            "User not found: " + e.getMessage(),
                            new Date(),
                            HttpStatus.NOT_FOUND,
                            null
                    ));
        } catch (Exception e) {
            log.error("Failed to remove device ID", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(
                            "Failed to remove device ID: " + e.getMessage(),
                            new Date(),
                            HttpStatus.INTERNAL_SERVER_ERROR,
                            null
                    ));
        }
    }

    @DeleteMapping("/{Id}")
    public void deleteUser(@PathVariable("Id") Long id) {
        userService.deleteUser(id);
    }

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(@RequestBody @Valid VerifyOtpAndCreateUserRequest request) {
        try {
            UserResponse response = userService.createUser(request);
            return ResponseEntity.ok(new ApiResponse<>("User created successfully", new Date(), HttpStatus.CREATED, response));
        } catch (Exception e) {
            log.error("User creation failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>("User creation failed", new Date(), HttpStatus.INTERNAL_SERVER_ERROR, null));
        }
    }
     // lấy thông tin 1 người theo dõi
//    @GetMapping("/your-followed")
//    public ResponseEntity<ApiResponse<UserResponseById>> getUsers() {
//        try {
//            Long id = userFollowService.getFollowedUserIdForCurrentUser();
//            UserResponseById response = userService.getUser(id);
//            return ResponseEntity.ok(new ApiResponse<>("User retrieved successfully", new Date(), HttpStatus.OK, response));
//        }
//        catch (Exception e) {
//            log.error("Failed to retrieve user", e);
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(new ApiResponse<>("Failed to retrieve user", new Date(), HttpStatus.INTERNAL_SERVER_ERROR, null));
//        }
//    }

    @GetMapping("/device-active")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsersWithDeviceActiveRole() {
        try {
            List<UserResponse> users = userService.getAllUserRoleDeviceActive();
            return ResponseEntity.ok(
                    new ApiResponse<>("Device Active users retrieved successfully", new Date(), HttpStatus.OK, users)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>("Failed to retrieve users", new Date(), HttpStatus.INTERNAL_SERVER_ERROR, null));
        }
    }
     @GetMapping("/all-followed")
     public ResponseEntity<ApiResponse<List<UserResponse>>> getAllFollowedUsers() {
         try {
             List<UserResponse> followedUsers = userFollowService.getAllFollowedUsers();
             return ResponseEntity.ok(
                     new ApiResponse<>("Followed users retrieved successfully", new Date(), HttpStatus.OK, followedUsers)
             );
         } catch (Exception e) {
             log.error("Failed to retrieve followed users", e);
             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                     .body(new ApiResponse<>("Failed to retrieve followed users", new Date(), HttpStatus.INTERNAL_SERVER_ERROR, null));
         }
     }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponseById>> getUser(@PathVariable Long id) {
        try {
            UserResponseById response = userService.getUser(id);
            return ResponseEntity.ok(new ApiResponse<>("User retrieved successfully", new Date(), HttpStatus.OK, response));
        } catch (Exception e) {
            log.error("Failed to retrieve user", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>("Failed to retrieve user", new Date(), HttpStatus.INTERNAL_SERVER_ERROR, null));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        try {
            List<UserResponse> response = userService.getAllUsers();
            return ResponseEntity.ok(new ApiResponse<>("Users retrieved successfully", new Date(), HttpStatus.OK, response));
        } catch (Exception e) {
            log.error("Failed to retrieve users", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>("Failed to retrieve users", new Date(), HttpStatus.INTERNAL_SERVER_ERROR, null));
        }
    }

    @GetMapping("/myInfo")
    public ResponseEntity<ApiResponse<MyProfile>> getMyInfo() {
        try {
            MyProfile    response = userService.getMyInfo();
            return ResponseEntity.ok(new ApiResponse<>("User information retrieved successfully", new Date(), HttpStatus.OK, response));
        } catch (Exception e) {
            log.error("Failed to retrieve user information", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>("Failed to retrieve user information", new Date(), HttpStatus.INTERNAL_SERVER_ERROR, null));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(@PathVariable Long id, @RequestBody @Valid UserUpdateRequest request) {
        try {
            UserResponse response = userService.updateUser(id, request);
            return ResponseEntity.ok(new ApiResponse<>("User updated successfully", new Date(), HttpStatus.OK, response));
        } catch (Exception e) {
            log.error("Failed to update user", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>("Failed to update user", new Date(), HttpStatus.INTERNAL_SERVER_ERROR, null));
        }
    }

    @PutMapping("/{id}/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(@PathVariable Long id, @RequestBody @Valid ChangePasswordRequest request) {
        try {
            userService.changePassword(id, request);
            return ResponseEntity.ok(new ApiResponse<>("Password changed successfully", new Date(), HttpStatus.OK, null));
        } catch (Exception e) {
            log.error("Failed to change password", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>("Failed to change password", new Date(), HttpStatus.INTERNAL_SERVER_ERROR, null));
        }
    }

    @PostMapping("/{userId}/avatar")
    public ResponseEntity<ApiResponse<Void>> saveAvatar(
            @PathVariable Long userId,
            @RequestParam("file") MultipartFile file) {
        try {
            userService.saveAvatar(userId, file);
            ApiResponse<Void> response = new ApiResponse<>("Avatar uploaded successfully", new Date(), HttpStatus.OK, null);
            return ResponseEntity.ok(response);
        }
        catch (Exception e) {
            log.error("Failed to save avatar", e);
            ApiResponse<Void> errorResponse = new ApiResponse<>(e.getMessage(), new Date(), HttpStatus.INTERNAL_SERVER_ERROR, null);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }

    }


    @GetMapping("/avatar")
    public ResponseEntity<ApiResponse<AvatarResponse>> getAvatar() {
        try {
            String avatarBase64 = userService.getAvatarBase64();
            AvatarResponse response = AvatarResponse.builder().avatar(avatarBase64).build();
            ApiResponse<AvatarResponse> apiResponse = new ApiResponse<>("Avatar retrieved successfully", new Date(), HttpStatus.OK, response);
            return ResponseEntity.ok(apiResponse);
        } catch (Exception e) {
            log.error("Failed to retrieve avatar", e);
            ApiResponse<AvatarResponse> errorResponse = new ApiResponse<>(e.getMessage(), new Date(), HttpStatus.INTERNAL_SERVER_ERROR, null);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }



}

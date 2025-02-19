package com.elderguard.backend.service;

import com.elderguard.backend.dto.request.*;
import com.elderguard.backend.dto.response.MyProfile;
import com.elderguard.backend.dto.response.UserResponse;
import com.elderguard.backend.dto.response.UserResponseById;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface UserService {
    @Transactional
    List<UserResponse> getAllUserRoleDeviceActive();

    UserResponse createUser(VerifyOtpAndCreateUserRequest request);

    //UserResponse createUserWithOtpValidation(VerifyOtpAndCreateUserRequest request);

    void deleteUser(Long id);

    UserResponse updateUser(Long id, UserUpdateRequest request);

    void setDeviceId(ConnectDevice request);

    void removeDeviceId(Long userId);

    void changePassword(Long id, ChangePasswordRequest request);

    UserResponseById getUser(Long id);

    List<UserResponse> getAllUsers();

    MyProfile getMyInfo();


    void saveAvatar(Long id, MultipartFile file);

    String getAvatarBase64();

    void grantRole(GrantRoleRequest request);

    @Transactional
    void setCloseFriend(String usernameToFollow);
}

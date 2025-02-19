package com.elderguard.backend.service;

import com.elderguard.backend.dto.request.AcceptRequest;
import com.elderguard.backend.dto.request.FollowRequest;
import com.elderguard.backend.dto.response.AllFollowersResponse;
import com.elderguard.backend.dto.response.UserResponse;
import com.elderguard.backend.model.user.User;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface UserFollowService {
    // Phương thức để người dùng với ROLE DEVICE_ACTIVE thêm người dùng khác vào nhóm của mình
    //void addFollowerToDeviceActiveUser(String usernameToFollow);


    @Transactional
    void sendFollowRequest(FollowRequest followRequestDto);

    @Transactional
    void acceptFollowRequest(AcceptRequest acceptFollowRequestDto);

    @Transactional
    void denyFollowRequest(AcceptRequest request);

    @Transactional(readOnly = true)
    List<AllFollowersResponse> getAllFollowersOfCurrentUser();

    @Transactional
    void deleteUserFollowed(String usernameToUnfollow);

    @Transactional(readOnly = true)
    List<AllFollowersResponse> getPendingFollowRequestsForCurrentUser();

//    @Transactional(readOnly = true)
//    Long getFollowedUserIdForCurrentUser();

    @Transactional(readOnly = true)
    List<UserResponse> getAllFollowedUsers();
}

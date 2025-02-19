package com.elderguard.backend.service.serviceIml;

import com.elderguard.backend.dto.request.AcceptRequest;
import com.elderguard.backend.dto.request.FollowRequest;
import com.elderguard.backend.dto.response.AllFollowersResponse;
import com.elderguard.backend.dto.response.UserResponse;
import com.elderguard.backend.exceptions.UserNotFoundException;
import com.elderguard.backend.mapper.UserMapper;
import com.elderguard.backend.model.user.FollowStatus;
import com.elderguard.backend.model.user.Role;
import com.elderguard.backend.model.user.User;
import com.elderguard.backend.model.user.UserFollow;
import com.elderguard.backend.repositories.UserFollowRepository;
import com.elderguard.backend.repositories.UserRepository;
import com.elderguard.backend.service.UserFollowService;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserFollowServiceImpl implements UserFollowService {
    private final UserRepository userRepository;
    private final UserFollowRepository userFollowRepository;
    private final UserMapper userMapper;
    public UserFollowServiceImpl(UserRepository userRepository, UserFollowRepository userFollowRepository, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.userFollowRepository = userFollowRepository;
        this.userMapper = userMapper;
    }



    @Override
    @Transactional
    public void sendFollowRequest(FollowRequest followRequestDto) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new UserNotFoundException("Current user not found"));

        if (currentUser.getRoles().contains(Role.DEVICE_ACTIVE)) {
            throw new RuntimeException("Users with DEVICE_ACTIVE role cannot send follow requests");
        }

        User userToFollow = userRepository.findByUsername(followRequestDto.getUsernameToFollow())
                .orElseThrow(() -> new UserNotFoundException("User to follow not found"));

        if (!userToFollow.getRoles().contains(Role.DEVICE_ACTIVE)) {
            throw new RuntimeException("Only users with DEVICE_ACTIVE role can be followed");
        }

        if (userFollowRepository.existsByFollowerAndFollowed(currentUser, userToFollow)) {
            throw new RuntimeException("Follow request already exists");
        }

        UserFollow userFollow = new UserFollow();
        userFollow.setFollower(currentUser);
        userFollow.setFollowed(userToFollow);
        userFollow.setStatus(FollowStatus.PENDING);

        userFollowRepository.save(userFollow);
    }

    @Override
    @Transactional
    public void acceptFollowRequest(AcceptRequest acceptFollowRequestDto) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new UserNotFoundException("Current user not found"));

        if (!currentUser.getRoles().contains(Role.DEVICE_ACTIVE)) {
            throw new RuntimeException("Only users with DEVICE_ACTIVE role can accept follow requests");
        }

        User userFollower = userRepository.findByUsername(acceptFollowRequestDto.getUsernameFollower())
                .orElseThrow(() -> new UserNotFoundException("Follower not found"));

        UserFollow followRequest = userFollowRepository.findByFollowerAndFollowed(userFollower, currentUser)
                .orElseThrow(() -> new RuntimeException("Follow request not found"));

        if (!followRequest.getStatus().equals(FollowStatus.PENDING)) {
            throw new RuntimeException("Follow request is not in PENDING status");
        }

        followRequest.setStatus(FollowStatus.ACCEPTED);
        userFollowRepository.save(followRequest);

        // Update roles if needed
        HashSet<Role> roles = new HashSet<>(userFollower.getRoles());
        roles.add(Role.RELATIVE);
        userFollower.setRoles(roles);

        userRepository.save(userFollower);
    }
    @Override
    @Transactional
    public void denyFollowRequest(AcceptRequest request) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new UserNotFoundException("Current user not found"));

        if (!currentUser.getRoles().contains(Role.DEVICE_ACTIVE)) {
            throw new RuntimeException("Only users with DEVICE_ACTIVE role can deny follow requests");
        }

        User userFollower = userRepository.findByUsername(request.getUsernameFollower())
                .orElseThrow(() -> new UserNotFoundException("Follower not found"));

        UserFollow followRequest = userFollowRepository.findByFollowerAndFollowed(userFollower, currentUser)
                .orElseThrow(() -> new RuntimeException("Follow request not found"));

        if (!followRequest.getStatus().equals(FollowStatus.PENDING)) {
            throw new RuntimeException("Follow request is not in PENDING status");
        }

        // Xóa bản ghi trong bảng quan hệ follow
        userFollowRepository.delete(followRequest);
    }


    @Override
    @Transactional(readOnly = true)
    public List<AllFollowersResponse> getAllFollowersOfCurrentUser() {
        // Lấy thông tin người dùng hiện tại từ SecurityContext
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new UserNotFoundException("Current user not found"));

        // Lấy danh sách những người theo dõi (followers) với trạng thái ACCEPTED
        List<UserFollow> acceptedFollowers = userFollowRepository.findByFollowedAndStatusOrderByFollowerUsernameAsc(currentUser, FollowStatus.ACCEPTED);

        // Chuyển đổi danh sách User thành AllFollowersResponse
        return acceptedFollowers.stream()
                .map(userFollow -> userMapper.toAllFollowersResponse(userFollow.getFollower()))  // Map User sang AllFollowersResponse
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteUserFollowed(String usernameToUnfollow) {
        // Lấy thông tin người dùng hiện tại từ SecurityContext
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new UserNotFoundException("Current user not found"));

        // Lấy thông tin người dùng cần unfollow
        User userToUnfollow = userRepository.findByUsername(usernameToUnfollow)
                .orElseThrow(() -> new UserNotFoundException("User to unfollow not found"));

        // Tìm quan hệ follow có trạng thái ACCEPTED trong cả hai chiều
        UserFollow userFollow = userFollowRepository.findByFollowedAndFollowerAndStatus(currentUser, userToUnfollow, FollowStatus.ACCEPTED)
                .or(() -> userFollowRepository.findByFollowedAndFollowerAndStatus(userToUnfollow, currentUser, FollowStatus.ACCEPTED))
                .orElseThrow(() -> new RuntimeException("Follow relationship not found"));

        // Nếu người dùng hiện tại có closeFriend là người cần unfollow, xóa quan hệ closeFriend
        if(currentUser.getRoles().contains(Role.DEVICE_ACTIVE)) {
        if (currentUser.getCloseFriend() != null && currentUser.getCloseFriend().getId().equals(userToUnfollow.getId())) {
            currentUser.setCloseFriend(null); // Xóa liên kết từ phía currentUser
            userRepository.save(currentUser); // Lưu thay đổi vào database
        }
        }



        // Xóa quan hệ follow
        userFollowRepository.delete(userFollow);
    }


    @Override
    @Transactional(readOnly = true)
    public List<AllFollowersResponse> getPendingFollowRequestsForCurrentUser() {
        // Lấy người dùng hiện tại từ SecurityContext
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new UserNotFoundException("Không tìm thấy người dùng hiện tại"));

        // Lấy danh sách các yêu cầu follow với trạng thái PENDING
        List<UserFollow> pendingRequests = userFollowRepository.findByFollowedAndStatusOrderByFollowerUsernameAsc(currentUser, FollowStatus.PENDING);

        // Chuyển đổi danh sách UserFollow thành DTO để trả về
        return pendingRequests.stream()
                .map(userFollow -> userMapper.toAllFollowersResponse(userFollow.getFollower()))  // Map User sang DTO
                .collect(Collectors.toList());
    }


//    @Override
//    @Transactional(readOnly = true)
//    public Long getFollowedUserIdForCurrentUser() {
//        // Get the current username from the SecurityContext
//        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
//        User currentUser = userRepository.findByUsername(currentUsername)
//                .orElseThrow(() -> new UserNotFoundException("Current user not found"));
//
//        // Find the follow relationship where the current user is the follower
//        UserFollow follow = userFollowRepository.findByFollower(currentUser)
//                .orElseThrow(() -> new RuntimeException("You are not following anyone"));
//
//        // Return the ID of the user being followed
//        return follow.getFollowed().getId();
//    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllFollowedUsers() {
        // Lấy thông tin người dùng hiện tại từ SecurityContext
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new UserNotFoundException("Current user not found"));

        // Lấy danh sách "đang theo dõi" với trạng thái ACCEPTED
        List<UserFollow> acceptedFollows = userFollowRepository.findByFollowerAndStatus(currentUser, FollowStatus.ACCEPTED);

        // Chuyển đổi danh sách UserFollow thành UserResponse
        return acceptedFollows.stream()
                .map(follow -> userMapper.toUserResponse(follow.getFollowed())) // Chuyển User thành UserResponse
                .collect(Collectors.toList());
    }

}

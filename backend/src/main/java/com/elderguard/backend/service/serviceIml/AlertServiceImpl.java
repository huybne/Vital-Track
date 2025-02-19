package com.elderguard.backend.service.serviceIml;

import com.elderguard.backend.dto.request.AlertData;
import com.elderguard.backend.dto.response.AllFollowersResponse;
import com.elderguard.backend.exceptions.UserNotFoundException;
import com.elderguard.backend.mapper.UserMapper;
import com.elderguard.backend.model.user.FollowStatus;
import com.elderguard.backend.model.user.User;
import com.elderguard.backend.model.user.UserFollow;
import com.elderguard.backend.repositories.UserFollowRepository;
import com.elderguard.backend.repositories.UserRepository;
import com.elderguard.backend.service.AlertService;
import com.elderguard.backend.service.EmailService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AlertServiceImpl implements AlertService {
    final
    UserRepository userRepository;
    final
    UserFollowRepository userFollowRepository;
    final
    EmailService emailService;
    final
    UserMapper userMapper;

    public AlertServiceImpl(UserRepository userRepository, UserFollowRepository userFollowRepository, EmailService emailService, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.userFollowRepository = userFollowRepository;
        this.emailService = emailService;
        this.userMapper = userMapper;
    }

    @Override
    @Transactional
    public void processAlert(AlertData request) {
        User user = userRepository.findByDeviceId(request.getDeviceId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Long id = user.getId();
        User currentUser = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Current user not found"));

        // Lấy danh sách những người theo dõi (followers) với trạng thái ACCEPTED
        List<UserFollow> followers = userFollowRepository.findByFollowedAndStatusOrderByFollowerUsernameAsc(currentUser, FollowStatus.ACCEPTED);

        for (UserFollow userFollow : followers) {
            User follower = userFollow.getFollower();
            if (follower.getEmail() != null) {
                emailService.sendAlertEmail(follower.getEmail(), follower.getFullName(), user.getFullName());
            }
        }

    }


    @Override
    @Transactional
    public List<AllFollowersResponse> getAllFollowersOfCurrentUser(AlertData request) {
        User user = userRepository.findByDeviceId(request.getDeviceId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Long id = user.getId();
        User currentUser = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Current user not found"));

        // Lấy danh sách những người theo dõi (followers) với trạng thái ACCEPTED
        List<UserFollow> acceptedFollowers = userFollowRepository.findByFollowedAndStatusOrderByFollowerUsernameAsc(currentUser, FollowStatus.ACCEPTED);

        // Chuyển đổi danh sách User thành AllFollowersResponse
        return acceptedFollowers.stream()
                .map(userFollow -> userMapper.toAllFollowersResponse(userFollow.getFollower()))  // Map User sang AllFollowersResponse
                .collect(Collectors.toList());
    }

}

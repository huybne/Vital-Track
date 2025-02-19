package com.elderguard.backend.service.serviceIml;

import com.elderguard.backend.dto.request.FCMTokenRequest;
import com.elderguard.backend.dto.response.UserFCMTokenResponse;
import com.elderguard.backend.mapper.FCMTokenMapper;
import com.elderguard.backend.model.token.UserFCMToken;
import com.elderguard.backend.repositories.UserFCMTokenRepository;
import com.elderguard.backend.repositories.UserRepository;
import com.elderguard.backend.service.UserFCMTokenService;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class UserFCMTokenServiceImpl implements UserFCMTokenService {
    private final UserFCMTokenRepository userFCMTokenRepository;
    private final FCMTokenMapper mapper;
    private static final Logger log = LoggerFactory.getLogger(UserFCMTokenServiceImpl.class);

    public UserFCMTokenServiceImpl(UserRepository userRepository, UserFCMTokenRepository userFCMTokenRepository, FCMTokenMapper mapper) {
        this.userFCMTokenRepository = userFCMTokenRepository;
        this.mapper = mapper;
    }

    @Override
    public boolean sendHealthRequest(Long userId, String requestType) {
        try {
            Optional<UserFCMToken> userFCMToken = userFCMTokenRepository.findByUserId(userId);
            if (userFCMToken.isEmpty() || userFCMToken.get().getFcmToken() == null) {
                return false;
            }

            // Gửi thông điệp với nội dung có thể thay đổi từ controller
            Message message = Message.builder()
                    .putData("requestType", requestType)  // Controller sẽ truyền giá trị cho requestType
                    .putData("userId", String.valueOf(userId))
                    .setToken(userFCMToken.get().getFcmToken())
                    .build();
            FirebaseMessaging.getInstance().send(message);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    @Override
    public UserFCMTokenResponse createFCMToken(FCMTokenRequest request) {
        Long userId = request.getUserId();
        String fcmToken = request.getFcmToken();
        Optional<UserFCMToken> existingToken = userFCMTokenRepository.findByUserId(userId);

        if (existingToken.isPresent()) {
            UserFCMToken token = existingToken.get();
            if (!token.getFcmToken().equals(fcmToken)) {
                log.info("Updating FCM Token for userId: {}. Old Token: {}, New Token: {}", userId, token.getFcmToken(), fcmToken);
                token.setFcmToken(fcmToken);
                token.setUpdatedAt(LocalDateTime.now());
                userFCMTokenRepository.save(token);
            } else {
                log.info("FCM Token for userId: {} is already up-to-date. No changes required.", userId);
            }
            return mapper.toUserFCMTokenResponse(token);
        } else {
            log.info("Creating new FCM Token for userId: {}.", userId);
            UserFCMToken newToken = UserFCMToken.builder()
                    .userId(userId)
                    .fcmToken(fcmToken)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            userFCMTokenRepository.save(newToken);
            return mapper.toUserFCMTokenResponse(newToken);
        }
    }




    @Override
    public UserFCMTokenResponse getFCMToken(Long userId) {
        return userFCMTokenRepository.findByUserId(userId)
                .map(mapper::toUserFCMTokenResponse) // Sử dụng mapper để ánh xạ
                .orElseThrow(() -> new IllegalArgumentException("User ID not found: " + userId));
    }
    @Override
    public String getFCMTokenByUserId(Long userId) {
        return userFCMTokenRepository.findByUserId(userId)
                .map(UserFCMToken::getFcmToken)
                .orElseThrow(() -> new IllegalArgumentException("User ID not found: " + userId));
    }


}

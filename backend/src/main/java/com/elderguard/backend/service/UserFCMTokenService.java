package com.elderguard.backend.service;

import com.elderguard.backend.dto.request.FCMTokenRequest;
import com.elderguard.backend.dto.response.UserFCMTokenResponse;

public interface UserFCMTokenService {
    boolean sendHealthRequest(Long userId, String requestType);


    UserFCMTokenResponse createFCMToken(FCMTokenRequest request);

    UserFCMTokenResponse getFCMToken(Long userId);

    String getFCMTokenByUserId(Long userId);
}

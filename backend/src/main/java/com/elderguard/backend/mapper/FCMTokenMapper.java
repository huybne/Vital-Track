package com.elderguard.backend.mapper;

import com.elderguard.backend.dto.request.FCMTokenRequest;
import com.elderguard.backend.dto.response.UserFCMTokenResponse;
import com.elderguard.backend.model.token.UserFCMToken;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface FCMTokenMapper {

    @Mapping(source = "userId", target = "userId")
    @Mapping(source = "fcmToken", target = "fcmToken") // ánh xạ chính xác
    UserFCMToken toUserFCMToken(FCMTokenRequest request);

    @Mapping(source = "id", target = "id")
    @Mapping(source = "userId", target = "userId")
    @Mapping(source = "fcmToken", target = "fcmToken")
    UserFCMTokenResponse toUserFCMTokenResponse(UserFCMToken userFCMToken);
}

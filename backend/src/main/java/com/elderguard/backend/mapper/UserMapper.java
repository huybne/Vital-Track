package com.elderguard.backend.mapper;

import com.elderguard.backend.dto.request.UserCreationRequest;
import com.elderguard.backend.dto.request.VerifyOtpAndCreateUserRequest;
import com.elderguard.backend.dto.response.AllFollowersResponse;
import com.elderguard.backend.dto.response.MyProfile;
import com.elderguard.backend.dto.response.UserResponse;
import com.elderguard.backend.dto.response.UserResponseById;
import com.elderguard.backend.model.user.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;

@Mapper(componentModel = "spring")
public interface UserMapper {
    User toUser(VerifyOtpAndCreateUserRequest request);

    UserResponse toUserResponse(User user);
    @Mappings({
            @Mapping(source = "closeFriend.id", target = "closeFriendId")
    })
    MyProfile toMyProfile(User user);

    AllFollowersResponse toAllFollowersResponse(User user);
    UserResponseById toUserResponseById(User user);
}

package com.elderguard.backend.dto.response;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.*;
import lombok.experimental.FieldNameConstants;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldNameConstants(level = AccessLevel.PRIVATE)
public class UserFCMTokenResponse {
    Long id;
    Long userId;;
    String fcmToken;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;

}

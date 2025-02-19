package com.elderguard.backend.dto.request;

import lombok.*;
import lombok.experimental.FieldNameConstants;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants(level = AccessLevel.PRIVATE)
public class ChangePasswordRequest {
    String oldPassword;
    String newPassword;
}

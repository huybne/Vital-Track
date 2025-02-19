package com.elderguard.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VerifyOtpAndCreateUserRequest {
    private String fullName;

    private String username;
    private String email;
    private String password;
}

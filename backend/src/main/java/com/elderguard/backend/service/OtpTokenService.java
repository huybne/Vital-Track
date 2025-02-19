package com.elderguard.backend.service;

import com.elderguard.backend.model.user.OtpToken;

import java.util.Optional;

public interface OtpTokenService {
    OtpToken createOtp(String email);

    boolean validateOtp(String email, String otpCode);


}

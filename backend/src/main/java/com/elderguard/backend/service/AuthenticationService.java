package com.elderguard.backend.service;

import com.elderguard.backend.dto.request.AuthenticationRequest;
import com.elderguard.backend.dto.request.LogoutRequest;
import com.elderguard.backend.dto.request.RefreshRequest;
import com.elderguard.backend.dto.request.VerifyRequest;
import com.elderguard.backend.dto.response.AuthenticationResponse;
import com.elderguard.backend.dto.response.VerifyResponse;
import com.elderguard.backend.model.user.User;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jwt.SignedJWT;

import java.text.ParseException;

public interface AuthenticationService {
    AuthenticationResponse authenticate(AuthenticationRequest request);

    void logout(LogoutRequest request) throws ParseException, JOSEException;

    String generateToken(User user);


    AuthenticationResponse outboundAuthenticate(String code);

    VerifyResponse verify(VerifyRequest request) throws JOSEException, ParseException;


    SignedJWT verifyToken(String token, boolean isRefresh) throws ParseException, JOSEException;

    AuthenticationResponse refreshToken(RefreshRequest request) throws ParseException, JOSEException;
}

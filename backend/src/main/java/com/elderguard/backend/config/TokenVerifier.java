package com.elderguard.backend.config;

import com.nimbusds.jose.JOSEException;

import java.text.ParseException;

public interface TokenVerifier {
    boolean verifyToken(String token) throws ParseException, JOSEException;

}

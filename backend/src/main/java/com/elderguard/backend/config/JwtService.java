package com.elderguard.backend.config;

import com.nimbusds.jose.JOSEException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.text.ParseException;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {
    private final TokenVerifier tokenVerifier;

    @Autowired
    public JwtService(TokenVerifier tokenVerifier) {
        this.tokenVerifier = tokenVerifier;
    }

    public boolean verifyToken(String token) throws JOSEException, ParseException {
        return tokenVerifier.verifyToken(token);
    }
}

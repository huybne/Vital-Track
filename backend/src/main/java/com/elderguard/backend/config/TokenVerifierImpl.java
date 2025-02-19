package com.elderguard.backend.config;

import com.elderguard.backend.repositories.InvalidatedTokenRepository;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.util.Date;

@Service
public class TokenVerifierImpl implements TokenVerifier {

    private final InvalidatedTokenRepository invalidatedTokenRepository;

    public TokenVerifierImpl(InvalidatedTokenRepository invalidatedTokenRepository) {
        this.invalidatedTokenRepository = invalidatedTokenRepository;
    }

    @Override
    public boolean verifyToken(String token) throws JOSEException, ParseException {
        SignedJWT signedJWT = SignedJWT.parse(token);
        Date expiration = signedJWT.getJWTClaimsSet().getExpirationTime();

        // Kiểm tra token có bị vô hiệu hóa không
        if (invalidatedTokenRepository.existsById(signedJWT.getJWTClaimsSet().getJWTID())) {
            return false;
        }

        // Kiểm tra token có hết hạn không
        return expiration.after(new Date());
    }

}

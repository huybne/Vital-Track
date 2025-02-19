package com.elderguard.backend.repositories;

import com.elderguard.backend.model.user.OtpToken;
import com.elderguard.backend.model.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {

    @Query("SELECT o FROM OtpToken o WHERE o.email = :email AND o.otpCode = :otpCode AND o.isValid = true AND o.expiresAt > CURRENT_TIMESTAMP")
    Optional<OtpToken> findByEmailAndOtpCode(@Param("email") String email, @Param("otpCode") String otpCode);

    Optional<OtpToken> findByEmailAndStatus(String email, OtpToken.OtpStatus status);

    List<OtpToken> findByExpiresAtBeforeAndIsValid(LocalDateTime now, boolean isValid);
    void deleteByStatus(OtpToken.OtpStatus status);

}
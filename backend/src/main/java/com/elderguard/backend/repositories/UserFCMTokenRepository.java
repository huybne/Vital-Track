package com.elderguard.backend.repositories;

import com.elderguard.backend.model.token.UserFCMToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserFCMTokenRepository extends JpaRepository<UserFCMToken, Long> {
    Optional<UserFCMToken> findByUserId(Long userId);


}

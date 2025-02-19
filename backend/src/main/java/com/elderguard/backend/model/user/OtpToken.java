package com.elderguard.backend.model.user;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "otp_tokens")
public class OtpToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "otp_code", nullable = false)
    private String otpCode;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "is_valid", nullable = false)
    private boolean isValid;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false) // Thêm trạng thái cho OTP
    private OtpStatus status;

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(this.expiresAt);
    }

    public enum OtpStatus {
        NOT_VERIFIED,
        VERIFIED
    }
}


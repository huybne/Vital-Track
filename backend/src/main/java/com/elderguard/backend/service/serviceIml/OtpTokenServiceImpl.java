package com.elderguard.backend.service.serviceIml;

import com.elderguard.backend.model.user.OtpToken;
import com.elderguard.backend.repositories.OtpTokenRepository;
import com.elderguard.backend.service.OtpTokenService;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class OtpTokenServiceImpl implements OtpTokenService {
    private final JavaMailSender javaMailSender;
    private final OtpTokenRepository otpTokenRepository;




    @Scheduled(fixedRate = 60000) // Chạy mỗi phút
    public void invalidateExpiredOtps() {
        List<OtpToken> expiredOtps = otpTokenRepository.findByExpiresAtBeforeAndIsValid(LocalDateTime.now(), true);

        for (OtpToken otp : expiredOtps) {
            otp.setValid(false);
            otpTokenRepository.save(otp);
        }
    }
    @Scheduled(cron = "0 0 * * * *") // Chạy mỗi giờ
    public void deleteProcessedOtps() {
        otpTokenRepository.deleteByStatus(OtpToken.OtpStatus.VERIFIED);
    }

    public OtpTokenServiceImpl(OtpTokenRepository otpTokenRepository,  JavaMailSender javaMailSender) {
        this.otpTokenRepository = otpTokenRepository;
        this.javaMailSender = javaMailSender;
    }

    public String generateOtp(){
        Random random = new Random();
        int otpCode = 10000 + random.nextInt(90000);
        return String.valueOf(otpCode);
    }
    @Override
    public OtpToken createOtp(String email){
        String otpCode = generateOtp();
        LocalDateTime createdAt = LocalDateTime.now();
        LocalDateTime expiresAt = createdAt.plusMinutes(2);

        OtpToken otpToken = new OtpToken();
        otpToken.setOtpCode(otpCode);
        otpToken.setCreatedAt(createdAt);
        otpToken.setExpiresAt(expiresAt);
        otpToken.setValid(true);
        otpToken.setEmail(email);
        otpToken.setStatus(OtpToken.OtpStatus.NOT_VERIFIED);

        otpTokenRepository.save(otpToken);

        sendOtpEmail(email, otpCode);
        return otpToken;
    }

    public void sendOtpEmail(String email, String otpCode) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("OTP Token");
            message.setText("Your OTP code is " + otpCode);
            javaMailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send OTP email: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean validateOtp(String email, String otpCode) {
        // Truy vấn OTP dựa trên email và mã OTP
        Optional<OtpToken> otpTokenOptional = otpTokenRepository.findByEmailAndOtpCode(email, otpCode);

        if (otpTokenOptional.isEmpty()) {
            throw new RuntimeException("Invalid OTP or email. Please try again.");
        }

        OtpToken otpToken = otpTokenOptional.get();

        // Kiểm tra nếu OTP đã hết hạn
        if (otpToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            otpToken.setValid(false);
            otpToken.setStatus(OtpToken.OtpStatus.NOT_VERIFIED);
            otpTokenRepository.save(otpToken); // Cập nhật trạng thái
            throw new RuntimeException("OTP has expired. Please request a new OTP.");
        }

        // Kiểm tra nếu OTP đã được sử dụng
        if (!otpToken.isValid()) {
            throw new RuntimeException("This OTP has already been used or is invalid.");
        }

        // Kiểm tra nếu OTP chưa được xác minh
        if (otpToken.getStatus() == OtpToken.OtpStatus.NOT_VERIFIED) {
            otpToken.setValid(false);
            otpToken.setStatus(OtpToken.OtpStatus.VERIFIED);
            otpTokenRepository.save(otpToken);
            return true; // OTP hợp lệ
        }

        // Trường hợp bất kỳ không hợp lệ
        throw new RuntimeException("Invalid OTP. Please try again.");
    }



}

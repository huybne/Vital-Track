package com.elderguard.backend.service.serviceIml;

import com.elderguard.backend.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceIml implements EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendAlertEmail(String toEmail, String userName1, String userName2) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Alert Notification");
            message.setText("Dear " + userName1 + ",\n\nWarning !!! Fall detected for user "+ userName2 );
            mailSender.send(message);
        } catch (MailException e) {
            // Xử lý lỗi gửi email
            System.err.println("Error sending email: " + e.getMessage());
        }
    }
}

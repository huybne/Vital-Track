package com.elderguard.backend.service;

public interface EmailService {
    void sendAlertEmail(String toEmail,String userName1, String userName2);
}

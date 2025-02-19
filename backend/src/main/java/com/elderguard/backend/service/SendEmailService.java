package com.elderguard.backend.service;

public interface SendEmailService  {
    void sendEmail(String recipient, String subject, String body);
}

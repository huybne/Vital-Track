package com.elderguard.backend.exceptions;

public class AlreadyFollowingException extends RuntimeException {
    public AlreadyFollowingException(String message) {
        super(message);
    }
}

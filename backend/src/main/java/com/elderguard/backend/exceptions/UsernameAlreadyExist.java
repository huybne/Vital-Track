package com.elderguard.backend.exceptions;

public class UsernameAlreadyExist extends RuntimeException{
    public UsernameAlreadyExist(String message){
        super(message);
    }
}

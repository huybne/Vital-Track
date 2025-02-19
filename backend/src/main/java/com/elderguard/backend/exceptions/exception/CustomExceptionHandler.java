package com.elderguard.backend.exceptions.exception;

import com.elderguard.backend.exceptions.EmailAlreadyExistsException;
import com.elderguard.backend.exceptions.NotFoundException;
import com.elderguard.backend.exceptions.UserNotFoundException;
import com.elderguard.backend.exceptions.UsernameAlreadyExist;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.Date;

@ControllerAdvice
public class CustomExceptionHandler {

    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<ExceptionResponse> handleUsernameNotFoundException(UsernameNotFoundException e){
        HttpStatus notFound = HttpStatus.NOT_FOUND;
        ExceptionResponse exceptionResponse = new ExceptionResponse(
                e.getMessage(), new Date(), notFound
        );
        return new ResponseEntity<>(exceptionResponse, notFound);
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ExceptionResponse> handleUserNotFoundException(UserNotFoundException e){
        HttpStatus notFound = HttpStatus.NOT_FOUND;
        ExceptionResponse exceptionResponse = new ExceptionResponse(
                e.getMessage(), new Date(), notFound
        );
        return new ResponseEntity<>(exceptionResponse, notFound);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ExceptionResponse> handleGeneralException(Exception e){
        HttpStatus internalServerError = HttpStatus.INTERNAL_SERVER_ERROR;
        ExceptionResponse exceptionResponse = new ExceptionResponse(
                "An unexpected error occurred", new Date(), internalServerError
        );
        return new ResponseEntity<>(exceptionResponse, internalServerError);
    }
    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ExceptionResponse> handleNotFoundException(NotFoundException e){
        HttpStatus notFound = HttpStatus.NOT_FOUND;
        ExceptionResponse exceptionResponse = new ExceptionResponse(
                e.getMessage(), new Date(), notFound
        );
        return new ResponseEntity<>(exceptionResponse, notFound);
    }
    @ExceptionHandler(UsernameAlreadyExist.class)
    public ResponseEntity<ExceptionResponse> handleUsernameAlreadyExist(UsernameAlreadyExist e) {
        HttpStatus conflict = HttpStatus.CONFLICT;
        ExceptionResponse exceptionResponse = new ExceptionResponse(
                e.getMessage(), new Date(), conflict
        );
        return new ResponseEntity<>(exceptionResponse, conflict);
    }
    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<ExceptionResponse> handleEmailAlreadyExists(EmailAlreadyExistsException e) {
        HttpStatus conflict = HttpStatus.CONFLICT;
        ExceptionResponse exceptionResponse = new ExceptionResponse(
                e.getMessage(), new Date(), conflict
        );
        return new ResponseEntity<>(exceptionResponse, conflict);
    }
}

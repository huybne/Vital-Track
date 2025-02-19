package com.elderguard.backend.controller;

import com.elderguard.backend.dto.request.AuthenticationRequest;
import com.elderguard.backend.dto.request.LogoutRequest;
import com.elderguard.backend.dto.request.RefreshRequest;
import com.elderguard.backend.dto.request.VerifyRequest;
import com.elderguard.backend.dto.response.ApiResponse;
import com.elderguard.backend.dto.response.AuthenticationResponse;
import com.elderguard.backend.dto.response.VerifyResponse;
import com.elderguard.backend.exceptions.InvalidPassword;
import com.elderguard.backend.service.AuthenticationService;
import com.nimbusds.jose.JOSEException;
import io.jsonwebtoken.ExpiredJwtException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.text.ParseException;
import java.util.Date;

import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureException;
import io.jsonwebtoken.JwtException;
@RestController
@RequestMapping("api/v1/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationController {
    private static final Logger log = LoggerFactory.getLogger(AuthenticationController.class);

    final AuthenticationService authenticationService;


    @GetMapping("/test")
    public ResponseEntity<ApiResponse<String>> testEndpoint() {
        return ResponseEntity.ok(new ApiResponse<>(
                "test ok",
                new Date(),
                HttpStatus.OK,
                "test ok"
        ));
    }

    @PostMapping("/login/google")
    public ResponseEntity<ApiResponse<AuthenticationResponse>> outbound(@RequestParam("code") String code) {
        try {
            AuthenticationResponse result = authenticationService.outboundAuthenticate(code);

            return ResponseEntity.ok(new ApiResponse<>(
                    "Google login successful",
                    new Date(),
                    HttpStatus.OK,
                    result
            ));
        } catch (Exception e) {
            log.error("Error during Google login", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(
                            "Google login failed",
                            new Date(),
                            HttpStatus.INTERNAL_SERVER_ERROR,
                            null
                    ));
        }
    }

    @PostMapping(value = "/token", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<AuthenticationResponse>> authenticate(@RequestBody AuthenticationRequest request) {
        try {
            AuthenticationResponse response = authenticationService.authenticate(request);
            return ResponseEntity.ok(new ApiResponse<>("Authentication successful", new Date(), HttpStatus.OK, response));
        } catch (UsernameNotFoundException e) {
            log.error("Username not found", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>("Username not found", new Date(), HttpStatus.UNAUTHORIZED, null));
        } catch (InvalidPassword e) {
            log.error("Invalid password", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>("Invalid password", new Date(), HttpStatus.UNAUTHORIZED, null));
        } catch (Exception e) {
            log.error("Authentication failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>("Authentication failed", new Date(), HttpStatus.INTERNAL_SERVER_ERROR, null));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<VerifyResponse>> verify(@RequestBody VerifyRequest request, Model model) {
        try {
            VerifyResponse response = authenticationService.verify(request);
            return ResponseEntity.ok(new ApiResponse<>("Token verification successful", new Date(), HttpStatus.OK, response));
        } catch (ParseException | JOSEException e) {
            log.error("Token verification failed", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>("Token verification failed", new Date(), HttpStatus.BAD_REQUEST, null));
        } catch (Exception e) {
            log.error("Unexpected error occurred", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>("Unexpected error occurred", new Date(), HttpStatus.INTERNAL_SERVER_ERROR, null));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthenticationResponse>> refresh(@RequestBody RefreshRequest request) {
        try {
            AuthenticationResponse result = authenticationService.refreshToken(request);
            return ResponseEntity.ok(new ApiResponse<>("Token refreshed successfully", new Date(), HttpStatus.OK, result));
        } catch (UsernameNotFoundException e) {
            log.error("Username not found", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>("Username not found", new Date(), HttpStatus.UNAUTHORIZED, null));
        } catch (InvalidPassword e) {
            log.error("Invalid password", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>("Invalid password", new Date(), HttpStatus.UNAUTHORIZED, null));
        } catch (Exception e) {
            log.error("Refresh failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>("Refresh failed", new Date(), HttpStatus.INTERNAL_SERVER_ERROR, null));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestBody LogoutRequest request) {
        try {
            authenticationService.logout(request);
            return ResponseEntity.ok(new ApiResponse<>("Logout successful", new Date(), HttpStatus.OK, null));
        } catch (ExpiredJwtException e) {
            log.error("Logout failed - Token expired", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>("Logout failed - Token expired", new Date(), HttpStatus.UNAUTHORIZED, null));
        } catch (MalformedJwtException | SignatureException | IllegalArgumentException e) {
            log.error("Logout failed - Invalid token or token format", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>("Logout failed - Invalid token format", new Date(), HttpStatus.BAD_REQUEST, null));
        } catch (JwtException e) {
            log.error("Logout failed - JWT processing error", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>("Logout failed - JWT processing error", new Date(), HttpStatus.BAD_REQUEST, null));
        } catch (ParseException | JOSEException e) {
            log.error("Logout failed - Token parsing error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>("Logout failed - Token parsing error", new Date(), HttpStatus.INTERNAL_SERVER_ERROR, null));
        } catch (Exception e) {
            log.error("Logout failed due to an unexpected error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>("Logout failed due to an unexpected error", new Date(), HttpStatus.INTERNAL_SERVER_ERROR, null));
        }
    }

}

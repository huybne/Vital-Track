package com.elderguard.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserCreationRequest {

    private String username;
    private String fullName;
    private boolean status;
    private String dob;
    private String email;
    private String Gender;
    private String password;
    private String telephone;
}

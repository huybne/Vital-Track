package com.elderguard.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateRequest {
    private String fullName;
    private boolean status;
    private String dob;
    private String email;
    private String telephone;
    private String Gender;
    private String deviceId;


}

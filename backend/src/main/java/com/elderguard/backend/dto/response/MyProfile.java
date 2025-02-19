package com.elderguard.backend.dto.response;

import com.elderguard.backend.model.user.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MyProfile {
    private String id;
    private String username;
    private String fullName;
    private Set<Role> roles;
    private boolean status;
    private String dob;
    private String email;
    private String gender;
    private String telephone;
    private Long closeFriendId;
    private String Gender;
    private String avatar;;
    private String deviceId;


}

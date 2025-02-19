package com.elderguard.backend.dto.response;

import com.elderguard.backend.model.user.Role;
import lombok.*;

import java.util.Set;
@Builder
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AllFollowersResponse {
    private String id;
    private String username;
    private String fullName;
    private boolean status;
    private String email;
    private String telephone;
}

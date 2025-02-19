package com.elderguard.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FollowResponseDto {
    private Long id;         // ID of the follow relationship
    private String follower; // Username of the follower
    private String followed; // Username of the followed
    private String status;   // Follow status (PENDING or ACCEPTED)
}
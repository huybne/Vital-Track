package com.elderguard.backend.service;

import com.elderguard.backend.dto.request.AlertData;
import com.elderguard.backend.dto.response.AllFollowersResponse;
import com.elderguard.backend.dto.response.UserResponseById;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface AlertService {
    void processAlert(AlertData request);


    @Transactional
    List<AllFollowersResponse> getAllFollowersOfCurrentUser(AlertData request);
}

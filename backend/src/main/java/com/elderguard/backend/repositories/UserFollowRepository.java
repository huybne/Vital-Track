package com.elderguard.backend.repositories;

import com.elderguard.backend.model.user.FollowStatus;
import com.elderguard.backend.model.user.User;
import com.elderguard.backend.model.user.UserFollow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserFollowRepository extends JpaRepository<UserFollow, Long> {
    boolean existsByFollowerAndFollowed(User follower, User followed);


    List<UserFollow> findByFollowedAndStatusOrderByFollowerUsernameAsc(User followed, FollowStatus status);
    Optional<UserFollow> findByFollowerAndFollowed(User follower, User followed);
    List<UserFollow> findByFollowerAndStatus(User follower, FollowStatus status);
    Optional<UserFollow> findByFollowedAndFollowerAndStatus(User followed, User follower, FollowStatus status);

    List<UserFollow> findByFollowed(User followed);

}

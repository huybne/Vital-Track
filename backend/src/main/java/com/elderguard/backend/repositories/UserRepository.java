package com.elderguard.backend.repositories;

import com.elderguard.backend.dto.response.UserResponse;
import com.elderguard.backend.model.user.Role;
import com.elderguard.backend.model.user.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);
    boolean existsByEmail(String email);


    @EntityGraph(attributePaths = "roles")
    Optional<User> findByUsername(String username);
    List<User> findAllByOrderByUsernameAsc();
    List<User> findAllByRolesContainingOrderByUsernameAsc(Role role);


    Optional<User> findByDeviceId(String deviceId);
}

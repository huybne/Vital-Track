package com.elderguard.backend.model.user;


import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;
import java.util.Set;

@Getter
@RequiredArgsConstructor
public enum Role {
    ADMIN(Set.of(
            Permission.VIEW_ALL_HEALTH_DATA,
            Permission.MANAGE_OWN_PROFILE,
            Permission.ADD_RELATION,
            Permission.REMOVE_RELATION,
            Permission.VIEW_DEVICE_INFO,
            Permission.MANAGE_DEVICE,
            Permission.SEND_ALERTS,
            Permission.MANAGE_USERS,
            Permission.MANAGE_SYSTEM
    )),
    DEVICE_ACTIVE(Set.of(
            Permission.VIEW_OWN_HEALTH_DATA,
            Permission.VIEW_DEVICE_INFO,
            Permission.SEND_ALERTS
    )),
    USER(Set.of(
            Permission.MANAGE_OWN_PROFILE
    )),
    RELATIVE(Set.of(
            Permission.ADD_RELATION,
            Permission.REMOVE_RELATION,
            Permission.RECEIVE_ALERTS,
            Permission.VIEW_TRUSTED_HEALTH_DATA,
            Permission.ACCESS_HISTORY
    ))
    ;

    private final Set<Permission> permissions;

    public List<SimpleGrantedAuthority> getAuthorities() {
        var authorities = getPermissions()
                .stream()
                .map(permission -> new SimpleGrantedAuthority(permission.name()))
                .toList();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + this.name()));
        return authorities;
    }

}
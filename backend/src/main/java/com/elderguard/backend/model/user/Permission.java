package com.elderguard.backend.model.user;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public enum Permission {
    VIEW_OWN_HEALTH_DATA("user: view own health data"),
    MANAGE_OWN_PROFILE("user: manage own profile"),
    ADD_RELATION("user: add relation"),
    REMOVE_RELATION("user: remove relation"),
    VIEW_DEVICE_INFO("device: view device info"),
    MANAGE_DEVICE("device: manage device"),
    SEND_ALERTS("user: send alerts"),
    VIEW_TRUSTED_HEALTH_DATA("relative: view trusted health data"),
    RECEIVE_ALERTS("relative: receive alerts"),
    ACCESS_HISTORY("relative: access history"),
    VIEW_ALL_HEALTH_DATA("admin: view all health data"),
    MANAGE_USERS("admin: manage users"),
    MANAGE_SYSTEM("admin: manage system");

    @Getter
    private final String description;
}

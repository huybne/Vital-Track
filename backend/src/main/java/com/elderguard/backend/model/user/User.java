package com.elderguard.backend.model.user;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.*;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "app_user")
public class
User  {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "google_id", unique = true)
    private String googleId;

    @Column(name = "username", unique = true, columnDefinition = "VARCHAR(255) ")
    private String username;

    private String password;

    private String fullName;
    private boolean status;
    private String dob;


    @Enumerated(EnumType.STRING)
    @ElementCollection(targetClass = Role.class, fetch = FetchType.LAZY)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "role")
    private Set<Role> roles = new HashSet<>();


    @Column
    private String gender;

    @Column(unique = true)
    @NotBlank(message = "Email cannot be blank")
    @Email(message = "Email should be valid")
    private String email;

    @Column
    private String telephone; // Renamed from phoneNumber for consistency

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "close_friend_id")
    private User closeFriend;


    private String deviceId;

    @OneToMany(mappedBy = "follower", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<UserFollow> following = new HashSet<>();

    @OneToMany(mappedBy = "followed", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<UserFollow> followers = new HashSet<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
    private boolean registeredViaGoogle = false;
    public boolean isRegisteredViaGoogle() {
        return registeredViaGoogle;
    }
    public void setRegisteredViaGoogle(boolean registeredViaGoogle) {
        this.registeredViaGoogle = registeredViaGoogle;
    }


    @Column(name = "avatar", columnDefinition = "TEXT")
    private String avatar; // Lưu chuỗi Base64 của avatar

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return Objects.equals(username, user.username);
    }


}

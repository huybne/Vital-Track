package com.elderguard.backend.config;

import com.elderguard.backend.model.user.User;
import com.elderguard.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class CustomOidcUserService extends OidcUserService {
    @Autowired
    private UserRepository userRepository;

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUser oidcUser = super.loadUser(userRequest);

        String email = oidcUser.getEmail();
        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isPresent()) {
            User existingUser = userOptional.get();

            // Kiểm tra nếu người dùng đã đăng ký tài khoản bằng phương thức thông thường
            if (!existingUser.isRegisteredViaGoogle()) {
                // Thoát khỏi phiên đăng nhập và thông báo cho người dùng
                SecurityContextHolder.clearContext();
                throw new OAuth2AuthenticationException("Tài khoản đã tồn tại. Vui lòng đăng nhập bằng email và mật khẩu.");
            }

            // Nếu người dùng đã đăng ký bằng Google, cho phép đăng nhập
            return oidcUser; // Đăng nhập thành công
        }

        // Nếu người dùng không tồn tại, tạo người dùng mới từ thông tin Google
        User newUser = new User();
        newUser.setEmail(email);
        newUser.setFullName(oidcUser.getFullName());
        newUser.setGender(oidcUser.getGender());
        newUser.setDob(oidcUser.getBirthdate());
        newUser.setTelephone(oidcUser.getPhoneNumber());
        newUser.setRegisteredViaGoogle(true); // Đánh dấu rằng tài khoản này được tạo qua Google

        userRepository.save(newUser);

        return oidcUser;
    }
}
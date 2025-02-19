package com.elderguard.backend.service.serviceIml;

import com.elderguard.backend.dto.request.*;
import com.elderguard.backend.dto.response.MyProfile;
import com.elderguard.backend.dto.response.UserResponse;
import com.elderguard.backend.dto.response.UserResponseById;
import com.elderguard.backend.exceptions.UserNotFoundException;
import com.elderguard.backend.exceptions.UsernameAlreadyExist;
import com.elderguard.backend.exceptions.EmailAlreadyExistsException;
import com.elderguard.backend.mapper.UserMapper;
import com.elderguard.backend.model.user.Role;
import net.coobird.thumbnailator.Thumbnails;

import com.elderguard.backend.model.user.User;
import com.elderguard.backend.repositories.UserRepository;
import com.elderguard.backend.service.UserService;
import io.micrometer.common.util.StringUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.HashSet;
import java.util.List;

@Service
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder, UserMapper userMapper
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.userMapper = userMapper;
    }
    @Transactional
    @Override
    public List<UserResponse> getAllUserRoleDeviceActive() {
        // Tìm tất cả người dùng có vai trò DEVICE_ACTIVE
        List<User> users = userRepository.findAllByRolesContainingOrderByUsernameAsc(Role.DEVICE_ACTIVE);

        // Map danh sách User sang UserResponse
        return users.stream()
                .map(userMapper::toUserResponse)
                .toList();
    }

    @Override
    public UserResponse createUser(VerifyOtpAndCreateUserRequest request){
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UsernameAlreadyExist("Username already exists.");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("Email is already in use.");
        }

        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        HashSet<Role> roles = new HashSet<>();
        roles.add(Role.USER);
        user.setRoles(roles);
        user = userRepository.save(user);
        return userMapper.toUserResponse(user);
    }
//    @Override
//    public UserResponse createUserWithOtpValidation(VerifyOtpAndCreateUserRequest request) {
//        // Gọi validateOtp để kiểm tra và xác minh OTP
//        otpService.validateOtp(request.getEmail(), request.getOtpCode());
//
//        // Kiểm tra username và email
//        if (userRepository.existsByUsername(request.getUsername())) {
//            throw new UsernameAlreadyExist("Username already exists.");
//        }
//
//        if (userRepository.existsByEmail(request.getEmail())) {
//            throw new EmailAlreadyExistsException("Email is already in use.");
//        }
//
//        // Tạo user
//        User user = userMapper.toUser(request);
//        user.setPassword(passwordEncoder.encode(request.getPassword()));
//
//        HashSet<Role> roles = new HashSet<>();
//        roles.add(Role.USER);
//        user.setRoles(roles);
//
//        user = userRepository.save(user);
//
//        return userMapper.toUserResponse(user);
//    }


    @Override
    public void deleteUser(Long id){
        userRepository.deleteById(id);
    }
    @Transactional
    @Override
    public UserResponse updateUser(Long id, UserUpdateRequest request){
        User user = userRepository.findById(id).orElseThrow(
                ()-> new RuntimeException("User does not exist")
        );
        if(StringUtils.isNotBlank(request.getFullName())){
            user.setFullName(request.getFullName());
        }
        if(StringUtils.isNotBlank(request.getEmail())){
            user.setEmail(request.getEmail());
        }
        if(StringUtils.isNotBlank(request.getTelephone())){
            user.setTelephone(request.getTelephone());
        }
        if(StringUtils.isNotBlank(request.getGender())){
            user.setGender(request.getGender());
        }
        if (request.isStatus() != user.isStatus()) {
            user.setStatus(request.isStatus());
        }
        if (StringUtils.isNotBlank(request.getDob())) {
            user.setDob(request.getDob());
        }
        if(StringUtils.isNotBlank(request.getDeviceId())) {
            user.setDeviceId(request.getDeviceId());
        }else{
            user.setDeviceId(null);
        }
        return userMapper.toUserResponse(userRepository.save(user));
    }
    @Override
    @Transactional
    public void setDeviceId(ConnectDevice request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User does not exist"));
        String sanitizedDeviceId = request.getDeviceId().replace(":", "");

        user.setDeviceId(sanitizedDeviceId);
        if(user.getRoles().contains(Role.RELATIVE)){
            user.getRoles().remove(Role.RELATIVE);

        }
        if (!user.getRoles().contains(Role.DEVICE_ACTIVE)) {
            user.getRoles().add(Role.DEVICE_ACTIVE);
        }


        userRepository.save(user);
    }

    @Override
    @Transactional
    public void removeDeviceId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User does not exist"));

        user.setDeviceId(null);

        userRepository.save(user);
    }

    @Override
    @Transactional
    public void changePassword(Long id, ChangePasswordRequest request){
        User user = userRepository.findById(id).orElseThrow(
                ()-> new RuntimeException("User does not exist")
        );
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Old password is incorrect");
        }

        // Xác nhận mật khẩu mới không trùng với mật khẩu cũ
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new IllegalArgumentException("New password cannot be the same as the old password");
        }

        // Đổi mật khẩu mới
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }


    @Transactional
    @Override
    public UserResponseById getUser(Long id){
        return  userMapper.toUserResponseById(userRepository.findById(id).
                orElseThrow(() -> new RuntimeException("user not found")));
    }
    @Transactional
    @Override
    public List<UserResponse> getAllUsers(){
        List<User> users = userRepository.findAllByOrderByUsernameAsc();
        return users
                .stream()
                .map(userMapper::toUserResponse)
                .toList();
    }

    @Override
    public MyProfile getMyInfo(){
        var context = SecurityContextHolder.getContext();
        String name = context.getAuthentication().getName();
        User user  = userRepository.findByUsername(name)
                .orElseThrow(
                        ()-> new UserNotFoundException("User not found")
                );

        return userMapper.toMyProfile(user);
    }
    @Override
    public String getAvatarBase64() {
        var context = SecurityContextHolder.getContext();
        String name = context.getAuthentication().getName();
        User user = userRepository.findByUsername(name)
                .orElseThrow(() -> new UserNotFoundException("User not found"));


        return user.getAvatar();
    }

    @Override
    public void saveAvatar(Long id, MultipartFile file) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        try {
            byte[] fileContent = file.getBytes();

            // Kiểm tra kích thước của ảnh ban đầu
            if (fileContent.length <= 500 * 1024) {
                // Nếu ảnh nhỏ hơn hoặc bằng 50KB, lưu trực tiếp
                String base64String = Base64.getEncoder().encodeToString(fileContent);
                user.setAvatar(base64String);
            } else {
                // Nếu ảnh lớn hơn 50KB, tiến hành nén ảnh
                ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
                Thumbnails.of(file.getInputStream())
                        .size(200, 200) // Điều chỉnh kích thước nếu cần, hoặc có thể bỏ qua
                        .outputQuality(0.5) // Điều chỉnh chất lượng nén
                        .toOutputStream(outputStream);

                byte[] compressedImage = outputStream.toByteArray();

                // Nếu ảnh đã nén vẫn lớn hơn 50KB, có thể tiếp tục điều chỉnh
                if (compressedImage.length > 500 * 1024) {
                    throw new RuntimeException("Compressed image exceeds 50KB size limit.");
                }

                // Chuyển ảnh đã nén thành chuỗi Base64 và lưu
                String base64String = Base64.getEncoder().encodeToString(compressedImage);
                user.setAvatar(base64String);
            }

            userRepository.save(user);
        } catch (IOException e) {
            throw new RuntimeException("Error processing the file", e);
        }
    }

    @Override
    @Transactional
    public void grantRole(GrantRoleRequest request) {
        // Tìm người dùng theo id từ request
        User user = userRepository.findById(request.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Chuyển đổi chuỗi role từ request thành enum Role
        Role newRole;
        try {
            newRole = Role.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role: " + request.getRole());
        }

        // Lấy tập hợp roles hiện tại của user
        HashSet<Role> roles = new HashSet<>(user.getRoles());

        // Thêm role mới vào tập hợp roles nếu chưa có
        if (!roles.contains(newRole)) {
            roles.add(newRole);
        } else {
            throw new IllegalArgumentException("User already has the role: " + newRole);
        }

        // Cập nhật lại roles cho user
        user.setRoles(roles);

        // Lưu lại thông tin user
        userRepository.save(user);
    }

    @Transactional
    @Override
    public void setCloseFriend(String username){
        try {
            // Lấy thông tin người dùng hiện tại từ SecurityContext
            var context = SecurityContextHolder.getContext();

            String name = context.getAuthentication().getName();
            User currentUser = userRepository.findByUsername(name)
                    .orElseThrow(() -> new UserNotFoundException("Current user not found"));

            if (!currentUser.getRoles().contains(Role.DEVICE_ACTIVE)) {
                throw new RuntimeException("Only users with DEVICE_ACTIVE role can add close followers");
            }
            User friend = userRepository.findByUsername(username)
                    .orElseThrow(() -> new UserNotFoundException("User to add not found"));
            currentUser.setCloseFriend(friend);
            userRepository.save(currentUser);
        }catch (RuntimeException e){
            throw new RuntimeException("An error occurred while processing the request: " + e.getMessage(), e);
        }
    }



}

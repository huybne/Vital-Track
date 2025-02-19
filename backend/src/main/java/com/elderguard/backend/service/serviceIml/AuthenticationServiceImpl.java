    package com.elderguard.backend.service.serviceIml;

    import com.elderguard.backend.dto.request.*;
    import com.elderguard.backend.dto.response.AuthenticationResponse;
    import com.elderguard.backend.dto.response.OutboundUserResponse;
    import com.elderguard.backend.dto.response.VerifyResponse;
    import com.elderguard.backend.exceptions.NotFoundException;
    import com.elderguard.backend.exceptions.UserNotFoundException;
    import com.elderguard.backend.model.token.InvalidatedToken;
    import com.elderguard.backend.model.user.Role;
    import com.elderguard.backend.model.user.User;
    import com.elderguard.backend.repositories.InvalidatedTokenRepository;
    import com.elderguard.backend.repositories.httpclient.OutboundIdentityClient;
    import com.elderguard.backend.repositories.UserRepository;
    import com.elderguard.backend.repositories.httpclient.OutboundUserClient;
    import com.elderguard.backend.service.AuthenticationService;
    import com.nimbusds.jose.*;
    import com.nimbusds.jose.crypto.MACSigner;
    import com.nimbusds.jose.crypto.MACVerifier;
    import com.nimbusds.jwt.JWTClaimsSet;
    import com.nimbusds.jwt.SignedJWT;
    import feign.FeignException;
    import lombok.AccessLevel;
    import lombok.experimental.FieldDefaults;
    import lombok.experimental.NonFinal;
    import org.slf4j.Logger;
    import org.slf4j.LoggerFactory;
    import org.springframework.beans.factory.annotation.Value;
    import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
    import org.springframework.security.crypto.password.PasswordEncoder;
    import org.springframework.stereotype.Service;
    import org.springframework.transaction.annotation.Transactional;
    import org.springframework.util.CollectionUtils;

    import java.text.ParseException;
    import java.time.Instant;
    import java.time.temporal.ChronoUnit;
    import java.util.*;

    @Service
    @FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
    public class AuthenticationServiceImpl implements AuthenticationService {
        private final UserRepository userRepository;
        private static final Logger log = LoggerFactory.getLogger(AuthenticationServiceImpl.class);
        private final InvalidatedTokenRepository invalidatedTokenRepository;
        private final OutboundIdentityClient outboundIdentityClient;
        private final OutboundUserClient outboundUserClient;
        @NonFinal
        @Value("${jwt.valid-duration}")
        private long VALID_DURATION;

        @NonFinal
        @Value("${jwt.SECRET_KEY}")
        private String SECRET_KEY;

        @NonFinal
        @Value("${jwt.refreshable-duration}")
        private long REFRESHABLE_DURATION;

        @NonFinal
        @Value("${spring.security.oauth2.client.registration.google.client-id}")
        private  String CLIENT_ID ;

        @NonFinal
        @Value("${spring.security.oauth2.client.registration.google.client-secret}")
        protected String CLIENT_SECRET;

        @NonFinal
        @Value("${spring.security.oauth2.client.registration.google.redirect-uri}")
        protected String REDIRECT_URI;


        @NonFinal
        protected final String   GRANT_TYPE = "authorization_code";

        public AuthenticationServiceImpl(UserRepository userRepository, InvalidatedTokenRepository invalidatedTokenRepository, OutboundIdentityClient outboundIdentityClient, OutboundUserClient outboundUserClient) {
            this.userRepository = userRepository;
            this.invalidatedTokenRepository = invalidatedTokenRepository;
            this.outboundIdentityClient = outboundIdentityClient;
            this.outboundUserClient = outboundUserClient;
        }

        @Override
        @Transactional
        public AuthenticationResponse outboundAuthenticate(String code) {
            try {
                var response = outboundIdentityClient.exchangeToken(
                        code,
                        CLIENT_ID,
                        CLIENT_SECRET,
                        REDIRECT_URI,
                        GRANT_TYPE
                );
                log.info("Token response {}", response);

                var userInfo = outboundUserClient.getUserInfo("json", response.getAccessToken());
                log.info("User info {}", userInfo);

                HashSet<Role> roles = new HashSet<>();
                roles.add(Role.USER);
                var user = userRepository.findByEmail(userInfo.getEmail())
                        .orElseGet(() -> userRepository.save(User.builder()
                                        .googleId(userInfo.getId())
                                        .username(userInfo.getName())
                                        .fullName(userInfo.getName())
                                        .email(userInfo.getEmail())
                                        .avatar(userInfo.getPhoto())
                                        .roles(roles)
                                .build()));

                var token = generateToken(user);

                return AuthenticationResponse.builder()
                        .token(token)
                        .build();
            } catch (FeignException e) {
                log.error("Feign error during token exchange: {} - {}", e.status(), e.contentUTF8());
                throw new RuntimeException("Error during token exchange", e);
            } catch (Exception e) {
                log.error("General error during token exchange", e);
                throw new RuntimeException("Unexpected error during token exchange", e);
            }
        }

        @Override
        public VerifyResponse verify(VerifyRequest request) throws JOSEException, ParseException {
            String token = request.getToken();
            boolean isValid = true;

            try{
                verifyToken(token, false);
            }
            catch (ParseException e) {
                isValid = false;
            }
            return VerifyResponse.builder()
                    .valid(isValid)
                    .build();
        }


        @Override
        public AuthenticationResponse authenticate(AuthenticationRequest request) {
            var user = userRepository.findByUsername(request.getUsername())
                    .orElseThrow(() -> new UserNotFoundException("User " + request.getUsername() +" not exist"));
            PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
            boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());
            if (!authenticated)
                throw new NotFoundException("unauthenticated user");

            var token = generateToken(user);
            return AuthenticationResponse.builder()
                    .token(token)
                    .authenticated(true)
                    .userId(user.getId())
                    .build();
        }
        @Override
        public void logout(LogoutRequest request) throws ParseException, JOSEException {
            try {
                var signToken = verifyToken(request.getToken(), true);

                String username = signToken.getJWTClaimsSet().getSubject();
                String jit = signToken.getJWTClaimsSet().getJWTID();
                Date expiryTime = signToken.getJWTClaimsSet().getExpirationTime();

                InvalidatedToken invalidatedToken = InvalidatedToken.builder()
                        .id(jit)
                        .expiryTime(expiryTime)
                        .build();
                invalidatedTokenRepository.save(invalidatedToken);

            } catch (ParseException | JOSEException e) {
                log.error("Logout failed due to token parsing/JOSE error: " + e.getMessage());
                throw e;  // Ném lại ngoại lệ để controller có thể bắt
            } catch (Exception e) {
                log.error("An unexpected error occurred during logout: " + e.getMessage());
                throw new RuntimeException("Unexpected logout error", e);  // Ném lại ngoại lệ chung
            }
        }

        public SignedJWT verifyToken(String token, boolean isRefresh) throws ParseException, JOSEException {
            JWSVerifier verifier = new MACVerifier(SECRET_KEY.getBytes());
            SignedJWT signedJWT = SignedJWT.parse(token);
            Date expiration = (isRefresh)
                    ? new Date(signedJWT.getJWTClaimsSet().getIssueTime()
                    .toInstant().plus(REFRESHABLE_DURATION, ChronoUnit.SECONDS).toEpochMilli())

                    : signedJWT.getJWTClaimsSet().getExpirationTime();

            var verified = signedJWT.verify(verifier);
            if (!(verified && expiration.after(new Date())))
                throw new ParseException("token expired", 0);
            if (invalidatedTokenRepository.existsById(signedJWT.getJWTClaimsSet().getJWTID()))
                throw new ParseException("token invalidated", 0);
            return signedJWT;
        }
        @Override
        public AuthenticationResponse refreshToken(RefreshRequest request) throws ParseException, JOSEException {
            var signedJWT = verifyToken(request.getToken(), true);
            var jit = signedJWT.getJWTClaimsSet().getJWTID();
            var expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();

            InvalidatedToken invalidatedToken = InvalidatedToken.builder()
                    .id(jit)
                    .expiryTime(expiryTime)
                    .build();
            invalidatedTokenRepository.save(invalidatedToken);

            var username = signedJWT.getJWTClaimsSet().getSubject();
            var user = userRepository.findByUsername(username).orElseThrow(
                    () -> new UserNotFoundException( "cannot find user")
            );
            var token = generateToken(user);
            return AuthenticationResponse.builder()
                    .token(token)
                    .authenticated(true)
                    .build();
        }

        @Override
        public String generateToken(User user) {
            JWSHeader header = new JWSHeader(JWSAlgorithm.HS256);
            JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                    .subject(user.getUsername())
                    .issuer("backend")
                    .issueTime(new Date())
                    .expirationTime(new Date(
                            Instant.now().plus(VALID_DURATION, ChronoUnit.SECONDS).toEpochMilli()
                    ))
                    .jwtID(UUID.randomUUID().toString())
                    .claim("id", user.getId())
                    .claim("scope", buildScope(user))
                    .build();
            Payload payload = new Payload(jwtClaimsSet.toJSONObject());

            JWSObject jwsObject =new JWSObject(header,payload);
            try {
                jwsObject.sign(new MACSigner(SECRET_KEY.getBytes()));
                return jwsObject.serialize();
            } catch (JOSEException e) {
                log.error("Cannot create token", e);
                throw new RuntimeException(e);
            }
        }
        private String buildScope(User user) {
            StringJoiner stringJoiner = new StringJoiner(" ");

            if(!CollectionUtils.isEmpty(user.getRoles()))
                user.getRoles().forEach(role -> stringJoiner.add(role.name())); // Chuyển đổi Role sang String
            return stringJoiner.toString();
        }
    }

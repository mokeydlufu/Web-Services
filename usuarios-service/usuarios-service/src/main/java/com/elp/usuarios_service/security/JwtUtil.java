package com.elp.usuarios_service.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.elp.usuarios_service.model.UsuarioBase;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    private static final long EXPIRATION_TIME = 86400000; // 24 hours

    public String generateToken(UsuarioBase usuario) {
        Algorithm algorithm = Algorithm.HMAC256(secret);
        return JWT.create()
                .withSubject(usuario.getId().toString())
                .withClaim("rol", usuario.getRol().name())
                .withIssuedAt(new Date())
                .withExpiresAt(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .sign(algorithm);
    }

    public DecodedJWT validateToken(String token) throws JWTVerificationException {
        Algorithm algorithm = Algorithm.HMAC256(secret);
        return JWT.require(algorithm)
                .build()
                .verify(token);
    }

    public String getSubjectFromToken(String token) {
        return validateToken(token).getSubject();
    }
}

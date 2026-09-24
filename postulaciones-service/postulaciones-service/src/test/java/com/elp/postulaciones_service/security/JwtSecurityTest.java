package com.elp.postulaciones_service.security;

import com.elp.postulaciones_service.util.SecurityUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class JwtSecurityTest {

    private SecurityContext securityContext;
    private Authentication authentication;

    @BeforeEach
    void setUp() {
        securityContext = mock(SecurityContext.class);
        authentication = mock(Authentication.class);
        SecurityContextHolder.setContext(securityContext);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void extraerIdYRolDeJwtValido() {
        UUID sub = UUID.randomUUID();
        Jwt jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn(sub.toString());
        when(jwt.getClaimAsString("rol")).thenReturn("ESTUDIANTE");

        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(jwt);

        assertEquals(sub, SecurityUtils.getUsuarioLogueadoId());
        assertEquals("ESTUDIANTE", SecurityUtils.getRolUsuarioLogueado());
    }
}
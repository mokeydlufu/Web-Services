package com.elp.ofertas_service.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class EmpresaAuthorizationServiceTest {

    private EmpresaAuthorizationService authorizationService;

    @BeforeEach
    void setUp() {
        authorizationService = new EmpresaAuthorizationService();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void mockSecurityContext(String rol) {
        Jwt jwt = mock(Jwt.class);
        when(jwt.getClaimAsString("rol")).thenReturn(rol);
        
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(jwt);
        
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void tienePermisoDePropiedad_Success_WhenRolIsEmpresaAndIdsMatch() {
        mockSecurityContext("EMPRESA");
        UUID id = UUID.randomUUID();
        
        boolean result = authorizationService.tienePermisoDePropiedad(id, id);
        
        assertTrue(result);
    }

    @Test
    void tienePermisoDePropiedad_Fail_WhenRolIsEmpresaAndIdsDoNotMatch() {
        mockSecurityContext("EMPRESA");
        UUID userId = UUID.randomUUID();
        UUID empresaId = UUID.randomUUID();
        
        boolean result = authorizationService.tienePermisoDePropiedad(userId, empresaId);
        
        assertFalse(result);
    }

    @Test
    void tienePermisoDePropiedad_Success_WhenRolIsAdministrador() {
        mockSecurityContext("ADMINISTRADOR");
        UUID id = UUID.randomUUID();
        UUID empresaId = UUID.randomUUID();
        
        boolean result = authorizationService.tienePermisoDePropiedad(id, empresaId);
        
        assertTrue(result);
    }

    @Test
    void tienePermisoDePropiedad_Success_WhenRolIsReclutadorAndBelongsToEmpresa() {
        mockSecurityContext("RECLUTADOR");
        UUID id = UUID.randomUUID();
        
        boolean result = authorizationService.tienePermisoDePropiedad(id, id);
        
        assertTrue(result);
    }

    @Test
    void tienePermisoDePropiedad_Fail_WhenRolIsReclutadorAndDifferentEmpresa() {
        mockSecurityContext("RECLUTADOR");
        UUID userId = UUID.randomUUID();
        UUID empresaId = UUID.randomUUID();
        
        boolean result = authorizationService.tienePermisoDePropiedad(userId, empresaId);
        
        assertFalse(result);
    }

    @Test
    void tienePermisoDeModeracion_Success_WhenRolIsAdministrador() {
        mockSecurityContext("ADMINISTRADOR");
        UUID userId = UUID.randomUUID();
        UUID empresaId = UUID.randomUUID();
        
        boolean result = authorizationService.tienePermisoDeModeracion(userId, empresaId);
        
        assertTrue(result);
    }

    @Test
    void tienePermisoDeModeracion_Success_WhenRolIsEmpresaAndIdsMatch() {
        mockSecurityContext("EMPRESA");
        UUID id = UUID.randomUUID();
        
        boolean result = authorizationService.tienePermisoDeModeracion(id, id);
        
        assertTrue(result);
    }

    @Test
    void tienePermisoDeModeracion_Fail_WhenRolIsEmpresaAndIdsDoNotMatch() {
        mockSecurityContext("EMPRESA");
        UUID userId = UUID.randomUUID();
        UUID empresaId = UUID.randomUUID();
        
        boolean result = authorizationService.tienePermisoDeModeracion(userId, empresaId);
        
        assertFalse(result);
    }

    @Test
    void tienePermisoDePropiedad_Fail_WhenRolIsEstudiante() {
        mockSecurityContext("ESTUDIANTE");
        UUID id = UUID.randomUUID();
        
        boolean result = authorizationService.tienePermisoDePropiedad(id, id);
        
        assertFalse(result);
    }

    @Test
    void tienePermisoDeModeracion_Success_WhenRolIsModerador() {
        mockSecurityContext("MODERADOR");
        UUID userId = UUID.randomUUID();
        UUID empresaId = UUID.randomUUID();
        
        boolean result = authorizationService.tienePermisoDeModeracion(userId, empresaId);
        
        assertTrue(result);
    }

    @Test
    void tienePermisoDeModeracion_Fail_WhenRolIsEstudiante() {
        mockSecurityContext("ESTUDIANTE");
        UUID id = UUID.randomUUID();
        
        boolean result = authorizationService.tienePermisoDeModeracion(id, id);
        
        assertFalse(result);
    }
}

package com.elp.postulaciones_service.security;

import com.elp.postulaciones_service.util.SecurityUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EmpresaAuthorizationServiceTest {

    private EmpresaAuthorizationService authorizationService;
    private MockedStatic<SecurityUtils> securityUtilsMock;

    @BeforeEach
    void setUp() {
        authorizationService = new EmpresaAuthorizationService();
        securityUtilsMock = Mockito.mockStatic(SecurityUtils.class);
    }

    @AfterEach
    void tearDown() {
        securityUtilsMock.close();
    }

    @Test
    void tienePermisoDePropiedad_AdminPermitido() {
        UUID adminId = UUID.randomUUID();
        UUID empresaId = UUID.randomUUID();

        assertTrue(authorizationService.tienePermisoDePropiedad(adminId, empresaId, "ADMIN"));
        assertTrue(authorizationService.tienePermisoDePropiedad(adminId, empresaId, "ADMINISTRADOR"));
    }

    @Test
    void tienePermisoDePropiedad_EmpresaMismaEmpresaPermitido() {
        UUID empresaId = UUID.randomUUID();

        assertTrue(authorizationService.tienePermisoDePropiedad(empresaId, empresaId, "EMPRESA"));
    }

    @Test
    void tienePermisoDePropiedad_EmpresaOtraEmpresaProhibido() {
        UUID empresaA = UUID.randomUUID();
        UUID empresaB = UUID.randomUUID();

        assertFalse(authorizationService.tienePermisoDePropiedad(empresaA, empresaB, "EMPRESA"));
    }

    @Test
    void tienePermisoDePropiedad_ReclutadorConClaimMismaEmpresaPermitido() {
        UUID reclutadorId = UUID.randomUUID();
        UUID empresaId = UUID.randomUUID();

        securityUtilsMock.when(SecurityUtils::getEmpresaIdClaim).thenReturn(empresaId);

        assertTrue(authorizationService.tienePermisoDePropiedad(reclutadorId, empresaId, "RECLUTADOR"));
    }

    @Test
    void tienePermisoDePropiedad_ReclutadorConClaimOtraEmpresaProhibido() {
        UUID reclutadorId = UUID.randomUUID();
        UUID empresaA = UUID.randomUUID();
        UUID empresaB = UUID.randomUUID();

        securityUtilsMock.when(SecurityUtils::getEmpresaIdClaim).thenReturn(empresaA);

        assertFalse(authorizationService.tienePermisoDePropiedad(reclutadorId, empresaB, "RECLUTADOR"));
    }

    @Test
    void tienePermisoDePropiedad_ReclutadorSinClaimMismaEmpresaPermitido() {
        UUID empresaId = UUID.randomUUID();

        securityUtilsMock.when(SecurityUtils::getEmpresaIdClaim).thenReturn(null);

        assertTrue(authorizationService.tienePermisoDePropiedad(empresaId, empresaId, "RECLUTADOR"));
    }

    @Test
    void tienePermisoDePropiedad_ReclutadorSinClaimOtraEmpresaProhibido() {
        UUID reclutadorId = UUID.randomUUID();
        UUID empresaB = UUID.randomUUID();

        securityUtilsMock.when(SecurityUtils::getEmpresaIdClaim).thenReturn(null);

        assertFalse(authorizationService.tienePermisoDePropiedad(reclutadorId, empresaB, "RECLUTADOR"));
    }

    @Test
    void tienePermisoDePropiedad_EstudianteOCandidatoProhibido() {
        UUID id = UUID.randomUUID();
        UUID empresaId = UUID.randomUUID();

        assertFalse(authorizationService.tienePermisoDePropiedad(id, empresaId, "ESTUDIANTE"));
        assertFalse(authorizationService.tienePermisoDePropiedad(id, empresaId, "PROFESIONAL"));
        assertFalse(authorizationService.tienePermisoDePropiedad(id, empresaId, "CANDIDATO"));
        assertFalse(authorizationService.tienePermisoDePropiedad(id, empresaId, "OTRO_ROL"));
        assertFalse(authorizationService.tienePermisoDePropiedad(id, empresaId, null));
    }

    @Test
    void tienePermisoDePropiedad_EmpresaPropietariaNull_RetornaFalse() {
        UUID id = UUID.randomUUID();

        assertFalse(authorizationService.tienePermisoDePropiedad(id, null, "ADMIN"));
    }
}

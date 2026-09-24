package com.elp.postulaciones_service.service;

import com.elp.postulaciones_service.exception.ForbiddenException;
import com.elp.postulaciones_service.model.Postulacion;
import com.elp.postulaciones_service.repository.PostulacionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IdorSecurityTest {

    @Mock
    private PostulacionRepository postulacionRepository;

    @org.mockito.Spy
    private com.elp.postulaciones_service.security.EmpresaAuthorizationService empresaAuthorizationService = new com.elp.postulaciones_service.security.EmpresaAuthorizationService();

    @InjectMocks
    private PostulacionServiceImpl postulacionService;

    private UUID postulacionUuid;
    private Postulacion postulacion;
    private UUID candidatoA;
    private UUID candidatoB;
    private UUID empresaA;
    private UUID empresaB;

    @BeforeEach
    void setUp() {
        postulacionUuid = UUID.randomUUID();
        candidatoA = UUID.randomUUID();
        candidatoB = UUID.randomUUID();
        empresaA = UUID.randomUUID();
        empresaB = UUID.randomUUID();

        postulacion = new Postulacion();
        postulacion.setUuid(postulacionUuid);
        postulacion.setCandidatoId(candidatoA);
        postulacion.setEmpresaId(empresaA);
    }

    @Test
    void estudianteNoPuedeVerPostulacionAjena() {
        when(postulacionRepository.findByUuid(postulacionUuid)).thenReturn(Optional.of(postulacion));

        assertThrows(ForbiddenException.class, () -> postulacionService.obtenerPostulacion(postulacionUuid, candidatoB, "ESTUDIANTE"));
    }

    @Test
    void reclutadorNoPuedeVerPostulacionOtraEmpresa() {
        when(postulacionRepository.findByUuid(postulacionUuid)).thenReturn(Optional.of(postulacion));

        assertThrows(ForbiddenException.class, () -> postulacionService.obtenerPostulacion(postulacionUuid, empresaB, "RECLUTADOR"));
    }

    @Test
    void estudianteNoPuedeRetirarPostulacionAjena() {
        when(postulacionRepository.findByUuid(postulacionUuid)).thenReturn(Optional.of(postulacion));

        assertThrows(ForbiddenException.class, () -> postulacionService.retirarPostulacion(postulacionUuid, candidatoB, "Motivo"));
    }

    @Test
    void estudianteNoPuedeDescargarCvAjeno() {
        when(postulacionRepository.findByUuid(postulacionUuid)).thenReturn(Optional.of(postulacion));

        assertThrows(ForbiddenException.class, () -> postulacionService.descargarCv(postulacionUuid, candidatoB, "ESTUDIANTE"));
    }

    @Test
    void empresaNoPuedeDescargarCvDeOtraEmpresa() {
        when(postulacionRepository.findByUuid(postulacionUuid)).thenReturn(Optional.of(postulacion));

        assertThrows(ForbiddenException.class, () -> postulacionService.descargarCv(postulacionUuid, empresaB, "EMPRESA"));
    }
}
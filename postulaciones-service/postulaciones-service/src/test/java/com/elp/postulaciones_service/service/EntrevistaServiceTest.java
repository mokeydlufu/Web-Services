package com.elp.postulaciones_service.service;

import com.elp.postulaciones_service.dto.entrevista.EntrevistaRequest;
import com.elp.postulaciones_service.dto.entrevista.EntrevistaResponse;
import com.elp.postulaciones_service.exception.BusinessException;
import com.elp.postulaciones_service.exception.ForbiddenException;
import com.elp.postulaciones_service.mapper.EntrevistaMapper;
import com.elp.postulaciones_service.model.Entrevista;
import com.elp.postulaciones_service.model.Postulacion;
import com.elp.postulaciones_service.model.enums.EstadoEntrevista;
import com.elp.postulaciones_service.model.enums.EstadoPostulacion;
import com.elp.postulaciones_service.model.enums.TipoEntrevista;
import com.elp.postulaciones_service.repository.AuditoriaPostulacionRepository;
import com.elp.postulaciones_service.repository.EntrevistaRepository;
import com.elp.postulaciones_service.repository.HistorialPostulacionRepository;
import com.elp.postulaciones_service.repository.PostulacionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EntrevistaServiceTest {

    @Mock
    private EntrevistaRepository entrevistaRepository;
    @Mock
    private PostulacionRepository postulacionRepository;
    @Mock
    private HistorialPostulacionRepository historialRepository;
    @Mock
    private AuditoriaPostulacionRepository auditoriaRepository;
    @Mock
    private EntrevistaMapper entrevistaMapper;

    @InjectMocks
    private EntrevistaServiceImpl entrevistaService;

    private UUID postulacionId;
    private UUID entrevistadorId;
    private Postulacion postulacion;
    private EntrevistaRequest request;

    @BeforeEach
    void setUp() {
        postulacionId = UUID.randomUUID();
        entrevistadorId = UUID.randomUUID();
        postulacion = new Postulacion();
        postulacion.setUuid(postulacionId);
        postulacion.setEstado(EstadoPostulacion.EN_REVISION);

        request = new EntrevistaRequest();
        request.setFechaHora(OffsetDateTime.now().plusDays(1));
        request.setDuracion(60);
        request.setTipo(TipoEntrevista.VIRTUAL);
        request.setUbicacionOEnlace("http://zoom.us");
    }

    @Test
    void crearEntrevistaExitosa() {
        when(postulacionRepository.findByUuid(postulacionId)).thenReturn(Optional.of(postulacion));
        when(entrevistaRepository.save(any(Entrevista.class))).thenReturn(new Entrevista());
        when(entrevistaMapper.toResponse(any())).thenReturn(EntrevistaResponse.builder().build());

        entrevistaService.crearEntrevista(postulacionId, entrevistadorId, request);
        verify(entrevistaRepository).save(any(Entrevista.class));
    }

    @Test
    void crearEntrevistaFechaPasada() {
        when(postulacionRepository.findByUuid(postulacionId)).thenReturn(Optional.of(postulacion));
        request.setFechaHora(OffsetDateTime.now().minusDays(1));

        assertThrows(BusinessException.class, () -> entrevistaService.crearEntrevista(postulacionId, entrevistadorId, request));
    }

    @Test
    void crearEntrevistaPostulacionRechazada() {
        postulacion.setEstado(EstadoPostulacion.RECHAZADA);
        when(postulacionRepository.findByUuid(postulacionId)).thenReturn(Optional.of(postulacion));

        assertThrows(BusinessException.class, () -> entrevistaService.crearEntrevista(postulacionId, entrevistadorId, request));
    }

    @Test
    void consultarEntrevistaAjena() {
        Entrevista entrevista = new Entrevista();
        entrevista.setPostulacion(postulacion);
        postulacion.setCandidatoId(UUID.randomUUID());
        UUID otroCandidato = UUID.randomUUID();

        when(entrevistaRepository.findByUuid(any())).thenReturn(Optional.of(entrevista));

        assertThrows(ForbiddenException.class, () -> entrevistaService.obtenerEntrevista(UUID.randomUUID(), otroCandidato, "CANDIDATO"));
    }

    @Test
    void cancelarEntrevistaExitosa() {
        Entrevista entrevista = new Entrevista();
        entrevista.setEstado(EstadoEntrevista.PROGRAMADA);
        when(entrevistaRepository.findByUuid(any())).thenReturn(Optional.of(entrevista));
        when(entrevistaRepository.save(any(Entrevista.class))).thenReturn(entrevista);

        entrevistaService.cancelarEntrevista(UUID.randomUUID(), entrevistadorId, "Motivo");
        verify(entrevistaRepository).save(any(Entrevista.class));
    }
}
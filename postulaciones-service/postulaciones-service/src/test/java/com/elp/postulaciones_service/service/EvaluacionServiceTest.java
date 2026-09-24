package com.elp.postulaciones_service.service;

import com.elp.postulaciones_service.dto.evaluacion.EvaluacionRequest;
import com.elp.postulaciones_service.dto.evaluacion.EvaluacionResponse;
import com.elp.postulaciones_service.exception.ForbiddenException;
import com.elp.postulaciones_service.mapper.EvaluacionMapper;
import com.elp.postulaciones_service.model.EvaluacionPostulacion;
import com.elp.postulaciones_service.model.Postulacion;
import com.elp.postulaciones_service.model.enums.EstadoPostulacion;
import com.elp.postulaciones_service.model.enums.RecomendacionEvaluacion;
import com.elp.postulaciones_service.repository.AuditoriaPostulacionRepository;
import com.elp.postulaciones_service.repository.EvaluacionPostulacionRepository;
import com.elp.postulaciones_service.repository.HistorialPostulacionRepository;
import com.elp.postulaciones_service.repository.PostulacionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EvaluacionServiceTest {

    @Mock
    private EvaluacionPostulacionRepository evaluacionRepository;
    @Mock
    private PostulacionRepository postulacionRepository;
    @Mock
    private HistorialPostulacionRepository historialRepository;
    @Mock
    private AuditoriaPostulacionRepository auditoriaRepository;
    @Mock
    private EvaluacionMapper evaluacionMapper;

    @InjectMocks
    private EvaluacionServiceImpl evaluacionService;

    private UUID postulacionId;
    private UUID evaluadorId;
    private Postulacion postulacion;
    private EvaluacionRequest request;

    @BeforeEach
    void setUp() {
        postulacionId = UUID.randomUUID();
        evaluadorId = UUID.randomUUID();
        postulacion = new Postulacion();
        postulacion.setUuid(postulacionId);
        postulacion.setEmpresaId(evaluadorId);
        postulacion.setEstado(EstadoPostulacion.ENTREVISTA);

        request = new EvaluacionRequest();
        request.setPuntaje(85);
        request.setRecomendacion(RecomendacionEvaluacion.RECOMENDADO);
    }

    @Test
    void crearEvaluacionExitosa() {
        when(postulacionRepository.findByUuid(postulacionId)).thenReturn(Optional.of(postulacion));
        when(evaluacionRepository.save(any(EvaluacionPostulacion.class))).thenReturn(new EvaluacionPostulacion());
        when(evaluacionMapper.toResponse(any())).thenReturn(EvaluacionResponse.builder().build());

        evaluacionService.crearEvaluacion(postulacionId, evaluadorId, request);
        verify(evaluacionRepository).save(any(EvaluacionPostulacion.class));
    }

    @Test
    void candidatoNoPuedeVerEvaluacion() {
        when(postulacionRepository.findByUuid(postulacionId)).thenReturn(Optional.of(postulacion));

        assertThrows(ForbiddenException.class, () -> 
            evaluacionService.listarEvaluacionesPorPostulacion(postulacionId, UUID.randomUUID(), "CANDIDATO", PageRequest.of(0, 10))
        );
    }

    @Test
    void reclutadorAutorizadoPuedeVerEvaluacion() {
        // La postulacion tiene empresaId = evaluadorId
        when(postulacionRepository.findByUuid(postulacionId)).thenReturn(Optional.of(postulacion));
        when(evaluacionRepository.findByPostulacion(any(), any())).thenReturn(Page.empty());

        evaluacionService.listarEvaluacionesPorPostulacion(postulacionId, evaluadorId, "RECLUTADOR", PageRequest.of(0, 10));
        verify(evaluacionRepository).findByPostulacion(any(), any());
    }

    @Test
    void reclutadorNoAutorizadoNoPuedeVerEvaluacion() {
        when(postulacionRepository.findByUuid(postulacionId)).thenReturn(Optional.of(postulacion));

        assertThrows(ForbiddenException.class, () -> 
            evaluacionService.listarEvaluacionesPorPostulacion(postulacionId, UUID.randomUUID(), "RECLUTADOR", PageRequest.of(0, 10))
        );
    }
}
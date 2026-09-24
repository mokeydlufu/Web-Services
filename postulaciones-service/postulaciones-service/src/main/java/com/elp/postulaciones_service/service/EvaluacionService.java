package com.elp.postulaciones_service.service;

import com.elp.postulaciones_service.dto.evaluacion.EvaluacionRequest;
import com.elp.postulaciones_service.dto.evaluacion.EvaluacionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Map;
import java.util.UUID;

public interface EvaluacionService {
    EvaluacionResponse crearEvaluacion(UUID postulacionId, UUID evaluadorId, EvaluacionRequest request);
    Page<EvaluacionResponse> listarEvaluacionesPorPostulacion(UUID postulacionId, UUID usuarioId, String rol, Pageable pageable);
    Page<EvaluacionResponse> listarEvaluacionesPorEmpresa(UUID empresaId, UUID usuarioId, String rol, Pageable pageable);
    EvaluacionResponse obtenerEvaluacion(UUID evaluacionId, UUID usuarioId, String rol);
    EvaluacionResponse actualizarEvaluacion(UUID evaluacionId, EvaluacionRequest request, UUID usuarioId);
    Map<String, Object> eliminarOCancelarEvaluacion(UUID evaluacionId, UUID usuarioId, String rol);
}
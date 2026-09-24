package com.elp.postulaciones_service.service;

import com.elp.postulaciones_service.dto.entrevista.EntrevistaRequest;
import com.elp.postulaciones_service.dto.entrevista.EntrevistaResponse;
import com.elp.postulaciones_service.model.enums.EstadoEntrevista;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface EntrevistaService {
    EntrevistaResponse crearEntrevista(UUID postulacionId, UUID entrevistadorId, EntrevistaRequest request);
    Page<EntrevistaResponse> listarEntrevistasPorPostulacion(UUID postulacionId, UUID usuarioId, String rol, Pageable pageable);
    Page<EntrevistaResponse> listarMisEntrevistas(UUID candidatoId, Pageable pageable);
    EntrevistaResponse obtenerEntrevista(UUID entrevistaId, UUID usuarioId, String rol);
    EntrevistaResponse actualizarEstadoEntrevista(UUID entrevistaId, EstadoEntrevista nuevoEstado, UUID usuarioId);
    void cancelarEntrevista(UUID entrevistaId, UUID usuarioId, String motivo);
}
package com.elp.postulaciones_service.service;

import com.elp.postulaciones_service.dto.entrevista.EntrevistaRequest;
import com.elp.postulaciones_service.dto.entrevista.EntrevistaResponse;
import com.elp.postulaciones_service.exception.BusinessException;
import com.elp.postulaciones_service.exception.ForbiddenException;
import com.elp.postulaciones_service.exception.InvalidStateTransitionException;
import com.elp.postulaciones_service.exception.ResourceNotFoundException;
import com.elp.postulaciones_service.mapper.EntrevistaMapper;
import com.elp.postulaciones_service.model.AuditoriaPostulacion;
import com.elp.postulaciones_service.model.Entrevista;
import com.elp.postulaciones_service.model.HistorialPostulacion;
import com.elp.postulaciones_service.model.Postulacion;
import com.elp.postulaciones_service.model.enums.EstadoEntrevista;
import com.elp.postulaciones_service.model.enums.EstadoPostulacion;
import com.elp.postulaciones_service.model.enums.TipoEntrevista;
import com.elp.postulaciones_service.repository.AuditoriaPostulacionRepository;
import com.elp.postulaciones_service.repository.EntrevistaRepository;
import com.elp.postulaciones_service.repository.HistorialPostulacionRepository;
import com.elp.postulaciones_service.repository.PostulacionRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EntrevistaServiceImpl implements EntrevistaService {

    private static final Logger log = LoggerFactory.getLogger(EntrevistaServiceImpl.class);

    private final EntrevistaRepository entrevistaRepository;
    private final PostulacionRepository postulacionRepository;
    private final HistorialPostulacionRepository historialRepository;
    private final AuditoriaPostulacionRepository auditoriaRepository;
    private final EstadoPostulacionService estadoPostulacionService;
    private final EntrevistaMapper entrevistaMapper;

    @Override
    @Transactional
    public EntrevistaResponse crearEntrevista(UUID postulacionId, UUID entrevistadorId, EntrevistaRequest request) {
        Postulacion postulacion = postulacionRepository.findByUuid(postulacionId)
                .orElseThrow(() -> new ResourceNotFoundException("Postulacion no encontrada"));

        validarAcceso(postulacion, entrevistadorId, com.elp.postulaciones_service.util.SecurityUtils.getRolUsuarioLogueado());
        validarPostulacionParaEntrevista(postulacion);
        
        if (request.getFechaHora().isBefore(OffsetDateTime.now())) {
            throw new BusinessException("No se puede programar una entrevista en el pasado");
        }

        Entrevista entrevista = Entrevista.builder()
                .postulacion(postulacion)
                .fechaHora(Timestamp.from(request.getFechaHora().toInstant()))
                .duracion(request.getDuracion())
                .tipo(request.getTipo())
                .creadoPor(entrevistadorId)
                .estado(EstadoEntrevista.PROGRAMADA)
                .observaciones(request.getObservaciones())
                .build();

        if (request.getTipo() == TipoEntrevista.VIRTUAL || request.getTipo() == TipoEntrevista.TELEFONICA) {
            entrevista.setEnlace(request.getUbicacionOEnlace());
        } else {
            entrevista.setUbicacion(request.getUbicacionOEnlace());
        }

        entrevista = entrevistaRepository.save(entrevista);

        if (postulacion.getEstado() == EstadoPostulacion.PRESELECCIONADA || postulacion.getEstado() == EstadoPostulacion.EN_REVISION) {
            EstadoPostulacion estadoAnt = postulacion.getEstado();
            postulacion.setEstado(EstadoPostulacion.ENTREVISTA);
            postulacionRepository.save(postulacion);
            
            registrarHistorial(postulacion, estadoAnt, EstadoPostulacion.ENTREVISTA, entrevistadorId, "Entrevista programada");
        }

        registrarAuditoria(entrevistadorId, "ENTREVISTA_CREADA", "Entrevista " + entrevista.getUuid() + " programada para postulacion " + postulacionId);
        log.info("Entrevista creada exitosamente: {} para postulacion {}", entrevista.getUuid(), postulacionId);

        return entrevistaMapper.toResponse(entrevista);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EntrevistaResponse> listarEntrevistasPorPostulacion(UUID postulacionId, UUID usuarioId, String rol, Pageable pageable) {
        Postulacion postulacion = postulacionRepository.findByUuid(postulacionId)
                .orElseThrow(() -> new ResourceNotFoundException("Postulacion no encontrada"));

        validarAcceso(postulacion, usuarioId, rol);

        return entrevistaRepository.findByPostulacion(postulacion, pageable).map(entrevistaMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EntrevistaResponse> listarMisEntrevistas(UUID candidatoId, Pageable pageable) {
        return entrevistaRepository.findByPostulacionCandidatoId(candidatoId, pageable).map(entrevistaMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public EntrevistaResponse obtenerEntrevista(UUID entrevistaId, UUID usuarioId, String rol) {
        Entrevista entrevista = entrevistaRepository.findByUuid(entrevistaId)
                .orElseThrow(() -> new ResourceNotFoundException("Entrevista no encontrada"));

        validarAcceso(entrevista.getPostulacion(), usuarioId, rol);
        return entrevistaMapper.toResponse(entrevista);
    }

    @Override
    @Transactional
    public EntrevistaResponse actualizarEstadoEntrevista(UUID entrevistaId, EstadoEntrevista nuevoEstado, UUID usuarioId) {
        Entrevista entrevista = entrevistaRepository.findByUuid(entrevistaId)
                .orElseThrow(() -> new ResourceNotFoundException("Entrevista no encontrada"));

        validarAcceso(entrevista.getPostulacion(), usuarioId, com.elp.postulaciones_service.util.SecurityUtils.getRolUsuarioLogueado());
        EstadoEntrevista estadoActual = entrevista.getEstado();
        validarTransicionEntrevista(estadoActual, nuevoEstado);

        entrevista.setEstado(nuevoEstado);
        entrevista = entrevistaRepository.save(entrevista);

        registrarAuditoria(usuarioId, "ENTREVISTA_ACTUALIZADA", "Estado de entrevista " + entrevistaId + " cambio a " + nuevoEstado);
        log.info("Entrevista {} cambio de estado a {}", entrevistaId, nuevoEstado);

        return entrevistaMapper.toResponse(entrevista);
    }

    @Override
    @Transactional
    public void cancelarEntrevista(UUID entrevistaId, UUID usuarioId, String motivo) {
        actualizarEstadoEntrevista(entrevistaId, EstadoEntrevista.CANCELADA, usuarioId);
        registrarAuditoria(usuarioId, "ENTREVISTA_CANCELADA", "Entrevista " + entrevistaId + " cancelada. Motivo: " + motivo);
    }

    private void validarTransicionEntrevista(EstadoEntrevista actual, EstadoEntrevista nuevo) {
        if (actual == nuevo) return;
        if (actual == EstadoEntrevista.CANCELADA) {
            throw new InvalidStateTransitionException("No se puede modificar una entrevista cancelada");
        }
        if (actual == EstadoEntrevista.REALIZADA) {
            throw new InvalidStateTransitionException("No se puede modificar el estado de una entrevista ya realizada");
        }
        boolean val = false;
        switch (actual) {
            case PROGRAMADA:
            case REPROGRAMADA:
                val = (nuevo == EstadoEntrevista.CONFIRMADA || nuevo == EstadoEntrevista.CANCELADA || nuevo == EstadoEntrevista.REPROGRAMADA);
                break;
            case CONFIRMADA:
                val = (nuevo == EstadoEntrevista.REALIZADA || nuevo == EstadoEntrevista.CANCELADA || nuevo == EstadoEntrevista.NO_ASISTIO);
                break;
        }
        if (!val) {
            throw new InvalidStateTransitionException("Transicion de entrevista de " + actual + " a " + nuevo + " es invalida");
        }
    }

    private void validarPostulacionParaEntrevista(Postulacion p) {
        EstadoPostulacion e = p.getEstado();
        if (e == EstadoPostulacion.RECHAZADA || e == EstadoPostulacion.RETIRADA || 
            e == EstadoPostulacion.CANCELADA || e == EstadoPostulacion.CERRADA) {
            throw new BusinessException("No se pueden crear entrevistas en una postulacion " + e.name());
        }
    }

    private void validarAcceso(Postulacion p, UUID usuarioId, String rol) {
        if ("ESTUDIANTE".equals(rol) || "PROFESIONAL".equals(rol) || "CANDIDATO".equals(rol)) {
            if (!p.getCandidatoId().equals(usuarioId)) {
                throw new ForbiddenException("No puedes acceder a las entrevistas de otra postulacion");
            }
        } else if ("EMPRESA".equals(rol) || "RECLUTADOR".equals(rol)) {
            if (!p.getEmpresaId().equals(usuarioId)) {
                throw new ForbiddenException("No tienes permiso sobre esta postulacion");
            }
        }
    }

    private void registrarHistorial(Postulacion postulacion, EstadoPostulacion estadoAnterior, EstadoPostulacion estadoNuevo, UUID usuarioId, String comentario) {
        HistorialPostulacion historial = HistorialPostulacion.builder()
                .postulacion(postulacion)
                .estadoAnterior(estadoAnterior)
                .estadoNuevo(estadoNuevo)
                .usuarioId(usuarioId)
                .comentario(comentario)
                .build();
        historialRepository.save(historial);
    }

    private void registrarAuditoria(UUID usuarioId, String accion, String descripcion) {
        AuditoriaPostulacion auditoria = AuditoriaPostulacion.builder()
                .usuarioId(usuarioId)
                .accion(accion)
                .descripcion(descripcion)
                .build();
        auditoriaRepository.save(auditoria);
    }
}
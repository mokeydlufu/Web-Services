package com.elp.postulaciones_service.service;

import com.elp.postulaciones_service.dto.evaluacion.EvaluacionRequest;
import com.elp.postulaciones_service.dto.evaluacion.EvaluacionResponse;
import com.elp.postulaciones_service.exception.BusinessException;
import com.elp.postulaciones_service.exception.ForbiddenException;
import com.elp.postulaciones_service.exception.ResourceNotFoundException;
import com.elp.postulaciones_service.mapper.EvaluacionMapper;
import com.elp.postulaciones_service.model.AuditoriaPostulacion;
import com.elp.postulaciones_service.model.EvaluacionPostulacion;
import com.elp.postulaciones_service.model.HistorialPostulacion;
import com.elp.postulaciones_service.model.Postulacion;
import com.elp.postulaciones_service.model.enums.EstadoPostulacion;
import com.elp.postulaciones_service.model.enums.RecomendacionEvaluacion;
import com.elp.postulaciones_service.util.SecurityUtils;
import com.elp.postulaciones_service.repository.AuditoriaPostulacionRepository;
import com.elp.postulaciones_service.repository.EvaluacionPostulacionRepository;
import com.elp.postulaciones_service.repository.HistorialPostulacionRepository;
import com.elp.postulaciones_service.repository.PostulacionRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EvaluacionServiceImpl implements EvaluacionService {

    private static final Logger log = LoggerFactory.getLogger(EvaluacionServiceImpl.class);

    private final EvaluacionPostulacionRepository evaluacionRepository;
    private final PostulacionRepository postulacionRepository;
    private final HistorialPostulacionRepository historialRepository;
    private final AuditoriaPostulacionRepository auditoriaRepository;
    private final EvaluacionMapper evaluacionMapper;

    @Override
    @Transactional
    public EvaluacionResponse crearEvaluacion(UUID postulacionId, UUID evaluadorId, EvaluacionRequest request) {
        Postulacion postulacion = postulacionRepository.findByUuid(postulacionId)
                .orElseThrow(() -> new ResourceNotFoundException("Postulacion no encontrada"));

        validarAccesoEvaluacion(postulacion, evaluadorId, SecurityUtils.getRolUsuarioLogueado());
        validarPostulacionParaEvaluacion(postulacion);

        // 1. Prohibir crear manualmente evaluaciones de screening IA
        if (request.getTipo() != null && "IA_SCREENING".equalsIgnoreCase(request.getTipo().trim())) {
            throw new BusinessException("No se permite crear evaluaciones de tipo Screening con IA de forma manual.");
        }

        String tipo = (request.getTipo() != null && !request.getTipo().isBlank())
                ? request.getTipo().trim().toUpperCase()
                : "PRUEBA_TECNICA";

        String titulo = (request.getTituloPrueba() != null && !request.getTituloPrueba().isBlank())
                ? request.getTituloPrueba().trim()
                : ("PSICOMETRICO".equals(tipo) ? "Test Psicométrico / Soft Skills"
                        : "ENTREVISTA_TECNICA".equals(tipo) ? "Entrevista Técnica" : "Prueba Técnica");

        // 2. Evitar duplicados: no permitir más de una evaluación activa con el mismo candidato + oferta + tipo
        List<EvaluacionPostulacion> activas = evaluacionRepository.findActiveByCandidatoOfertaAndTipo(
                postulacion.getCandidatoId(), postulacion.getOfertaId(), tipo);
        if (!activas.isEmpty()) {
            throw new BusinessException("Ya existe una evaluación activa de tipo " + tipo + " para este candidato en esta oferta.");
        }

        // 3. Determinar estado inicial
        String estadoInicial = "PENDIENTE";
        if (request.getPuntaje() != null && request.getPuntaje() > 0 &&
                request.getRecomendacion() != null && request.getRecomendacion() != RecomendacionEvaluacion.PENDIENTE) {
            estadoInicial = "COMPLETADA";
        } else if (request.getEstado() != null && !request.getEstado().isBlank()) {
            estadoInicial = request.getEstado().trim().toUpperCase();
        }

        // Exigir puntaje solamente al calificar/completar la evaluación
        if ("COMPLETADA".equalsIgnoreCase(estadoInicial) && request.getPuntaje() == null) {
            throw new BusinessException("El puntaje es obligatorio para registrar una evaluación en estado COMPLETADA.");
        }

        RecomendacionEvaluacion rec = request.getRecomendacion() != null 
                ? request.getRecomendacion() 
                : RecomendacionEvaluacion.PENDIENTE;

        EvaluacionPostulacion evaluacion = EvaluacionPostulacion.builder()
                .postulacion(postulacion)
                .evaluadorId(evaluadorId)
                .tipo(tipo)
                .tituloPrueba(titulo)
                .estado(estadoInicial)
                .puntaje(request.getPuntaje())
                .comentario(request.getComentario())
                .fortalezas(request.getFortalezas())
                .debilidades(request.getDebilidades())
                .recomendacion(rec)
                .build();

        evaluacion = evaluacionRepository.save(evaluacion);

        if (postulacion.getEstado() == EstadoPostulacion.ENTREVISTA) {
            EstadoPostulacion estadoAnt = postulacion.getEstado();
            postulacion.setEstado(EstadoPostulacion.EVALUACION);
            postulacionRepository.save(postulacion);
            
            registrarHistorial(postulacion, estadoAnt, EstadoPostulacion.EVALUACION, evaluadorId, "Evaluacion registrada");
        }

        registrarAuditoria(evaluadorId, "EVALUACION_CREADA", "Evaluacion " + evaluacion.getUuid() + " creada para postulacion " + postulacionId);
        log.info("Evaluacion {} ({}) creada por el reclutador/empresa {}", evaluacion.getUuid(), tipo, evaluadorId);

        return evaluacionMapper.toResponse(evaluacion);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EvaluacionResponse> listarEvaluacionesPorPostulacion(UUID postulacionId, UUID usuarioId, String rol, Pageable pageable) {
        Postulacion postulacion = postulacionRepository.findByUuid(postulacionId)
                .orElseThrow(() -> new ResourceNotFoundException("Postulacion no encontrada"));

        validarAccesoEvaluacion(postulacion, usuarioId, rol);

        return evaluacionRepository.findByPostulacion(postulacion, pageable).map(evaluacionMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EvaluacionResponse> listarEvaluacionesPorEmpresa(UUID empresaId, UUID usuarioId, String rol, Pageable pageable) {
        UUID targetEmpresaId = empresaId != null ? empresaId : usuarioId;
        if (!"ADMIN".equals(rol) && !"ADMINISTRADOR".equals(rol)) {
            if (!targetEmpresaId.equals(usuarioId)) {
                throw new ForbiddenException("No tienes permiso para ver evaluaciones de otra empresa");
            }
        }
        return evaluacionRepository.findByEmpresaId(targetEmpresaId, pageable).map(evaluacionMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public EvaluacionResponse obtenerEvaluacion(UUID evaluacionId, UUID usuarioId, String rol) {
        EvaluacionPostulacion evaluacion = evaluacionRepository.findByUuid(evaluacionId)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluacion no encontrada"));

        validarAccesoEvaluacion(evaluacion.getPostulacion(), usuarioId, rol);

        return evaluacionMapper.toResponse(evaluacion);
    }

    @Override
    @Transactional
    public EvaluacionResponse actualizarEvaluacion(UUID evaluacionId, EvaluacionRequest request, UUID usuarioId) {
        EvaluacionPostulacion evaluacion = evaluacionRepository.findByUuid(evaluacionId)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluacion no encontrada"));

        Postulacion postulacion = evaluacion.getPostulacion();
        validarAccesoEvaluacion(postulacion, usuarioId, SecurityUtils.getRolUsuarioLogueado());

        // Validar cambio de tipo para evitar duplicados
        if (request.getTipo() != null && !request.getTipo().isBlank()) {
            String nuevoTipo = request.getTipo().trim().toUpperCase();
            if ("IA_SCREENING".equalsIgnoreCase(nuevoTipo)) {
                throw new BusinessException("No se puede convertir una evaluación manual a Screening con IA.");
            }
            if (!nuevoTipo.equalsIgnoreCase(evaluacion.getTipo())) {
                List<EvaluacionPostulacion> activas = evaluacionRepository.findActiveByCandidatoOfertaAndTipo(
                        postulacion.getCandidatoId(), postulacion.getOfertaId(), nuevoTipo);
                boolean existeOtra = activas.stream().anyMatch(e -> !e.getUuid().equals(evaluacionId));
                if (existeOtra) {
                    throw new BusinessException("Ya existe otra evaluación activa de tipo " + nuevoTipo + " para este candidato en esta oferta.");
                }
                evaluacion.setTipo(nuevoTipo);
            }
        }

        if (request.getTituloPrueba() != null && !request.getTituloPrueba().isBlank()) {
            evaluacion.setTituloPrueba(request.getTituloPrueba().trim());
        }

        if (request.getPuntaje() != null) {
            evaluacion.setPuntaje(request.getPuntaje());
        }
        evaluacion.setComentario(request.getComentario());
        evaluacion.setFortalezas(request.getFortalezas());
        evaluacion.setDebilidades(request.getDebilidades());
        if (request.getRecomendacion() != null) {
            evaluacion.setRecomendacion(request.getRecomendacion());
        }

        // Si se califica, actualizar estado a COMPLETADA salvo que se indique otro estado explícito
        if (request.getEstado() != null && !request.getEstado().isBlank()) {
            evaluacion.setEstado(request.getEstado().trim().toUpperCase());
        } else if (request.getPuntaje() != null && request.getRecomendacion() != null && request.getRecomendacion() != RecomendacionEvaluacion.PENDIENTE) {
            evaluacion.setEstado("COMPLETADA");
        }

        // Exigir puntaje solamente al calificar/completar la evaluación
        if ("COMPLETADA".equalsIgnoreCase(evaluacion.getEstado()) && evaluacion.getPuntaje() == null) {
            throw new BusinessException("El puntaje es obligatorio para calificar o completar la evaluación.");
        }

        evaluacion = evaluacionRepository.save(evaluacion);
        registrarAuditoria(usuarioId, "EVALUACION_ACTUALIZADA", "Evaluacion " + evaluacionId + " actualizada");

        return evaluacionMapper.toResponse(evaluacion);
    }

    @Override
    @Transactional
    public Map<String, Object> eliminarOCancelarEvaluacion(UUID evaluacionId, UUID usuarioId, String rol) {
        EvaluacionPostulacion evaluacion = evaluacionRepository.findByUuid(evaluacionId)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluación no encontrada"));

        Postulacion postulacion = evaluacion.getPostulacion();
        validarAccesoEvaluacion(postulacion, usuarioId, rol);

        String estadoActual = evaluacion.getEstado() != null ? evaluacion.getEstado().toUpperCase() : "PENDIENTE";
        if (evaluacion.getEstado() == null && evaluacion.getRecomendacion() != null &&
                evaluacion.getRecomendacion() != RecomendacionEvaluacion.PENDIENTE &&
                evaluacion.getPuntaje() != null && evaluacion.getPuntaje() > 0) {
            estadoActual = "COMPLETADA";
        }

        Map<String, Object> resultado = new HashMap<>();

        // Condición 1 & 2:
        // Si está COMPLETADA: no eliminar físicamente; marcarla como CANCELADA para conservar historial.
        // Si está PENDIENTE o EN_PROGRESO: permitir eliminar físicamente.
        if ("COMPLETADA".equals(estadoActual)) {
            evaluacion.setEstado("CANCELADA");
            evaluacionRepository.save(evaluacion);
            registrarAuditoria(usuarioId, "EVALUACION_CANCELADA",
                    "Evaluación completada " + evaluacionId + " marcada como CANCELADA para conservar historial");
            log.info("Evaluación {} completada fue marcada como CANCELADA para conservar historial", evaluacionId);
            resultado.put("accion", "CANCELADA");
            resultado.put("mensaje", "La evaluación completada fue marcada como CANCELADA para conservar el historial.");
            resultado.put("estado", "CANCELADA");
        } else {
            evaluacionRepository.delete(evaluacion);
            registrarAuditoria(usuarioId, "EVALUACION_ELIMINADA",
                    "Evaluación " + evaluacionId + " eliminada físicamente");
            log.info("Evaluación {} en estado {} fue eliminada físicamente", evaluacionId, estadoActual);
            resultado.put("accion", "ELIMINADA");
            resultado.put("mensaje", "La evaluación fue eliminada correctamente.");
            resultado.put("estado", "ELIMINADA");
        }

        return resultado;
    }

    private void validarPostulacionParaEvaluacion(Postulacion p) {
        EstadoPostulacion e = p.getEstado();
        // Solo bloquear estados que ya no tienen sentido evaluar
        if (e == EstadoPostulacion.RETIRADA || e == EstadoPostulacion.CANCELADA || e == EstadoPostulacion.CERRADA) {
            throw new BusinessException("No se pueden evaluar postulaciones que estan en estado " + e.name());
        }
        // Permitir evaluar incluso RECHAZADA (para documentar razones) y todos los demás estados activos
    }

    private void validarAccesoEvaluacion(Postulacion p, UUID usuarioId, String rol) {
        if ("ESTUDIANTE".equals(rol) || "PROFESIONAL".equals(rol) || "CANDIDATO".equals(rol)) {
            throw new ForbiddenException("Los candidatos no tienen permiso para ver evaluaciones internas");
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
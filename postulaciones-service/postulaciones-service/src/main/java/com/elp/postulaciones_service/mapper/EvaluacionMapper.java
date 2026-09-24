package com.elp.postulaciones_service.mapper;

import com.elp.postulaciones_service.dto.evaluacion.EvaluacionResponse;
import com.elp.postulaciones_service.model.EvaluacionPostulacion;
import org.springframework.stereotype.Component;

import java.time.ZoneOffset;

@Component
public class EvaluacionMapper {
    public EvaluacionResponse toResponse(EvaluacionPostulacion evaluacion) {
        if (evaluacion == null) return null;
        return EvaluacionResponse.builder()
                .uuid(evaluacion.getUuid())
                .postulacionId(evaluacion.getPostulacion().getUuid())
                .evaluadorId(evaluacion.getEvaluadorId())
                .puntaje(evaluacion.getPuntaje())
                .comentario(evaluacion.getComentario())
                .fortalezas(evaluacion.getFortalezas())
                .debilidades(evaluacion.getDebilidades())
                .recomendacion(evaluacion.getRecomendacion())
                .fechaEvaluacion(evaluacion.getFechaEvaluacion() != null ? evaluacion.getFechaEvaluacion().toInstant().atOffset(ZoneOffset.UTC) : null)
                .tipo(evaluacion.getTipo() != null ? evaluacion.getTipo() : "PRUEBA_TECNICA")
                .tituloPrueba(evaluacion.getTituloPrueba() != null ? evaluacion.getTituloPrueba() : "Evaluación Técnica")
                .estado(evaluacion.getEstado() != null ? evaluacion.getEstado() : "PENDIENTE")
                .candidatoId(evaluacion.getPostulacion() != null ? evaluacion.getPostulacion().getCandidatoId() : null)
                .ofertaId(evaluacion.getPostulacion() != null ? evaluacion.getPostulacion().getOfertaId() : null)
                .build();
    }
}
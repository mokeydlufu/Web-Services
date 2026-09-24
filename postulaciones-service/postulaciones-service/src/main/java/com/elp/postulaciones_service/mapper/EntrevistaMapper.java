package com.elp.postulaciones_service.mapper;

import com.elp.postulaciones_service.dto.entrevista.EntrevistaResponse;
import com.elp.postulaciones_service.model.Entrevista;
import org.springframework.stereotype.Component;

import java.time.ZoneOffset;

@Component
public class EntrevistaMapper {
    public EntrevistaResponse toResponse(Entrevista entrevista) {
        if (entrevista == null) return null;
        return EntrevistaResponse.builder()
                .uuid(entrevista.getUuid())
                .postulacionId(entrevista.getPostulacion() != null ? entrevista.getPostulacion().getUuid() : null)
                .ofertaId(entrevista.getPostulacion() != null ? entrevista.getPostulacion().getOfertaId() : null)
                .entrevistadorId(entrevista.getCreadoPor())
                .fechaHora(entrevista.getFechaHora() != null ? entrevista.getFechaHora().toInstant().atOffset(ZoneOffset.UTC) : null)
                .duracion(entrevista.getDuracion())
                .tipo(entrevista.getTipo())
                .enlace(entrevista.getEnlace())
                .ubicacion(entrevista.getUbicacion())
                .estado(entrevista.getEstado())
                .observaciones(entrevista.getObservaciones())
                .fechaCreacion(entrevista.getFechaCreacion() != null ? entrevista.getFechaCreacion().toInstant().atOffset(ZoneOffset.UTC) : null)
                .fechaActualizacion(entrevista.getFechaActualizacion() != null ? entrevista.getFechaActualizacion().toInstant().atOffset(ZoneOffset.UTC) : null)
                .build();
    }
}
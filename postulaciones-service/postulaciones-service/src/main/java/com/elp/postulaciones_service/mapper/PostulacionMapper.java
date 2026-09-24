package com.elp.postulaciones_service.mapper;

import com.elp.postulaciones_service.dto.postulacion.HistorialPostulacionResponse;
import com.elp.postulaciones_service.dto.postulacion.PostulacionResponse;
import com.elp.postulaciones_service.model.HistorialPostulacion;
import com.elp.postulaciones_service.model.Postulacion;
import org.springframework.stereotype.Component;

@Component
public class PostulacionMapper {

    public PostulacionResponse toResponse(Postulacion postulacion) {
        if (postulacion == null) return null;
        
        PostulacionResponse res = new PostulacionResponse();
        res.setUuid(postulacion.getUuid());
        res.setCandidatoId(postulacion.getCandidatoId());
        res.setOfertaId(postulacion.getOfertaId());
        res.setEmpresaId(postulacion.getEmpresaId());
        res.setFechaPostulacion(postulacion.getFechaPostulacion());
        res.setEstado(postulacion.getEstado());
        res.setCartaPresentacion(postulacion.getCartaPresentacion());
        res.setGeneradaConIa(postulacion.getGeneradaConIa());
        res.setCvUrl(postulacion.getCvUrl());
        res.setObservaciones(postulacion.getObservaciones());
        res.setFechaActualizacion(postulacion.getFechaActualizacion());
        res.setFechaCierre(postulacion.getFechaCierre());
        
        // Mapear campos de evaluación IA
        res.setCumpleRequerimientos(postulacion.getCumpleRequerimientos());
        res.setPorcentajeCoincidencia(postulacion.getPorcentajeCoincidencia());
        res.setResumenIa(postulacion.getResumenIa());
        res.setHabilidadesEncontradas(postulacion.getHabilidadesEncontradas());
        res.setOrigenAnalisis(postulacion.getOrigenAnalisis());
        
        return res;
    }

    public HistorialPostulacionResponse toHistorialResponse(HistorialPostulacion historial) {
        if (historial == null) return null;

        HistorialPostulacionResponse res = new HistorialPostulacionResponse();
        res.setEstadoAnterior(historial.getEstadoAnterior());
        res.setEstadoNuevo(historial.getEstadoNuevo());
        res.setUsuarioId(historial.getUsuarioId());
        res.setFecha(historial.getFecha());
        res.setComentario(historial.getComentario());
        return res;
    }
}

package com.elp.postulaciones_service.dto.evaluacion;

import com.elp.postulaciones_service.model.enums.RecomendacionEvaluacion;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class EvaluacionResponse {
    private UUID uuid;
    private UUID postulacionId;
    private UUID evaluadorId;
    private Integer puntaje;
    private String comentario;
    private String fortalezas;
    private String debilidades;
    private RecomendacionEvaluacion recomendacion;
    private OffsetDateTime fechaEvaluacion;
    
    // Metadatos de la prueba
    private String tipo;
    private String tituloPrueba;
    private String estado;
    
    // Información de candidato y oferta
    private UUID candidatoId;
    private String candidatoNombre;
    private String candidatoEmail;
    private UUID ofertaId;
    private String ofertaTitulo;
}
package com.elp.postulaciones_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para almacenar el resultado estructurado de la evaluación de CV con IA
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResultadoEvaluacionDTO {
    
    /**
     * Indica si el candidato cumple con los requerimientos mínimos de la oferta
     */
    private boolean cumpleRequerimientos;
    
    /**
     * Porcentaje de coincidencia entre el CV y los requisitos (0-100)
     */
    private int porcentajeCoincidencia;
    
    /**
     * Resumen ejecutivo de la evaluación realizada por la IA
     */
    private String resumenEvaluacion;
    
    /**
     * Lista de habilidades y tecnologías encontradas en el CV
     */
    private String habilidadesEncontradas;

    /**
     * Origen del análisis: GEMINI o FALLBACK
     */
    @Builder.Default
    private String origen = "GEMINI";

    /**
     * Modelo de IA utilizado (ej. gemini-3.6-flash) o motivo si fue fallback
     */
    private String modeloUsado;

    /**
     * Detalle del error HTTP o excepción si Gemini falló
     */
    private String errorDetalle;
}


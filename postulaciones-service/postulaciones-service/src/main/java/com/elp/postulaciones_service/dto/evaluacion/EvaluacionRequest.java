package com.elp.postulaciones_service.dto.evaluacion;

import com.elp.postulaciones_service.model.enums.RecomendacionEvaluacion;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class EvaluacionRequest {
    @Min(value = 0, message = "El puntaje no puede ser menor a 0")
    @Max(value = 100, message = "El puntaje no puede ser mayor a 100")
    private Integer puntaje;

    private String comentario;
    private String fortalezas;
    private String debilidades;

    private RecomendacionEvaluacion recomendacion;

    private String tipo;
    private String tituloPrueba;
    private String estado;
}
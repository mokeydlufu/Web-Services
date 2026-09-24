package com.elp.postulaciones_service.dto.externo;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class OfertaResumenDTO {
    private UUID ofertaId;
    private UUID empresaId;
    private String titulo;
    private String estado;
    private Boolean aceptaPostulaciones;
    
    // Campos adicionales para evaluación con IA
    private String descripcion;
    private List<String> requisitos;
    private String areaProfesional;
    private String nivelExperiencia;
    private String modalidad;
}


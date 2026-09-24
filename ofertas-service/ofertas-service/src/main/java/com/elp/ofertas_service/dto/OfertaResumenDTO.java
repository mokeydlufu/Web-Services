package com.elp.ofertas_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfertaResumenDTO {
    private UUID ofertaId;
    private UUID empresaId;
    private String titulo;
    private String estado;
    private Boolean aceptaPostulaciones;

    // Campos para evaluación y screening con IA
    private String descripcion;
    private List<String> requisitos;
    private String areaProfesional;
    private String nivelExperiencia;
    private String modalidad;
}


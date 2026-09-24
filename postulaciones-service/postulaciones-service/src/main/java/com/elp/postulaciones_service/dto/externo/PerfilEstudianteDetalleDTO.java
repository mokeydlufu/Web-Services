package com.elp.postulaciones_service.dto.externo;

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
public class PerfilEstudianteDetalleDTO {
    private UUID uuid;
    private String nombreCompleto;
    private String email;
    private String carrera;
    private String biografia;
    private String ubicacion;
    private List<String> habilidades;
    private List<String> experiencias;
    private List<String> educacion;
    private List<String> proyectos;
}

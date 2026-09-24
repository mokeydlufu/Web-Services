package com.elp.ofertas_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmpleoPublicoDTO {
    private String id;
    private String titulo;
    private String empresa;
    private String ubicacion;
    private String descripcion;
    private String salario;
    private String tipoEmpleo;
    private String modalidad;
    private String nivelExperiencia;
    private String fechaPublicacion;
    private String origen;        // "EMPLEAPRO" o "JOOBLE"
    private boolean externa;       // true si es externa, false si es de EmpleaPro
    private String urlExterna;     // URL original de postulación si es externa
    private String logoUrl;        // URL del logo real proporcionado por API

}

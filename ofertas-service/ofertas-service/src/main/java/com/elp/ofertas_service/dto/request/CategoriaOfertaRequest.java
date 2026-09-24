package com.elp.ofertas_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CategoriaOfertaRequest {
    @NotBlank
    private String nombre;
    private String descripcion;
    private Boolean activo;
}
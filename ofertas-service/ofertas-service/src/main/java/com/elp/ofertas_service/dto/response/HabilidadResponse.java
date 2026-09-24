package com.elp.ofertas_service.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class HabilidadResponse {
    private UUID id;
    private String nombre;
    private String descripcion;
    private Boolean activo;
}
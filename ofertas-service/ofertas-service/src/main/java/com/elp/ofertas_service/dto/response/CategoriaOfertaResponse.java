package com.elp.ofertas_service.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class CategoriaOfertaResponse {
    private UUID id;
    private String nombre;
    private String descripcion;
    private Boolean activo;
    private OffsetDateTime fechaCreacion;
    private OffsetDateTime fechaActualizacion;
}
package com.elp.postulaciones_service.dto.postulacion;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class PostulacionRequest {

    @NotNull(message = "El ID de la oferta es obligatorio")
    private UUID ofertaId;

    private UUID empresaId;

    private String cartaPresentacion;
    private Boolean generadaConIa;
    private String cvUrl;
}

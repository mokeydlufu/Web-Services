package com.elp.postulaciones_service.dto.ia;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerarCartaIaRequest {

    @NotNull(message = "El ID de la oferta es obligatorio")
    private UUID ofertaId;

    private UUID estudianteId;
}

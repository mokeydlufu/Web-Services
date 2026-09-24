package com.elp.ofertas_service.dto.response;

import com.elp.ofertas_service.enums.EstadoOferta;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class OfertaPostulacionResponse {
    private UUID ofertaId;
    private UUID empresaId;
    private EstadoOferta estado;
    private Boolean aceptaPostulaciones;
    private OffsetDateTime fechaVencimiento;
    private Boolean puedePostular;
}
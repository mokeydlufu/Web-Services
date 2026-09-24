package com.elp.postulaciones_service.dto.entrevista;

import com.elp.postulaciones_service.model.enums.EstadoEntrevista;
import com.elp.postulaciones_service.model.enums.TipoEntrevista;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class EntrevistaResponse {
    private UUID uuid;
    private UUID postulacionId;
    private UUID ofertaId;
    private UUID entrevistadorId;
    private OffsetDateTime fechaHora;
    private Integer duracion;
    private TipoEntrevista tipo;
    private String enlace;
    private String ubicacion;
    private EstadoEntrevista estado;
    private String observaciones;
    private OffsetDateTime fechaCreacion;
    private OffsetDateTime fechaActualizacion;
}
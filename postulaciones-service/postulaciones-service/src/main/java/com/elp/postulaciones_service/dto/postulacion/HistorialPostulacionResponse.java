package com.elp.postulaciones_service.dto.postulacion;

import com.elp.postulaciones_service.model.enums.EstadoPostulacion;
import lombok.Data;

import java.sql.Timestamp;
import java.util.UUID;

@Data
public class HistorialPostulacionResponse {
    private EstadoPostulacion estadoAnterior;
    private EstadoPostulacion estadoNuevo;
    private UUID usuarioId;
    private Timestamp fecha;
    private String comentario;
}

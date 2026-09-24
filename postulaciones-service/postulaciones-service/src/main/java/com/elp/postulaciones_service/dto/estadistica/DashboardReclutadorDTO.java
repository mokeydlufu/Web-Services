package com.elp.postulaciones_service.dto.estadistica;

import lombok.Data;

@Data
public class DashboardReclutadorDTO {
    private long totalPostulantes;
    private long enRevision;
    private long entrevistas;
    private long seleccionados;
    private long rechazados;
}

package com.elp.postulaciones_service.dto.estadistica;

import lombok.Data;

@Data
public class DashboardPostulanteDTO {
    private long totalPostulaciones;
    private long enRevision;
    private long entrevistas;
    private long seleccionadas;
    private long rechazadas;
    private long retiradas;
}

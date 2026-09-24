package com.elp.postulaciones_service.dto.entrevista;

import com.elp.postulaciones_service.model.enums.TipoEntrevista;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.OffsetDateTime;

@Data
public class EntrevistaRequest {
    @NotNull(message = "La fecha y hora son obligatorias")
    @Future(message = "La fecha de la entrevista debe ser en el futuro")
    private OffsetDateTime fechaHora;

    @NotNull(message = "El tipo de entrevista es obligatorio")
    private TipoEntrevista tipo;

    @NotNull(message = "La modalidad (enlace o ubicacion) es obligatoria")
    private String ubicacionOEnlace;

    @NotNull(message = "La duracion es obligatoria")
    @Min(value = 1, message = "La duracion debe ser mayor a 0")
    private Integer duracion;

    private String observaciones;
}
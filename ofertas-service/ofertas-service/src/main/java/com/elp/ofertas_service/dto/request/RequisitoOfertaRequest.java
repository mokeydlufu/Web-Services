package com.elp.ofertas_service.dto.request;

import com.elp.ofertas_service.enums.TipoRequisito;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RequisitoOfertaRequest {
    @NotBlank(message = "La descripcion es obligatoria")
    private String descripcion;

    @NotNull(message = "El tipo es obligatorio")
    private TipoRequisito tipo;

    @NotNull(message = "El campo obligatorio es requerido")
    private Boolean obligatorio;

    private String nivel;
}
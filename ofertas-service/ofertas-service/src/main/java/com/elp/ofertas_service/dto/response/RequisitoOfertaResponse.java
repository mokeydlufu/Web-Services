package com.elp.ofertas_service.dto.response;

import com.elp.ofertas_service.enums.TipoRequisito;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class RequisitoOfertaResponse {
    private UUID id;
    private String descripcion;
    private TipoRequisito tipo;
    private Boolean obligatorio;
    private String nivel;
}
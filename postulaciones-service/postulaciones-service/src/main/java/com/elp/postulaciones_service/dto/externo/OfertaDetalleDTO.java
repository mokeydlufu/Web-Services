package com.elp.postulaciones_service.dto.externo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfertaDetalleDTO {
    private UUID id;
    private UUID empresaId;
    private String titulo;
    private String descripcion;
    private String areaProfesional;
    private String nivelExperiencia;
    private String modalidad;
    private String tipoContrato;
    private String ubicacion;
    private List<RequisitoItemDTO> requisitos;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RequisitoItemDTO {
        private String descripcion;
        private String tipo;
        private Boolean obligatorio;
        private String nivel;
    }
}

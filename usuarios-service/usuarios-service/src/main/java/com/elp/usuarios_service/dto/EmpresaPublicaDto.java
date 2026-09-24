package com.elp.usuarios_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmpresaPublicaDto {
    private UUID id;
    private String razonSocial;
    private String nombreComercial;
    private String logo;
    private String descripcion;
    private String sitioWeb;
    private String industria;
    private String tamano;
    private String ubicacion;
    private String estadoVerificacion;
}

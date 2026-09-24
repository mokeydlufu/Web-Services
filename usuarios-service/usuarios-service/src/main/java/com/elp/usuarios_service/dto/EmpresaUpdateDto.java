package com.elp.usuarios_service.dto;

import lombok.Data;

@Data
public class EmpresaUpdateDto {
    private String nombreComercial;
    private String descripcion;
    private String sitioWeb;
    private String industria;
    private String tamano;
    private String emailCorporativo;
    private String direccion;
    private String ubicacion;
    private String telefono;
}

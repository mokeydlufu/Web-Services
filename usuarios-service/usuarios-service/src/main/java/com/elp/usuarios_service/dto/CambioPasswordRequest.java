package com.elp.usuarios_service.dto;

import lombok.Data;

@Data
public class CambioPasswordRequest {
    private String contrasenaActual;
    private String contrasenaNueva;
}

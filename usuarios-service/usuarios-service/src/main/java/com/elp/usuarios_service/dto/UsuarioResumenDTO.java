package com.elp.usuarios_service.dto;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class UsuarioResumenDTO {
    private UUID uuid;
    private String nombreCompleto;
    private String email;
    private String fotoPerfil;
    private String rol;
}

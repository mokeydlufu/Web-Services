package com.elp.postulaciones_service.dto.externo;

import lombok.Data;
import java.util.UUID;

@Data
public class UsuarioResumenDTO {
    private UUID uuid;
    private String nombreCompleto;
    private String email;
    private String fotoPerfil;
    private String rol;
}

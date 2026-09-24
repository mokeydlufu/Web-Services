package com.elp.usuarios_service.dto;

import com.elp.usuarios_service.model.enums.EstadoPerfil;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class PerfilResponseDTO {
    private UUID id;
    private String email;
    private String rol;
    private String nombreParaMostrar;
    private Integer porcentajeCompletitud;
    private EstadoPerfil estadoPerfil;
    private List<String> motivosPendientes;
    private Boolean puedeAccionar; 
}

package com.elp.usuarios_service.dto;

import com.elp.usuarios_service.model.enums.EstadoCuenta;
import com.elp.usuarios_service.model.enums.Rol;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UsuarioResponseDTO {
    private UUID id;
    private String email;
    private Rol rol;
    private String nombre; // Nombres o Razon social según el caso
    private EstadoCuenta estadoCuenta;
    private Boolean emailVerificado;
}

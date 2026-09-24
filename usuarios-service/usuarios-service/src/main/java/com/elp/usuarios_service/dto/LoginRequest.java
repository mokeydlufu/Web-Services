package com.elp.usuarios_service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LoginRequest {
    @NotBlank(message = "El email es requerido")
    @Email(message = "Formato de email inválido")
    private String email;

    @NotBlank(message = "La contraseña es requerida")
    private String password;
}

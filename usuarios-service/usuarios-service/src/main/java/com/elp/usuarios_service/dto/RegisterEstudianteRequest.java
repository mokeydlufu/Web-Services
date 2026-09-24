package com.elp.usuarios_service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegisterEstudianteRequest {
    @NotBlank(message = "El email es requerido")
    @Email(message = "Formato de email inválido")
    private String email;

    @NotBlank(message = "La contraseña es requerida")
    @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
    private String password;

    private String telefonoWhatsapp;

    @NotBlank(message = "El DNI es requerido")
    @Size(min = 8, max = 8, message = "El DNI debe tener 8 dígitos")
    private String dni;

    @NotBlank(message = "Los nombres son requeridos")
    private String nombres;

    @NotBlank(message = "Los apellidos son requeridos")
    private String apellidos;

    private String institucionEducativa;
    private String carrera;
    private Integer cicloActual;
    private List<String> habilidadesTecnicas;
    private String enlacePortafolio;
    private String urlCvPdf;
}

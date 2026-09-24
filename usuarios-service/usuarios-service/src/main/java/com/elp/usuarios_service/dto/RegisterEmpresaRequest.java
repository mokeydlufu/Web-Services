package com.elp.usuarios_service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegisterEmpresaRequest {
    @NotBlank(message = "El email es requerido")
    @Email(message = "Formato de email inválido")
    private String email;

    @NotBlank(message = "La contraseña es requerida")
    @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
    private String password;

    private String telefonoWhatsapp;

    @NotBlank(message = "El RUC es requerido")
    @Size(min = 11, max = 11, message = "El RUC debe tener 11 dígitos")
    private String ruc;

    @NotBlank(message = "La razón social es requerida")
    private String razonSocial;

    private String nombreComercial;
    private String sectorIndustrial;
    private String ubicacionCiudad;
    private String sitioWeb;
}

package com.elp.usuarios_service.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class DniConsultaResponseDTO {
    private Boolean success;
    private String message;
    private String dni;
    private String nombres;
    private String apellidoPaterno;
    private String apellidoMaterno;
    private String codVerifica;
    private String nombreCompleto;

    @com.fasterxml.jackson.annotation.JsonProperty("nombre")
    private String nombre;

    @com.fasterxml.jackson.annotation.JsonProperty("numeroDocumento")
    private String numeroDocumento;

    @com.fasterxml.jackson.annotation.JsonProperty("cliente")
    private String cliente;

    @com.fasterxml.jackson.annotation.JsonProperty("apellido_paterno")
    private String apellidoPaternoSnake;

    @com.fasterxml.jackson.annotation.JsonProperty("apellido_materno")
    private String apellidoMaternoSnake;

    @com.fasterxml.jackson.annotation.JsonProperty("dv")
    private String dv;

    @com.fasterxml.jackson.annotation.JsonProperty("mensaje")
    private String mensaje;

    @com.fasterxml.jackson.annotation.JsonProperty("code")
    private String code;

    @com.fasterxml.jackson.annotation.JsonProperty("data")
    private java.util.Map<String, Object> data;
}
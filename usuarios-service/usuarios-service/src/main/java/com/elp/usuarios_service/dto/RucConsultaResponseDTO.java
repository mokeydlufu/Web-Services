package com.elp.usuarios_service.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class RucConsultaResponseDTO {
    private Boolean success;
    private String message;
    private String ruc;
    private String razonSocial;
    private String nombreComercial;
    private List<String> telefonos;
    private String estado;
    private String condicion;
    private String direccion;
    private String departamento;
    private String provincia;
    private String distrito;
    private String ubigeo;
    private String capital;

    @com.fasterxml.jackson.annotation.JsonProperty("nombre")
    private String nombre;

    @com.fasterxml.jackson.annotation.JsonProperty("numeroDocumento")
    private String numeroDocumento;

    @com.fasterxml.jackson.annotation.JsonProperty("razon_social")
    private String razonSocialSnake;

    @com.fasterxml.jackson.annotation.JsonProperty("mensaje")
    private String mensaje;

    @com.fasterxml.jackson.annotation.JsonProperty("code")
    private String code;

    @com.fasterxml.jackson.annotation.JsonProperty("data")
    private java.util.Map<String, Object> data;
}
package com.elp.usuarios_service.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.sql.Timestamp;

@Entity
@Table(name = "empresas")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Empresa extends UsuarioBase {

    @Column(length = 11, unique = true, nullable = false)
    private String ruc;

    @Column(name = "razon_social", nullable = false)
    private String razonSocial;

    @Column(name = "nombre_comercial")
    private String nombreComercial;

    private String logo;
    private String descripcion;

    @Column(name = "sitio_web")
    private String sitioWeb;

    private String industria;
    private String tamano;

    @Column(name = "email_corporativo")
    private String emailCorporativo;

    private String direccion;
    private String ubicacion;

    @Builder.Default
    @Column(name = "estado_verificacion", nullable = false)
    private String estadoVerificacion = "PENDIENTE";

    @Column(name = "fecha_verificacion")
    private Timestamp fechaVerificacion;

    @Column(name = "motivo_rechazo", columnDefinition = "TEXT")
    private String motivoRechazo;

    @PrePersist
    public void prePersistEmpresa() {
        if (estadoVerificacion == null) {
            estadoVerificacion = "PENDIENTE";
        }
    }
}

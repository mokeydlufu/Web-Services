package com.elp.usuarios_service.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Date;
import java.util.UUID;

@Entity
@Table(name = "certificaciones")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Certificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "usuario_id", nullable = false)
    private UUID usuarioId;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String institucion;

    @Column(name = "fecha_obtencion")
    private Date fechaObtencion;

    @Column(name = "fecha_expiracion")
    private Date fechaExpiracion;

    @Column(name = "codigo_credencial")
    private String codigoCredencial;

    @Column(name = "url_verificacion")
    private String urlVerificacion;
}

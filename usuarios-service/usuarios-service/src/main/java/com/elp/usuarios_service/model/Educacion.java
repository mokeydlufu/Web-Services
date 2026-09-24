package com.elp.usuarios_service.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Date;
import java.util.UUID;

@Entity
@Table(name = "educacion")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Educacion {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "usuario_id", nullable = false)
    private UUID usuarioId;

    @Column(nullable = false)
    private String institucion;

    @Column(nullable = false)
    private String carrera;

    private String grado;

    @Column(name = "fecha_inicio", nullable = false)
    private Date fechaInicio;

    @Column(name = "fecha_fin")
    private Date fechaFin;

    @Builder.Default
    private Boolean actual = false;

    @Column(columnDefinition = "TEXT")
    private String descripcion;
}

package com.elp.usuarios_service.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.sql.Timestamp;
import java.util.UUID;

@Entity
@Table(name = "auditoria_usuarios")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditoriaUsuario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "usuario_id", nullable = false)
    private UUID usuarioId;

    @Column(nullable = false)
    private String accion;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Timestamp fecha;

    private String ip;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(columnDefinition = "TEXT")
    private String descripcion;
}

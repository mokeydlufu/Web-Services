package com.elp.usuarios_service.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;
import java.util.UUID;

@Entity
@Table(name = "sesiones_usuario")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SesionUsuario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private UsuarioBase usuario;

    private String ip;

    @Column(name = "user_agent")
    private String userAgent;

    private String dispositivo;

    @Column(name = "fecha_inicio", nullable = false)
    private Timestamp fechaInicio;

    @Column(name = "ultimo_acceso")
    private Timestamp ultimoAcceso;

    @Column(name = "fecha_expiracion", nullable = false)
    private Timestamp fechaExpiracion;

    @Builder.Default
    private Boolean activa = true;
}

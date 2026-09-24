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
@Table(name = "email_verification_tokens")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailVerificationToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private UsuarioBase usuario;

    @Column(name = "token_hash", nullable = false, unique = true)
    private String tokenHash;

    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private Timestamp fechaCreacion;

    @Column(name = "fecha_expiracion", nullable = false)
    private Timestamp fechaExpiracion;

    @Builder.Default
    private Boolean usado = false;

    @Column(name = "fecha_uso")
    private Timestamp fechaUso;
}

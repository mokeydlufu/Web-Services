package com.elp.usuarios_service.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.elp.usuarios_service.model.enums.EstadoCuenta;
import com.elp.usuarios_service.model.enums.Rol;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.sql.Timestamp;
import java.util.UUID;

@Entity
@Table(name = "usuarios")
@Inheritance(strategy = InheritanceType.JOINED)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public abstract class UsuarioBase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false, updatable = false)
    @Builder.Default
    private UUID uuid = UUID.randomUUID();

    @Column(unique = true, nullable = false)
    private String email;

    @JsonIgnore
    @Column(nullable = false)
    private String password;

    private String telefono;

    @Column(name = "foto_perfil")
    private String fotoPerfil;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Rol rol;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_cuenta", nullable = false)
    @Builder.Default
    private EstadoCuenta estadoCuenta = EstadoCuenta.PENDIENTE_VERIFICACION;

    @Column(name = "email_verificado")
    @Builder.Default
    private Boolean emailVerificado = false;

    @Column(name = "telefono_verificado")
    @Builder.Default
    private Boolean telefonoVerificado = false;

    @Builder.Default
    private Boolean activo = true;

    @Builder.Default
    private Boolean bloqueado = false;

    @Column(name = "porcentaje_completitud")
    @Builder.Default
    private Integer porcentajeCompletitud = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_perfil")
    @Builder.Default
    private com.elp.usuarios_service.model.enums.EstadoPerfil estadoPerfil = com.elp.usuarios_service.model.enums.EstadoPerfil.INCOMPLETO;

    @CreationTimestamp
    @Column(name = "fecha_registro", updatable = false)
    private Timestamp fechaRegistro;

    @UpdateTimestamp
    @Column(name = "fecha_actualizacion")
    private Timestamp fechaActualizacion;

    @Column(name = "ultimo_acceso")
    private Timestamp ultimoAcceso;

    @Column(name = "fecha_eliminacion")
    private Timestamp fechaEliminacion;

    @PrePersist
    public void prePersist() {
        if (uuid == null) {
            uuid = UUID.randomUUID();
        }
        if (estadoCuenta == null) {
            estadoCuenta = EstadoCuenta.PENDIENTE_VERIFICACION;
        }
        if (emailVerificado == null) emailVerificado = false;
        if (telefonoVerificado == null) telefonoVerificado = false;
        if (activo == null) activo = true;
        if (bloqueado == null) bloqueado = false;
        if (porcentajeCompletitud == null) porcentajeCompletitud = 0;
        if (estadoPerfil == null) estadoPerfil = com.elp.usuarios_service.model.enums.EstadoPerfil.INCOMPLETO;
    }
}

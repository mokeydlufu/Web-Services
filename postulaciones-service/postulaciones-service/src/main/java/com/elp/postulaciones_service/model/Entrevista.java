package com.elp.postulaciones_service.model;

import com.elp.postulaciones_service.model.enums.EstadoEntrevista;
import com.elp.postulaciones_service.model.enums.TipoEntrevista;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.sql.Timestamp;
import java.util.UUID;

@Entity
@Table(name = "entrevistas", indexes = {
    @Index(name = "idx_entrevista_postulacion", columnList = "postulacion_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Entrevista {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false, updatable = false)
    @Builder.Default
    private UUID uuid = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "postulacion_id", nullable = false)
    private Postulacion postulacion;

    @Column(name = "fecha_hora", nullable = false)
    private Timestamp fechaHora;

    @Column(nullable = false)
    private Integer duracion; // en minutos

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoEntrevista tipo;

    private String ubicacion;
    private String enlace;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EstadoEntrevista estado = EstadoEntrevista.PROGRAMADA;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "creado_por", nullable = false)
    private UUID creadoPor;

    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private Timestamp fechaCreacion;

    @UpdateTimestamp
    @Column(name = "fecha_actualizacion")
    private Timestamp fechaActualizacion;

    @PrePersist
    public void prePersist() {
        if (uuid == null) {
            uuid = UUID.randomUUID();
        }
        if (estado == null) {
            estado = EstadoEntrevista.PROGRAMADA;
        }
    }
}

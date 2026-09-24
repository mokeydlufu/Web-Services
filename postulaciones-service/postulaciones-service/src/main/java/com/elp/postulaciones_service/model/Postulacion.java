package com.elp.postulaciones_service.model;

import com.elp.postulaciones_service.model.enums.EstadoPostulacion;
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
@Table(name = "postulaciones", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"candidato_id", "oferta_id"})
}, indexes = {
    @Index(name = "idx_candidato", columnList = "candidato_id"),
    @Index(name = "idx_oferta", columnList = "oferta_id"),
    @Index(name = "idx_empresa", columnList = "empresa_id"),
    @Index(name = "idx_estado", columnList = "estado")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Postulacion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false, updatable = false)
    @Builder.Default
    private UUID uuid = UUID.randomUUID();

    @Column(name = "candidato_id", nullable = false)
    private UUID candidatoId;

    @Column(name = "oferta_id", nullable = false)
    private UUID ofertaId;

    @Column(name = "empresa_id", nullable = false)
    private UUID empresaId;

    @CreationTimestamp
    @Column(name = "fecha_postulacion", updatable = false)
    private Timestamp fechaPostulacion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EstadoPostulacion estado = EstadoPostulacion.ENVIADA;

    @Column(name = "carta_presentacion", columnDefinition = "TEXT")
    private String cartaPresentacion;

    @Column(name = "generada_con_ia")
    @Builder.Default
    private Boolean generadaConIa = false;

    @Column(name = "cv_url")
    private String cvUrl;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    // Campos de evaluación con IA
    @Column(name = "cumple_requerimientos")
    private Boolean cumpleRequerimientos;

    @Column(name = "porcentaje_coincidencia")
    private Integer porcentajeCoincidencia;

    @Column(name = "resumen_ia", columnDefinition = "TEXT")
    private String resumenIa;

    @Column(name = "habilidades_encontradas", columnDefinition = "TEXT")
    private String habilidadesEncontradas;

    @Column(name = "origen_analisis")
    private String origenAnalisis;

    @UpdateTimestamp
    @Column(name = "fecha_actualizacion")
    private Timestamp fechaActualizacion;

    @Column(name = "fecha_cierre")
    private Timestamp fechaCierre;

    @PrePersist
    public void prePersist() {
        if (uuid == null) {
            uuid = UUID.randomUUID();
        }
        if (estado == null) {
            estado = EstadoPostulacion.ENVIADA;
        }
    }
}

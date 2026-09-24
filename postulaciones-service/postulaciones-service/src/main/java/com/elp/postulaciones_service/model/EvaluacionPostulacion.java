package com.elp.postulaciones_service.model;

import com.elp.postulaciones_service.model.enums.RecomendacionEvaluacion;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.sql.Timestamp;
import java.util.UUID;

@Entity
@Table(name = "evaluaciones", indexes = {
    @Index(name = "idx_evaluacion_postulacion", columnList = "postulacion_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluacionPostulacion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false, updatable = false)
    @Builder.Default
    private UUID uuid = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "postulacion_id", nullable = false)
    private Postulacion postulacion;

    @Column(name = "evaluador_id", nullable = false)
    private UUID evaluadorId;

    @Column(name = "tipo", length = 50)
    @Builder.Default
    private String tipo = "PRUEBA_TECNICA";

    @Column(name = "titulo_prueba")
    private String tituloPrueba;

    @Column(name = "estado", length = 30)
    @Builder.Default
    private String estado = "PENDIENTE";

    @Column(name = "puntaje")
    private Integer puntaje;

    @Column(columnDefinition = "TEXT")
    private String comentario;

    @Column(columnDefinition = "TEXT")
    private String fortalezas;

    @Column(columnDefinition = "TEXT")
    private String debilidades;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RecomendacionEvaluacion recomendacion;

    @CreationTimestamp
    @Column(name = "fecha_evaluacion", updatable = false)
    private Timestamp fechaEvaluacion;

    @PrePersist
    public void prePersist() {
        if (uuid == null) {
            uuid = UUID.randomUUID();
        }
        if (tipo == null || tipo.isBlank()) {
            tipo = "PRUEBA_TECNICA";
        }
        if (estado == null || estado.isBlank()) {
            estado = "PENDIENTE";
        }
    }

    @PostLoad
    public void postLoad() {
        if (tipo == null || tipo.isBlank()) {
            tipo = "PRUEBA_TECNICA";
        }
        if (estado == null || estado.isBlank()) {
            if (recomendacion != null && recomendacion != RecomendacionEvaluacion.PENDIENTE && puntaje != null && puntaje > 0) {
                estado = "COMPLETADA";
            } else {
                estado = "PENDIENTE";
            }
        }
    }
}

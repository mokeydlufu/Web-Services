package com.elp.postulaciones_service.model;

import com.elp.postulaciones_service.model.enums.EstadoPostulacion;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.sql.Timestamp;
import java.util.UUID;

@Entity
@Table(name = "historial_postulaciones", indexes = {
    @Index(name = "idx_historial_postulacion", columnList = "postulacion_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistorialPostulacion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "postulacion_id", nullable = false)
    private Postulacion postulacion;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_anterior")
    private EstadoPostulacion estadoAnterior;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_nuevo", nullable = false)
    private EstadoPostulacion estadoNuevo;

    @Column(name = "usuario_id", nullable = false)
    private UUID usuarioId;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Timestamp fecha;

    @Column(columnDefinition = "TEXT")
    private String comentario;
}

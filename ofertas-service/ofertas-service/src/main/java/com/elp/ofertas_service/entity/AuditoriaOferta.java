package com.elp.ofertas_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "auditoria_ofertas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditoriaOferta {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "usuario_id", nullable = false)
    private UUID usuarioId;

    @Column(name = "oferta_id", nullable = false)
    private UUID ofertaId;

    @Column(nullable = false)
    private String accion;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime fecha;

    @Column(name = "trace_id")
    private String traceId;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    private String ip;
}
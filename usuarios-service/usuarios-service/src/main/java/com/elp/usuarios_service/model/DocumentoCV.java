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
@Table(name = "documentos_cv")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentoCV {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "usuario_id", nullable = false)
    private UUID usuarioId;

    @Column(name = "nombre_original", nullable = false)
    private String nombreOriginal;

    @Column(name = "storage_key", nullable = false, unique = true)
    private String storageKey;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "tamano_bytes", nullable = false)
    private Long tamanoBytes;

    @Builder.Default
    @Column(nullable = false)
    private Boolean activo = true;

    @CreationTimestamp
    @Column(name = "fecha_carga", updatable = false)
    private Timestamp fechaCarga;

    @Column(name = "fecha_desactivacion")
    private Timestamp fechaDesactivacion;
}

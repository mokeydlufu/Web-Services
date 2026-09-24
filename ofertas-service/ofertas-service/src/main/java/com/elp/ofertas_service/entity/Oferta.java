package com.elp.ofertas_service.entity;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.elp.ofertas_service.enums.EstadoOferta;
import com.elp.ofertas_service.enums.Jornada;
import com.elp.ofertas_service.enums.Modalidad;
import com.elp.ofertas_service.enums.NivelExperiencia;
import com.elp.ofertas_service.enums.TipoContrato;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ofertas", indexes = {
        @Index(name = "idx_oferta_empresa", columnList = "empresa_id"),
        @Index(name = "idx_oferta_estado", columnList = "estado"),
        @Index(name = "idx_oferta_fecha_pub", columnList = "fecha_publicacion")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Oferta {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "empresa_id", nullable = false)
    private UUID empresaId;

    @Column(name = "reclutador_id", nullable = false)
    private UUID reclutadorId;

    @Column(nullable = false)
    private String titulo;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String descripcion;

    @Column(name = "categoria_id", nullable = false)
    private UUID categoriaId;

    @Column(name = "area_profesional")
    private String areaProfesional;

    @Enumerated(EnumType.STRING)
    @Column(name = "nivel_experiencia")
    private NivelExperiencia nivelExperiencia;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_contrato")
    private TipoContrato tipoContrato;

    @Enumerated(EnumType.STRING)
    private Modalidad modalidad;

    @Enumerated(EnumType.STRING)
    private Jornada jornada;

    @Column(name = "salario_minimo", precision = 12, scale = 2)
    private BigDecimal salarioMinimo;

    @Column(name = "salario_maximo", precision = 12, scale = 2)
    private BigDecimal salarioMaximo;

    private String moneda;
    private String ubicacion;
    private String departamento;
    private String provincia;
    private String distrito;
    private String pais;

    @Column(name = "fecha_publicacion")
    private OffsetDateTime fechaPublicacion;

    @Column(name = "fecha_vencimiento")
    private OffsetDateTime fechaVencimiento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EstadoOferta estado = EstadoOferta.BORRADOR;

    @Column(name = "acepta_postulaciones", nullable = false)
    @Builder.Default
    private Boolean aceptaPostulaciones = false;

    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private OffsetDateTime fechaCreacion;

    @UpdateTimestamp
    @Column(name = "fecha_actualizacion")
    private OffsetDateTime fechaActualizacion;

    @Column(name = "fecha_cierre")
    private OffsetDateTime fechaCierre;

    @ManyToMany
    @JoinTable(
            name = "ofertas_habilidades",
            joinColumns = @JoinColumn(name = "oferta_id"),
            inverseJoinColumns = @JoinColumn(name = "habilidad_id")
    )
    @Builder.Default
    private Set<Habilidad> habilidades = new HashSet<>();

    @Column(name = "numero_vistas", nullable = false)
    @Builder.Default
    private Integer numeroVistas = 0;

    @Column(name = "numero_postulaciones", nullable = false)
    @Builder.Default
    private Integer numeroPostulaciones = 0;

    public boolean puedeRecibirPostulaciones() {
        return estado == EstadoOferta.PUBLICADA && aceptaPostulaciones != null && aceptaPostulaciones && fechaVencimiento != null && fechaVencimiento.isAfter(OffsetDateTime.now());
    }
}
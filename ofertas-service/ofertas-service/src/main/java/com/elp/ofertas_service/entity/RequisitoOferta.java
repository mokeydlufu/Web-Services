package com.elp.ofertas_service.entity;

import com.elp.ofertas_service.enums.TipoRequisito;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "requisitos_oferta")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RequisitoOferta {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "oferta_id", nullable = false)
    private Oferta oferta;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoRequisito tipo;

    @Column(nullable = false)
    @Builder.Default
    private Boolean obligatorio = true;

    private String nivel;
}
package com.elp.usuarios_service.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "perfil_habilidades")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PerfilHabilidad {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "usuario_id", nullable = false)
    private UUID usuarioId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "habilidad_id", nullable = false)
    private Habilidad habilidad;

    @Column(nullable = false)
    private String nivel; // BASICO, INTERMEDIO, AVANZADO, EXPERTO

    @Column(name = "anos_experiencia")
    private Integer anosExperiencia;
}

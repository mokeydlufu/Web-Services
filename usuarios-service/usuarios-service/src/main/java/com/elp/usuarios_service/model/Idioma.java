package com.elp.usuarios_service.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "idiomas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Idioma {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "usuario_id", nullable = false)
    private UUID usuarioId;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String nivel; // A1, A2, B1, B2, C1, C2, NATIVO
}

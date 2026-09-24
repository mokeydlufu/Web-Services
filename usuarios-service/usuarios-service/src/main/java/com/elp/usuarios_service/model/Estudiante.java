package com.elp.usuarios_service.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "estudiantes")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Estudiante extends UsuarioBase {

    @Column(length = 8, unique = true, nullable = false)
    private String dni;

    @Column(nullable = false)
    private String nombres;

    @Column(nullable = false)
    private String apellidos;

    @Column(columnDefinition = "TEXT")
    private String biografia;

    @Column(name = "titulo_profesional")
    private String tituloProfesional;

    private String ubicacion;

    @Column(name = "enlace_portafolio")
    private String enlacePortafolio;

    @Column(name = "url_cv_pdf")
    private String urlCvPdf;
}

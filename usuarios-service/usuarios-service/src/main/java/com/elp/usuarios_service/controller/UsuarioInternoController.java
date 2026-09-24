package com.elp.usuarios_service.controller;

import com.elp.usuarios_service.dto.PerfilEstudianteDetalleDTO;
import com.elp.usuarios_service.dto.UsuarioResumenDTO;
import com.elp.usuarios_service.model.*;
import com.elp.usuarios_service.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/usuarios/internos")
@RequiredArgsConstructor
public class UsuarioInternoController {

    private final UsuarioBaseRepository usuarioRepository;
    private final EstudianteRepository estudianteRepository;
    private final EducacionRepository educacionRepository;
    private final ExperienciaLaboralRepository experienciaLaboralRepository;
    private final PerfilHabilidadRepository perfilHabilidadRepository;
    private final ProyectoRepository proyectoRepository;

    @GetMapping("/{uuid}/resumen")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UsuarioResumenDTO> obtenerResumen(@PathVariable UUID uuid) {
        UsuarioBase usuario = usuarioRepository.findById(uuid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado con UUID: " + uuid));

        String nombreCompleto = "";
        if (usuario instanceof Estudiante) {
            Estudiante e = (Estudiante) usuario;
            nombreCompleto = e.getNombres() + " " + e.getApellidos();
        } else if (usuario instanceof Empresa) {
            Empresa e = (Empresa) usuario;
            nombreCompleto = e.getNombreComercial() != null ? e.getNombreComercial() : e.getRazonSocial();
        }

        UsuarioResumenDTO resumen = UsuarioResumenDTO.builder()
                .uuid(usuario.getUuid())
                .nombreCompleto(nombreCompleto)
                .email(usuario.getEmail())
                .fotoPerfil(usuario.getFotoPerfil())
                .rol(usuario.getRol().name())
                .build();

        return ResponseEntity.ok(resumen);
    }

    @GetMapping("/{uuid}/perfil-estudiante")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PerfilEstudianteDetalleDTO> obtenerPerfilEstudiante(@PathVariable UUID uuid) {
        Estudiante estudiante = estudianteRepository.findById(uuid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Estudiante no encontrado con UUID: " + uuid));

        String nombreCompleto = (estudiante.getNombres() != null ? estudiante.getNombres() : "") + " " +
                                (estudiante.getApellidos() != null ? estudiante.getApellidos() : "");

        List<String> habilidades = perfilHabilidadRepository.findByUsuarioId(uuid).stream()
                .filter(ph -> ph.getHabilidad() != null && ph.getHabilidad().getNombre() != null)
                .map(ph -> ph.getHabilidad().getNombre() + (ph.getNivel() != null ? " (" + ph.getNivel() + ")" : ""))
                .collect(Collectors.toList());

        List<String> experiencias = experienciaLaboralRepository.findByUsuarioId(uuid).stream()
                .map(exp -> exp.getCargo() + " en " + exp.getEmpresa() + 
                        (exp.getDescripcion() != null && !exp.getDescripcion().isBlank() ? ": " + exp.getDescripcion() : ""))
                .collect(Collectors.toList());

        List<String> educaciones = educacionRepository.findByUsuarioId(uuid).stream()
                .map(edu -> edu.getCarrera() + " en " + edu.getInstitucion() + 
                        (edu.getGrado() != null ? " (" + edu.getGrado() + ")" : ""))
                .collect(Collectors.toList());

        List<String> proyectos = proyectoRepository.findByUsuarioId(uuid).stream()
                .map(proy -> proy.getNombre() + 
                        (proy.getDescripcion() != null && !proy.getDescripcion().isBlank() ? ": " + proy.getDescripcion() : ""))
                .collect(Collectors.toList());

        PerfilEstudianteDetalleDTO perfil = PerfilEstudianteDetalleDTO.builder()
                .uuid(estudiante.getId())
                .nombreCompleto(nombreCompleto.trim())
                .email(estudiante.getEmail())
                .carrera(estudiante.getTituloProfesional())
                .biografia(estudiante.getBiografia())
                .ubicacion(estudiante.getUbicacion())
                .habilidades(habilidades)
                .experiencias(experiencias)
                .educacion(educaciones)
                .proyectos(proyectos)
                .build();

        return ResponseEntity.ok(perfil);
    }
}

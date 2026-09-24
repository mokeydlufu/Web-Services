package com.elp.usuarios_service.service;

import com.elp.usuarios_service.dto.PerfilResponseDTO;
import com.elp.usuarios_service.model.*;
import com.elp.usuarios_service.model.enums.Rol;
import com.elp.usuarios_service.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.sql.Timestamp;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PerfilService {

    private final UsuarioBaseRepository usuarioRepository;
    private final EstudianteRepository estudianteRepository;
    private final EmpresaRepository empresaRepository;
    private final EducacionRepository educacionRepository;
    private final DocumentoCVRepository documentoCVRepository;
    private final StorageService storageService;
    private final ProfileCompletionService profileCompletionService;

    @Transactional
    public PerfilResponseDTO obtenerMiPerfil(UUID usuarioId) {
        UsuarioBase usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        String nombreParaMostrar = usuario.getEmail();
        ProfileCompletionService.ProfileCompletionResult result = null;

        if (usuario.getRol() == Rol.ESTUDIANTE) {
            Estudiante estudiante = estudianteRepository.findById(usuarioId)
                    .orElseThrow(() -> new IllegalArgumentException("Estudiante no encontrado"));
            nombreParaMostrar = (estudiante.getNombres() != null ? estudiante.getNombres() : "") + " " + 
                                (estudiante.getApellidos() != null ? estudiante.getApellidos() : "");
            
            List<Educacion> educaciones = educacionRepository.findByUsuarioId(usuarioId);
            boolean tieneCvActivo = documentoCVRepository.findByUsuarioIdAndActivoTrue(usuarioId).isPresent();
            
            result = profileCompletionService.evaluarEstudiante(estudiante, educaciones, tieneCvActivo);
        } else if (usuario.getRol() == Rol.EMPRESA) {
            Empresa empresa = empresaRepository.findById(usuarioId)
                    .orElseThrow(() -> new IllegalArgumentException("Empresa no encontrada"));
            nombreParaMostrar = empresa.getRazonSocial() != null ? empresa.getRazonSocial() : empresa.getEmail();
            
            result = profileCompletionService.evaluarEmpresa(empresa);
        } else {
            result = ProfileCompletionService.ProfileCompletionResult.builder()
                    .porcentaje(100)
                    .estado(com.elp.usuarios_service.model.enums.EstadoPerfil.COMPLETO)
                    .motivosPendientes(List.of())
                    .puedeAccionar(true)
                    .build();
        }

        if (result != null) {
            usuario.setPorcentajeCompletitud(result.getPorcentaje());
            usuario.setEstadoPerfil(result.getEstado());
            usuarioRepository.save(usuario);
        }

        return PerfilResponseDTO.builder()
                .id(usuario.getId())
                .email(usuario.getEmail())
                .rol(usuario.getRol().name())
                .nombreParaMostrar(nombreParaMostrar.trim())
                .porcentajeCompletitud(usuario.getPorcentajeCompletitud())
                .estadoPerfil(usuario.getEstadoPerfil())
                .motivosPendientes(result != null ? result.getMotivosPendientes() : List.of())
                .puedeAccionar(result != null ? result.getPuedeAccionar() : true)
                .build();
    }

    @Transactional
    public void subirCv(UUID usuarioId, MultipartFile file) {
        UsuarioBase usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
                
        if (usuario.getRol() != Rol.ESTUDIANTE) {
            throw new IllegalArgumentException("Solo los perfiles candidatos pueden subir un CV");
        }

        String storageKey = storageService.storeFile(file, usuarioId);

        documentoCVRepository.findByUsuarioIdAndActivoTrue(usuarioId).ifPresent(doc -> {
            doc.setActivo(false);
            doc.setFechaDesactivacion(new Timestamp(System.currentTimeMillis()));
            documentoCVRepository.save(doc);
        });

        DocumentoCV nuevoCv = DocumentoCV.builder()
                .usuarioId(usuarioId)
                .nombreOriginal(file.getOriginalFilename())
                .storageKey(storageKey)
                .contentType(file.getContentType())
                .tamanoBytes(file.getSize())
                .activo(true)
                .build();
                
        documentoCVRepository.save(nuevoCv);
        
        obtenerMiPerfil(usuarioId);
    }
}

package com.elp.usuarios_service.controller;

import com.elp.usuarios_service.dto.EmpresaUpdateDto;
import com.elp.usuarios_service.model.Empresa;
import com.elp.usuarios_service.repository.EmpresaRepository;
import com.elp.usuarios_service.security.UserDetailsImpl;
import com.elp.usuarios_service.service.PerfilService;
import com.elp.usuarios_service.service.StorageService;
import com.elp.usuarios_service.dto.CambioPasswordRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.Map;

@RestController
@RequestMapping("/api/perfil/empresa")
@RequiredArgsConstructor
public class PerfilEmpresaController {

    private final EmpresaRepository empresaRepository;
    private final StorageService storageService;
    private final PerfilService perfilService;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/me")
    public ResponseEntity<Empresa> obtenerPerfil(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null || userDetails.getUsuario() == null) {
            return ResponseEntity.status(401).build();
        }
        return empresaRepository.findById(userDetails.getUsuario().getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/me")
    public ResponseEntity<Empresa> actualizarPerfil(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody EmpresaUpdateDto dto) {
        
        if (userDetails == null || userDetails.getUsuario() == null) {
            return ResponseEntity.status(401).build();
        }

        return empresaRepository.findById(userDetails.getUsuario().getId())
                .map(e -> {
                    e.setNombreComercial(dto.getNombreComercial());
                    e.setDescripcion(dto.getDescripcion());
                    e.setSitioWeb(dto.getSitioWeb());
                    e.setIndustria(dto.getIndustria());
                    e.setTamano(dto.getTamano());
                    e.setEmailCorporativo(dto.getEmailCorporativo());
                    e.setDireccion(dto.getDireccion());
                    e.setUbicacion(dto.getUbicacion());
                    e.setTelefono(dto.getTelefono());
                    
                    Empresa saved = empresaRepository.save(e);
                    // Actualizar estado perfil
                    perfilService.obtenerMiPerfil(e.getId());
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('EMPRESA')")
    @PostMapping("/logo")
    public ResponseEntity<Void> subirLogo(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam("file") MultipartFile file) {
            
        if (userDetails == null || userDetails.getUsuario() == null) {
            return ResponseEntity.status(401).build();
        }

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        long MAX_SIZE = 2 * 1024 * 1024; // 2MB
        if (file.getSize() > MAX_SIZE) {
            return ResponseEntity.badRequest().build();
        }
        
        String contentType = file.getContentType();
        if (contentType == null || !(contentType.equals("image/jpeg") || contentType.equals("image/png") || contentType.equals("image/webp"))) {
            return ResponseEntity.badRequest().build();
        }

        return empresaRepository.findById(userDetails.getUsuario().getId())
                .map(e -> {
                    String storageKey = storageService.storeImage(file, e.getId());
                    String baseUrl = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
                    String logoUrl = baseUrl + "/api/archivos/" + storageKey; 
                    
                    e.setLogo(logoUrl);
                    empresaRepository.save(e);
                    
                    perfilService.obtenerMiPerfil(e.getId());
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('EMPRESA')")
    @PutMapping("/password")
    public ResponseEntity<?> cambiarPassword(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody CambioPasswordRequest request) {
            
        if (userDetails == null || userDetails.getUsuario() == null) {
            return ResponseEntity.status(401).build();
        }

        if (request.getContrasenaActual() == null || request.getContrasenaNueva() == null || request.getContrasenaNueva().length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", "Datos inválidos"));
        }
        
        return empresaRepository.findById(userDetails.getUsuario().getId())
                .map(e -> {
                    if (!passwordEncoder.matches(request.getContrasenaActual(), e.getPassword())) {
                        return ResponseEntity.badRequest().body(Map.of("mensaje", "Contraseña actual incorrecta"));
                    }
                    e.setPassword(passwordEncoder.encode(request.getContrasenaNueva()));
                    empresaRepository.save(e);
                    return ResponseEntity.ok(Map.of("mensaje", "Contraseña actualizada correctamente."));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}

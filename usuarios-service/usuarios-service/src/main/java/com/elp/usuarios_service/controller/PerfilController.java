package com.elp.usuarios_service.controller;

import com.elp.usuarios_service.dto.PerfilResponseDTO;
import com.elp.usuarios_service.security.UserDetailsImpl;
import com.elp.usuarios_service.service.PerfilService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/perfil")
@RequiredArgsConstructor
public class PerfilController {

    private final PerfilService perfilService;

    @GetMapping("/me")
    public ResponseEntity<PerfilResponseDTO> obtenerMiPerfil(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null || userDetails.getUsuario() == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(perfilService.obtenerMiPerfil(userDetails.getUsuario().getId()));
    }

    @PostMapping("/cv")
    public ResponseEntity<Void> subirCv(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam("file") MultipartFile file) {
        if (userDetails == null || userDetails.getUsuario() == null) {
            return ResponseEntity.status(401).build();
        }
        perfilService.subirCv(userDetails.getUsuario().getId(), file);
        return ResponseEntity.ok().build();
    }
}

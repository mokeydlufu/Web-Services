package com.elp.usuarios_service.controller;

import com.elp.usuarios_service.dto.AuthResponse;
import com.elp.usuarios_service.dto.LoginRequest;
import com.elp.usuarios_service.dto.RegisterEmpresaRequest;
import com.elp.usuarios_service.dto.RegisterEstudianteRequest;
import com.elp.usuarios_service.dto.UsuarioResponseDTO;
import com.elp.usuarios_service.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/registro/estudiante")
    public ResponseEntity<AuthResponse> registrarEstudiante(@Valid @RequestBody RegisterEstudianteRequest request) {
        return ResponseEntity.ok(authService.registrarEstudiante(request));
    }

    @PostMapping("/registro/empresa")
    public ResponseEntity<AuthResponse> registrarEmpresa(@Valid @RequestBody RegisterEmpresaRequest request) {
        return ResponseEntity.ok(authService.registrarEmpresa(request));
    }

    @GetMapping("/check-dni/{dni}")
    public ResponseEntity<Map<String, Object>> checkDni(@PathVariable String dni) {
        boolean existe = authService.existeDni(dni);
        if (existe) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "dni", dni,
                            "exists", true,
                            "disponible", false,
                            "message", "El DNI ya está registrado"
                    ));
        }
        return ResponseEntity.ok(Map.of(
                "dni", dni,
                "exists", false,
                "disponible", true,
                "message", "DNI disponible"
        ));
    }

    @GetMapping("/check-email")
    public ResponseEntity<Map<String, Object>> checkEmail(@RequestParam String email) {
        boolean existe = authService.existeEmail(email);
        if (existe) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "email", email,
                            "exists", true,
                            "disponible", false,
                            "message", "El email ya está registrado"
                    ));
        }
        return ResponseEntity.ok(Map.of(
                "email", email,
                "exists", false,
                "disponible", true,
                "message", "Email disponible"
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioResponseDTO> obtenerUsuarioActual(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(authService.obtenerUsuarioActual(userDetails.getUsername()));
    }
}

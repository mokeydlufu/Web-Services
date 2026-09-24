package com.elp.usuarios_service.controller;

import com.elp.usuarios_service.model.Estudiante;
import com.elp.usuarios_service.repository.EmpresaRepository;
import com.elp.usuarios_service.repository.EstudianteRepository;
import com.elp.usuarios_service.repository.UsuarioBaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class AdminUsuarioController {

    private final UsuarioBaseRepository usuarioRepository;
    private final EstudianteRepository estudianteRepository;
    private final EmpresaRepository empresaRepository;

    @GetMapping("/candidatos")
    public ResponseEntity<List<Estudiante>> listarCandidatos() {
        return ResponseEntity.ok(estudianteRepository.findAll());
    }

    @GetMapping("/usuarios/stats")
    public ResponseEntity<Map<String, Object>> obtenerEstadisticasUsuarios() {
        long totalUsuarios = usuarioRepository.count();
        long totalCandidatos = estudianteRepository.count();
        long totalEmpresas = empresaRepository.count();
        long empresasPendientes = empresaRepository.countByEstadoVerificacion("PENDIENTE");
        long empresasVerificadas = empresaRepository.countByEstadoVerificacion("VERIFICADA");
        long empresasRechazadas = empresaRepository.countByEstadoVerificacion("RECHAZADA");
        long empresasSuspendidas = empresaRepository.countByEstadoVerificacion("SUSPENDIDA");

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsuarios", totalUsuarios);
        stats.put("totalCandidatos", totalCandidatos);
        stats.put("totalEmpresas", totalEmpresas);
        stats.put("empresasPendientes", empresasPendientes);
        stats.put("empresasVerificadas", empresasVerificadas);
        stats.put("empresasRechazadas", empresasRechazadas);
        stats.put("empresasSuspendidas", empresasSuspendidas);

        return ResponseEntity.ok(stats);
    }
}

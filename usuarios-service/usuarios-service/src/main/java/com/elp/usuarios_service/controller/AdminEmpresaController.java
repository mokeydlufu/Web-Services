package com.elp.usuarios_service.controller;

import com.elp.usuarios_service.model.Empresa;
import com.elp.usuarios_service.repository.EmpresaRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.Timestamp;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/empresas")
@RequiredArgsConstructor
@org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMINISTRADOR')")
public class AdminEmpresaController {

    private final EmpresaRepository empresaRepository;

    @GetMapping
    public ResponseEntity<java.util.List<Empresa>> listarEmpresas(@RequestParam(required = false) String estado) {
        if (estado != null && !estado.trim().isEmpty() && !"TODAS".equalsIgnoreCase(estado)) {
            return ResponseEntity.ok(empresaRepository.findByEstadoVerificacion(estado.trim().toUpperCase()));
        }
        return ResponseEntity.ok(empresaRepository.findAll());
    }

    @GetMapping("/pendientes")
    public ResponseEntity<java.util.List<Empresa>> listarPendientes() {
        return ResponseEntity.ok(empresaRepository.findByEstadoVerificacion("PENDIENTE"));
    }

    @PatchMapping("/{id}/aprobar")
    public ResponseEntity<Empresa> aprobarEmpresa(@PathVariable UUID id) {
        return empresaRepository.findById(id).map(e -> {
            e.setEstadoVerificacion("VERIFICADA");
            e.setFechaVerificacion(new Timestamp(System.currentTimeMillis()));
            return ResponseEntity.ok(empresaRepository.save(e));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/rechazar")
    public ResponseEntity<Empresa> rechazarEmpresa(@PathVariable UUID id, @RequestBody RechazoRequest request) {
        if (request.getMotivo() == null || request.getMotivo().trim().isEmpty() || request.getMotivo().length() > 1000) {
            return ResponseEntity.badRequest().build();
        }
        return empresaRepository.findById(id).map(e -> {
            e.setEstadoVerificacion("RECHAZADA");
            e.setMotivoRechazo(request.getMotivo().trim());
            e.setFechaVerificacion(new Timestamp(System.currentTimeMillis()));
            return ResponseEntity.ok(empresaRepository.save(e));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/suspender")
    public ResponseEntity<Empresa> suspenderEmpresa(@PathVariable UUID id) {
        return empresaRepository.findById(id).map(e -> {
            e.setEstadoVerificacion("SUSPENDIDA");
            return ResponseEntity.ok(empresaRepository.save(e));
        }).orElse(ResponseEntity.notFound().build());
    }
}

@Data
class RechazoRequest {
    private String motivo;
}

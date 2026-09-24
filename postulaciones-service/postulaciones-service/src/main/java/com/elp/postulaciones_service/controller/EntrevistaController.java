package com.elp.postulaciones_service.controller;

import com.elp.postulaciones_service.dto.entrevista.EntrevistaRequest;
import com.elp.postulaciones_service.dto.entrevista.EntrevistaResponse;
import com.elp.postulaciones_service.model.enums.EstadoEntrevista;
import com.elp.postulaciones_service.service.EntrevistaService;
import com.elp.postulaciones_service.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Entrevistas", description = "API para gestion de entrevistas en postulaciones")
@SecurityRequirement(name = "bearerAuth")
public class EntrevistaController {

    private final EntrevistaService entrevistaService;

    @PostMapping("/postulaciones/{postulacionId}/entrevistas")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'EMPRESA', 'ADMINISTRADOR')")
    @Operation(summary = "Crear entrevista", description = "Crea una entrevista para una postulacion. Solo Reclutador/Empresa autorizado.")
    public ResponseEntity<EntrevistaResponse> crearEntrevista(
            @PathVariable UUID postulacionId,
            @Valid @RequestBody EntrevistaRequest request) {
        UUID usuarioId = SecurityUtils.getUsuarioLogueadoId();
        EntrevistaResponse response = entrevistaService.crearEntrevista(postulacionId, usuarioId, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/postulaciones/{postulacionId}/entrevistas")
    @Operation(summary = "Listar entrevistas de una postulacion")
    public ResponseEntity<Page<EntrevistaResponse>> listarEntrevistas(
            @PathVariable UUID postulacionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        int validSize = size > 100 ? 100 : size;
        Pageable pageable = PageRequest.of(page, validSize);
        UUID usuarioId = SecurityUtils.getUsuarioLogueadoId();
        String rol = SecurityUtils.getRolUsuarioLogueado();
        
        return ResponseEntity.ok(entrevistaService.listarEntrevistasPorPostulacion(postulacionId, usuarioId, rol, pageable));
    }

    @GetMapping("/entrevistas/mis-entrevistas")
    @PreAuthorize("hasAnyRole('ESTUDIANTE', 'PROFESIONAL', 'CANDIDATO')")
    @Operation(summary = "Listar entrevistas del candidato autenticado")
    public ResponseEntity<Page<EntrevistaResponse>> listarMisEntrevistas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        int validSize = size > 100 ? 100 : size;
        Pageable pageable = PageRequest.of(page, validSize);
        UUID candidatoId = SecurityUtils.getUsuarioLogueadoId();
        return ResponseEntity.ok(entrevistaService.listarMisEntrevistas(candidatoId, pageable));
    }

    @GetMapping("/entrevistas/{entrevistaId}")
    @Operation(summary = "Obtener detalle de entrevista")
    public ResponseEntity<EntrevistaResponse> obtenerEntrevista(@PathVariable UUID entrevistaId) {
        UUID usuarioId = SecurityUtils.getUsuarioLogueadoId();
        String rol = SecurityUtils.getRolUsuarioLogueado();
        return ResponseEntity.ok(entrevistaService.obtenerEntrevista(entrevistaId, usuarioId, rol));
    }

    @PatchMapping("/entrevistas/{entrevistaId}/estado")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'EMPRESA', 'ADMINISTRADOR')")
    @Operation(summary = "Actualizar estado de entrevista")
    public ResponseEntity<EntrevistaResponse> actualizarEstado(
            @PathVariable UUID entrevistaId,
            @RequestParam EstadoEntrevista estado) {
        UUID usuarioId = SecurityUtils.getUsuarioLogueadoId();
        return ResponseEntity.ok(entrevistaService.actualizarEstadoEntrevista(entrevistaId, estado, usuarioId));
    }

    @DeleteMapping("/entrevistas/{entrevistaId}/cancelar")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'EMPRESA', 'ADMINISTRADOR')")
    @Operation(summary = "Cancelar entrevista")
    public ResponseEntity<Void> cancelarEntrevista(
            @PathVariable UUID entrevistaId,
            @RequestParam(required = false, defaultValue = "Cancelada") String motivo) {
        UUID usuarioId = SecurityUtils.getUsuarioLogueadoId();
        entrevistaService.cancelarEntrevista(entrevistaId, usuarioId, motivo);
        return ResponseEntity.noContent().build();
    }
}
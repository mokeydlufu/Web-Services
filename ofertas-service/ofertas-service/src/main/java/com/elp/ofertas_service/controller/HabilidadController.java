package com.elp.ofertas_service.controller;

import com.elp.ofertas_service.dto.request.HabilidadRequest;
import com.elp.ofertas_service.dto.response.HabilidadResponse;
import com.elp.ofertas_service.service.HabilidadService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/habilidades")
@RequiredArgsConstructor
public class HabilidadController {

    private final HabilidadService habilidadService;

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<HabilidadResponse> crearHabilidad(@Valid @RequestBody HabilidadRequest request) {
        return new ResponseEntity<>(habilidadService.crearHabilidad(request), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<Page<HabilidadResponse>> listarHabilidades(
            @PageableDefault(size = 20) Pageable pageable) {
        int size = Math.min(pageable.getPageSize(), 100);
        Pageable cappedPageable = org.springframework.data.domain.PageRequest.of(pageable.getPageNumber(), size, pageable.getSort());
        return ResponseEntity.ok(habilidadService.listarHabilidades(cappedPageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<HabilidadResponse> obtenerHabilidadPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(habilidadService.obtenerHabilidadPorId(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<HabilidadResponse> actualizarHabilidad(@PathVariable UUID id, @Valid @RequestBody HabilidadRequest request) {
        return ResponseEntity.ok(habilidadService.actualizarHabilidad(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> eliminarHabilidad(@PathVariable UUID id) {
        habilidadService.eliminarHabilidad(id);
        return ResponseEntity.noContent().build();
    }
}
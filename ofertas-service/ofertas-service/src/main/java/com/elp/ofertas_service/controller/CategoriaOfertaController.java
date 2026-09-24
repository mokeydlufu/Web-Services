package com.elp.ofertas_service.controller;

import com.elp.ofertas_service.dto.request.CategoriaOfertaRequest;
import com.elp.ofertas_service.dto.response.CategoriaOfertaResponse;
import com.elp.ofertas_service.service.CategoriaOfertaService;
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
@RequestMapping("/api/categorias")
@RequiredArgsConstructor
public class CategoriaOfertaController {

    private final CategoriaOfertaService categoriaService;

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<CategoriaOfertaResponse> crearCategoria(@Valid @RequestBody CategoriaOfertaRequest request) {
        return new ResponseEntity<>(categoriaService.crearCategoria(request), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<Page<CategoriaOfertaResponse>> listarCategorias(
            @PageableDefault(size = 20) Pageable pageable) {
        int size = Math.min(pageable.getPageSize(), 100);
        Pageable cappedPageable = org.springframework.data.domain.PageRequest.of(pageable.getPageNumber(), size, pageable.getSort());
        return ResponseEntity.ok(categoriaService.listarCategorias(cappedPageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoriaOfertaResponse> obtenerCategoriaPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(categoriaService.obtenerCategoriaPorId(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<CategoriaOfertaResponse> actualizarCategoria(@PathVariable UUID id, @Valid @RequestBody CategoriaOfertaRequest request) {
        return ResponseEntity.ok(categoriaService.actualizarCategoria(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> eliminarCategoria(@PathVariable UUID id) {
        categoriaService.eliminarCategoria(id);
        return ResponseEntity.noContent().build();
    }
}
package com.elp.usuarios_service.controller;

import com.elp.usuarios_service.dto.EmpresaPublicaDto;
import com.elp.usuarios_service.model.Empresa;
import com.elp.usuarios_service.repository.EmpresaRepository;
import com.elp.usuarios_service.repository.EmpresaSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/empresas/publicas")
@RequiredArgsConstructor
public class EmpresaPublicaController {

    private final EmpresaRepository empresaRepository;

    @GetMapping
    public ResponseEntity<Page<EmpresaPublicaDto>> buscarEmpresas(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String ubicacion,
            @RequestParam(required = false) String industria,
            Pageable pageable) {

        Page<Empresa> empresas = empresaRepository.findAll(
                EmpresaSpecification.conFiltros(q, ubicacion, industria, "APROBADA"), pageable);

        Page<EmpresaPublicaDto> dtos = empresas.map(this::mapToPublicDto);
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmpresaPublicaDto> obtenerEmpresaPorId(@PathVariable UUID id) {
        return empresaRepository.findById(id)
                .filter(e -> "VERIFICADA".equalsIgnoreCase(e.getEstadoVerificacion()) || "APROBADA".equalsIgnoreCase(e.getEstadoVerificacion()))
                .map(e -> ResponseEntity.ok(mapToPublicDto(e)))
                .orElse(ResponseEntity.notFound().build());
    }

    private EmpresaPublicaDto mapToPublicDto(Empresa e) {
        return EmpresaPublicaDto.builder()
                .id(e.getId())
                .razonSocial(e.getRazonSocial())
                .nombreComercial(e.getNombreComercial())
                .logo(e.getLogo())
                .descripcion(e.getDescripcion())
                .sitioWeb(e.getSitioWeb())
                .industria(e.getIndustria())
                .tamano(e.getTamano())
                .ubicacion(e.getUbicacion())
                .estadoVerificacion(e.getEstadoVerificacion())
                .build();
    }
}

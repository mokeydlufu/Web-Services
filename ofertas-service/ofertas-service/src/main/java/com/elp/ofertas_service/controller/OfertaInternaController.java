package com.elp.ofertas_service.controller;

import com.elp.ofertas_service.dto.OfertaResumenDTO;
import com.elp.ofertas_service.entity.Oferta;
import com.elp.ofertas_service.entity.RequisitoOferta;
import com.elp.ofertas_service.repository.OfertaRepository;
import com.elp.ofertas_service.repository.RequisitoOfertaRepository;
import com.elp.ofertas_service.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ofertas/internos")
@RequiredArgsConstructor
public class OfertaInternaController {

    private final OfertaRepository ofertaRepository;
    private final RequisitoOfertaRepository requisitoOfertaRepository;

    @GetMapping("/{uuid}/validacion")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OfertaResumenDTO> validarOferta(@PathVariable UUID uuid) {
        Oferta oferta = ofertaRepository.findById(uuid)
                .orElseThrow(() -> new ResourceNotFoundException("Oferta no encontrada con ID: " + uuid));

        List<String> requisitos = null;
        try {
            requisitos = requisitoOfertaRepository.findByOfertaId(uuid).stream()
                    .map(RequisitoOferta::getDescripcion)
                    .collect(Collectors.toList());
        } catch (Exception ignored) {}

        OfertaResumenDTO resumen = OfertaResumenDTO.builder()
                .ofertaId(oferta.getId())
                .empresaId(oferta.getEmpresaId())
                .titulo(oferta.getTitulo())
                .estado(oferta.getEstado().name())
                .aceptaPostulaciones(oferta.getAceptaPostulaciones())
                .descripcion(oferta.getDescripcion())
                .requisitos(requisitos)
                .areaProfesional(oferta.getAreaProfesional())
                .nivelExperiencia(oferta.getNivelExperiencia() != null ? oferta.getNivelExperiencia().name() : null)
                .modalidad(oferta.getModalidad() != null ? oferta.getModalidad().name() : null)
                .build();

        return ResponseEntity.ok(resumen);
    }
}


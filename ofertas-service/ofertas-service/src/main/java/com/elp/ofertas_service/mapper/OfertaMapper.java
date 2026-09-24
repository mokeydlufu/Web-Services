package com.elp.ofertas_service.mapper;

import com.elp.ofertas_service.dto.response.OfertaPostulacionResponse;
import com.elp.ofertas_service.dto.response.OfertaResponse;
import com.elp.ofertas_service.dto.response.RequisitoOfertaResponse;
import com.elp.ofertas_service.entity.Oferta;
import com.elp.ofertas_service.entity.RequisitoOferta;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class OfertaMapper {

    public OfertaResponse toResponse(Oferta oferta, List<RequisitoOferta> requisitos) {
        if (oferta == null) return null;

        List<RequisitoOfertaResponse> reqResponses = null;
        if (requisitos != null) {
            reqResponses = requisitos.stream()
                .map(this::toRequisitoResponse)
                .collect(Collectors.toList());
        }

        return OfertaResponse.builder()
                .id(oferta.getId())
                .empresaId(oferta.getEmpresaId())
                .reclutadorId(oferta.getReclutadorId())
                .titulo(oferta.getTitulo())
                .descripcion(oferta.getDescripcion())
                .categoriaId(oferta.getCategoriaId())
                .areaProfesional(oferta.getAreaProfesional())
                .nivelExperiencia(oferta.getNivelExperiencia())
                .tipoContrato(oferta.getTipoContrato())
                .modalidad(oferta.getModalidad())
                .jornada(oferta.getJornada())
                .salarioMinimo(oferta.getSalarioMinimo())
                .salarioMaximo(oferta.getSalarioMaximo())
                .moneda(oferta.getMoneda())
                .ubicacion(oferta.getUbicacion())
                .departamento(oferta.getDepartamento())
                .provincia(oferta.getProvincia())
                .distrito(oferta.getDistrito())
                .pais(oferta.getPais())
                .fechaPublicacion(oferta.getFechaPublicacion())
                .fechaVencimiento(oferta.getFechaVencimiento())
                .estado(oferta.getEstado())
                .aceptaPostulaciones(oferta.getAceptaPostulaciones())
                .fechaCreacion(oferta.getFechaCreacion())
                .fechaActualizacion(oferta.getFechaActualizacion())
                .fechaCierre(oferta.getFechaCierre())
                .numeroVistas(oferta.getNumeroVistas())
                .numeroPostulaciones(oferta.getNumeroPostulaciones())
                .requisitos(reqResponses)
                .build();
    }

    public RequisitoOfertaResponse toRequisitoResponse(RequisitoOferta req) {
        if (req == null) return null;
        return RequisitoOfertaResponse.builder()
                .id(req.getId())
                .descripcion(req.getDescripcion())
                .tipo(req.getTipo())
                .obligatorio(req.getObligatorio())
                .nivel(req.getNivel())
                .build();
    }

    public OfertaPostulacionResponse toPostulacionResponse(Oferta oferta) {
        if (oferta == null) return null;
        return OfertaPostulacionResponse.builder()
                .ofertaId(oferta.getId())
                .empresaId(oferta.getEmpresaId())
                .estado(oferta.getEstado())
                .aceptaPostulaciones(oferta.getAceptaPostulaciones())
                .fechaVencimiento(oferta.getFechaVencimiento())
                .puedePostular(oferta.puedeRecibirPostulaciones())
                .build();
    }
}
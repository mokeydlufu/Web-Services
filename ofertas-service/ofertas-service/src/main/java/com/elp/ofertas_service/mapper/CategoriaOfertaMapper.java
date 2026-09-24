package com.elp.ofertas_service.mapper;

import com.elp.ofertas_service.dto.request.CategoriaOfertaRequest;
import com.elp.ofertas_service.dto.response.CategoriaOfertaResponse;
import com.elp.ofertas_service.entity.CategoriaOferta;
import org.springframework.stereotype.Component;

@Component
public class CategoriaOfertaMapper {

    public CategoriaOfertaResponse toResponse(CategoriaOferta categoria) {
        if (categoria == null) return null;
        return CategoriaOfertaResponse.builder()
                .id(categoria.getId())
                .nombre(categoria.getNombre())
                .descripcion(categoria.getDescripcion())
                .activo(categoria.getActivo())
                .fechaCreacion(categoria.getFechaCreacion())
                .fechaActualizacion(categoria.getFechaActualizacion())
                .build();
    }

    public CategoriaOferta toEntity(CategoriaOfertaRequest request) {
        if (request == null) return null;
        return CategoriaOferta.builder()
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .activo(request.getActivo() != null ? request.getActivo() : true)
                .build();
    }
}
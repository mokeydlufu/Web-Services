package com.elp.ofertas_service.mapper;

import com.elp.ofertas_service.dto.request.HabilidadRequest;
import com.elp.ofertas_service.dto.response.HabilidadResponse;
import com.elp.ofertas_service.entity.Habilidad;
import org.springframework.stereotype.Component;

@Component
public class HabilidadMapper {

    public HabilidadResponse toResponse(Habilidad habilidad) {
        if (habilidad == null) return null;
        return HabilidadResponse.builder()
                .id(habilidad.getId())
                .nombre(habilidad.getNombre())
                .descripcion(habilidad.getDescripcion())
                .activo(habilidad.getActivo())
                .build();
    }

    public Habilidad toEntity(HabilidadRequest request) {
        if (request == null) return null;
        return Habilidad.builder()
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .activo(request.getActivo() != null ? request.getActivo() : true)
                .build();
    }
}
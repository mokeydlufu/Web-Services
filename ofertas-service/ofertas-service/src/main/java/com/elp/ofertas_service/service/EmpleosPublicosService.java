package com.elp.ofertas_service.service;

import com.elp.ofertas_service.dto.response.EmpleoPublicoDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface EmpleosPublicosService {

    Page<EmpleoPublicoDTO> buscarEmpleosPublicos(
            String q,
            String ubicacion,
            String tipoEmpleo,
            String origen,
            Boolean incluirRemotos,
            Pageable pageable
    );
}

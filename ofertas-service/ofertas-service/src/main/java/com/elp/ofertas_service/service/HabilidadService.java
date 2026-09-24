package com.elp.ofertas_service.service;

import com.elp.ofertas_service.dto.request.HabilidadRequest;
import com.elp.ofertas_service.dto.response.HabilidadResponse;
import com.elp.ofertas_service.entity.Habilidad;
import com.elp.ofertas_service.exception.BusinessException;
import com.elp.ofertas_service.exception.ResourceNotFoundException;
import com.elp.ofertas_service.mapper.HabilidadMapper;
import com.elp.ofertas_service.repository.HabilidadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class HabilidadService {

    private final HabilidadRepository habilidadRepository;
    private final HabilidadMapper mapper;

    @Transactional
    public HabilidadResponse crearHabilidad(HabilidadRequest request) {
        if (habilidadRepository.existsByNombreIgnoreCase(request.getNombre())) {
            throw new BusinessException("Ya existe una habilidad con este nombre");
        }
        Habilidad habilidad = mapper.toEntity(request);
        return mapper.toResponse(habilidadRepository.save(habilidad));
    }

    @Transactional
    public HabilidadResponse actualizarHabilidad(UUID id, HabilidadRequest request) {
        Habilidad habilidad = habilidadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Habilidad no encontrada"));
                
        if (!habilidad.getNombre().equalsIgnoreCase(request.getNombre()) && 
            habilidadRepository.existsByNombreIgnoreCase(request.getNombre())) {
            throw new BusinessException("Ya existe otra habilidad con este nombre");
        }
        
        habilidad.setNombre(request.getNombre());
        habilidad.setDescripcion(request.getDescripcion());
        if (request.getActivo() != null) {
            habilidad.setActivo(request.getActivo());
        }
        
        return mapper.toResponse(habilidadRepository.save(habilidad));
    }

    @Transactional(readOnly = true)
    public HabilidadResponse obtenerHabilidadPorId(UUID id) {
        return habilidadRepository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Habilidad no encontrada"));
    }

    @Transactional(readOnly = true)
    public Page<HabilidadResponse> listarHabilidades(Pageable pageable) {
        return habilidadRepository.findAll(pageable).map(mapper::toResponse);
    }

    @Transactional
    public void eliminarHabilidad(UUID id) {
        Habilidad habilidad = habilidadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Habilidad no encontrada"));
                
        habilidad.setActivo(false);
        habilidadRepository.save(habilidad);
    }
}
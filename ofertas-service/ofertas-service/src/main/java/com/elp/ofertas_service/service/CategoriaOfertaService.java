package com.elp.ofertas_service.service;

import com.elp.ofertas_service.dto.request.CategoriaOfertaRequest;
import com.elp.ofertas_service.dto.response.CategoriaOfertaResponse;
import com.elp.ofertas_service.entity.CategoriaOferta;
import com.elp.ofertas_service.exception.BusinessException;
import com.elp.ofertas_service.exception.ResourceNotFoundException;
import com.elp.ofertas_service.mapper.CategoriaOfertaMapper;
import com.elp.ofertas_service.repository.CategoriaOfertaRepository;
import com.elp.ofertas_service.repository.OfertaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoriaOfertaService {

    private final CategoriaOfertaRepository categoriaRepository;
    private final OfertaRepository ofertaRepository;
    private final CategoriaOfertaMapper mapper;

    @Transactional
    public CategoriaOfertaResponse crearCategoria(CategoriaOfertaRequest request) {
        if (categoriaRepository.existsByNombreIgnoreCase(request.getNombre())) {
            throw new BusinessException("Ya existe una categoría con este nombre");
        }
        CategoriaOferta categoria = mapper.toEntity(request);
        return mapper.toResponse(categoriaRepository.save(categoria));
    }

    @Transactional
    public CategoriaOfertaResponse actualizarCategoria(UUID id, CategoriaOfertaRequest request) {
        CategoriaOferta categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada"));
                
        if (!categoria.getNombre().equalsIgnoreCase(request.getNombre()) && 
            categoriaRepository.existsByNombreIgnoreCase(request.getNombre())) {
            throw new BusinessException("Ya existe otra categoría con este nombre");
        }
        
        categoria.setNombre(request.getNombre());
        categoria.setDescripcion(request.getDescripcion());
        if (request.getActivo() != null) {
            categoria.setActivo(request.getActivo());
        }
        
        return mapper.toResponse(categoriaRepository.save(categoria));
    }

    @Transactional(readOnly = true)
    public CategoriaOfertaResponse obtenerCategoriaPorId(UUID id) {
        return categoriaRepository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada"));
    }

    @Transactional(readOnly = true)
    public Page<CategoriaOfertaResponse> listarCategorias(Pageable pageable) {
        return categoriaRepository.findAll(pageable).map(mapper::toResponse);
    }

    @Transactional
    public void eliminarCategoria(UUID id) {
        CategoriaOferta categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada"));
                
        // Siempre se desactiva lógicamente para preservar integridad referencial
        categoria.setActivo(false);
        categoriaRepository.save(categoria);
    }
}
package com.elp.ofertas_service.service;

import com.elp.ofertas_service.dto.request.OfertaRequest;
import com.elp.ofertas_service.dto.request.RequisitoOfertaRequest;
import com.elp.ofertas_service.dto.response.OfertaPostulacionResponse;
import com.elp.ofertas_service.dto.response.OfertaResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import com.elp.ofertas_service.enums.*;

public interface OfertaService {

    OfertaResponse crearOferta(UUID reclutadorId, UUID empresaId, OfertaRequest request, List<RequisitoOfertaRequest> requisitos);
    
    OfertaResponse actualizarOferta(UUID id, UUID reclutadorId, OfertaRequest request, List<RequisitoOfertaRequest> requisitos);
    
    // La empresa envía la oferta a revisión del admin
    OfertaResponse enviarARevision(UUID id, UUID reclutadorId);

    // Alias retrocompatible para enviar a revisión
    OfertaResponse publicarOferta(UUID id, UUID reclutadorId);

    // El admin aprueba o rechaza la oferta
    OfertaResponse aprobarOferta(UUID id, UUID adminId);

    OfertaResponse rechazarOferta(UUID id, UUID adminId, String motivo);

    OfertaResponse pausarOferta(UUID id, UUID reclutadorId);
    
    OfertaResponse cerrarOferta(UUID id, UUID reclutadorId);
    
    OfertaResponse cancelarOferta(UUID id, UUID reclutadorId);
    
    OfertaResponse obtenerOfertaPorId(UUID id);
    
    OfertaPostulacionResponse validarOferta(UUID id);
    
    Page<OfertaResponse> buscarOfertas(String q, UUID categoriaId, String areaProfesional,
                                       NivelExperiencia nivelExperiencia, TipoContrato tipoContrato,
                                       Modalidad modalidad, Jornada jornada, String departamento,
                                       String provincia, String distrito, BigDecimal salarioMin,
                                       BigDecimal salarioMax, OffsetDateTime fechaPubDesde,
                                       OffsetDateTime fechaPubHasta, UUID empresaId, EstadoOferta estado,
                                       Boolean soloActivas, Pageable pageable);

    Map<UUID, Long> countPublicadasByEmpresaIds(List<UUID> empresaIds);
}
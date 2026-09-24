package com.elp.ofertas_service.service.impl;

import com.elp.ofertas_service.dto.request.OfertaRequest;
import com.elp.ofertas_service.dto.request.RequisitoOfertaRequest;
import com.elp.ofertas_service.dto.response.OfertaPostulacionResponse;
import com.elp.ofertas_service.dto.response.OfertaResponse;
import com.elp.ofertas_service.entity.AuditoriaOferta;
import com.elp.ofertas_service.entity.CategoriaOferta;
import com.elp.ofertas_service.entity.Oferta;
import com.elp.ofertas_service.entity.RequisitoOferta;
import com.elp.ofertas_service.enums.*;
import com.elp.ofertas_service.exception.BusinessException;
import com.elp.ofertas_service.exception.ForbiddenException;
import com.elp.ofertas_service.exception.ResourceNotFoundException;
import com.elp.ofertas_service.mapper.OfertaMapper;
import com.elp.ofertas_service.repository.AuditoriaOfertaRepository;
import com.elp.ofertas_service.repository.CategoriaOfertaRepository;

import com.elp.ofertas_service.repository.OfertaSpecification;
import com.elp.ofertas_service.repository.RequisitoOfertaRepository;
import com.elp.ofertas_service.security.EmpresaAuthorizationService;
import com.elp.ofertas_service.service.EstadoOfertaService;
import com.elp.ofertas_service.service.OfertaService;

import lombok.RequiredArgsConstructor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.HashMap;
import java.util.stream.Collectors;

import com.elp.ofertas_service.repository.OfertaRepository;

@Service
@RequiredArgsConstructor
public class OfertaServiceImpl implements OfertaService {

    private static final Logger log = LoggerFactory.getLogger(OfertaServiceImpl.class);

    private final OfertaRepository ofertaRepository;
    private final RequisitoOfertaRepository requisitoRepository;
    private final CategoriaOfertaRepository categoriaRepository;
    private final AuditoriaOfertaRepository auditoriaRepository;
    private final EstadoOfertaService estadoOfertaService;
    private final EmpresaAuthorizationService empresaAuthorizationService;
    private final OfertaMapper ofertaMapper;

    @Override
    @Transactional
    public OfertaResponse crearOferta(UUID reclutadorId, UUID empresaId, OfertaRequest request, List<RequisitoOfertaRequest> requisitos) {
        if (!empresaAuthorizationService.tienePermisoDePropiedad(reclutadorId, empresaId)) {
            throw new ForbiddenException("No tienes permisos de propietario sobre la empresa indicada");
        }

        validarSalario(request.getSalarioMinimo(), request.getSalarioMaximo());
        validarCategoria(request.getCategoriaId());

        Oferta oferta = Oferta.builder()
                .empresaId(empresaId)
                .reclutadorId(reclutadorId)
                .titulo(request.getTitulo())
                .descripcion(request.getDescripcion())
                .categoriaId(request.getCategoriaId())
                .areaProfesional(request.getAreaProfesional())
                .nivelExperiencia(request.getNivelExperiencia())
                .tipoContrato(request.getTipoContrato())
                .modalidad(request.getModalidad())
                .jornada(request.getJornada())
                .salarioMinimo(request.getSalarioMinimo())
                .salarioMaximo(request.getSalarioMaximo())
                .moneda(request.getMoneda())
                .ubicacion(request.getUbicacion())
                .departamento(request.getDepartamento())
                .provincia(request.getProvincia())
                .distrito(request.getDistrito())
                .pais(request.getPais())
                .fechaVencimiento(request.getFechaVencimiento())
                .estado(EstadoOferta.BORRADOR)
                .aceptaPostulaciones(false)
                .build();

        oferta = ofertaRepository.save(oferta);
        List<RequisitoOferta> reqs = guardarRequisitos(oferta, requisitos);

        registrarAuditoria(reclutadorId, oferta.getId(), "OFERTA_CREADA", "Oferta creada como borrador");

        return ofertaMapper.toResponse(oferta, reqs);
    }

    @Override
    @Transactional
    public OfertaResponse actualizarOferta(UUID id, UUID reclutadorId, OfertaRequest request, List<RequisitoOfertaRequest> requisitos) {
        Oferta oferta = obtenerYValidarAccesoPropiedad(id, reclutadorId);

        if (oferta.getEstado() == EstadoOferta.CERRADA || oferta.getEstado() == EstadoOferta.CANCELADA) {
            throw new BusinessException("No se puede modificar una oferta en estado " + oferta.getEstado());
        }

        validarSalario(request.getSalarioMinimo(), request.getSalarioMaximo());
        validarCategoria(request.getCategoriaId());

        oferta.setTitulo(request.getTitulo());
        oferta.setDescripcion(request.getDescripcion());
        oferta.setCategoriaId(request.getCategoriaId());
        oferta.setAreaProfesional(request.getAreaProfesional());
        oferta.setNivelExperiencia(request.getNivelExperiencia());
        oferta.setTipoContrato(request.getTipoContrato());
        oferta.setModalidad(request.getModalidad());
        oferta.setJornada(request.getJornada());
        oferta.setSalarioMinimo(request.getSalarioMinimo());
        oferta.setSalarioMaximo(request.getSalarioMaximo());
        oferta.setMoneda(request.getMoneda());
        oferta.setUbicacion(request.getUbicacion());
        oferta.setDepartamento(request.getDepartamento());
        oferta.setProvincia(request.getProvincia());
        oferta.setDistrito(request.getDistrito());
        oferta.setPais(request.getPais());
        oferta.setFechaVencimiento(request.getFechaVencimiento());

        // Recalcular estado de expiracion si aplica
        actualizarExpiracion(oferta);

        oferta = ofertaRepository.save(oferta);
        
        // Actualizar requisitos
        requisitoRepository.deleteAll(requisitoRepository.findByOfertaId(id));
        List<RequisitoOferta> reqs = guardarRequisitos(oferta, requisitos);

        registrarAuditoria(reclutadorId, oferta.getId(), "OFERTA_ACTUALIZADA", "Oferta modificada");

        return ofertaMapper.toResponse(oferta, reqs);
    }

    @Override
    @Transactional
    public OfertaResponse enviarARevision(UUID id, UUID reclutadorId) {
        Oferta oferta = obtenerYValidarAccesoPropiedad(id, reclutadorId);

        if (oferta.getFechaVencimiento() == null || oferta.getFechaVencimiento().isBefore(OffsetDateTime.now())) {
            throw new BusinessException("No se puede enviar a revision una oferta sin fecha de vencimiento valida");
        }

        estadoOfertaService.validarTransicion(oferta.getEstado(), EstadoOferta.PENDIENTE_APROBACION);

        oferta.setEstado(EstadoOferta.PENDIENTE_APROBACION);
        oferta = ofertaRepository.save(oferta);
        registrarAuditoria(reclutadorId, oferta.getId(), "OFERTA_ENVIADA_A_REVISION",
                "Oferta enviada a revision del administrador");
        return ofertaMapper.toResponse(oferta, requisitoRepository.findByOfertaId(id));
    }

    @Override
    @Transactional
    public OfertaResponse publicarOferta(UUID id, UUID reclutadorId) {
        return enviarARevision(id, reclutadorId);
    }

    @Override
    @Transactional
    public OfertaResponse aprobarOferta(UUID id, UUID adminId) {
        Oferta oferta = ofertaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Oferta no encontrada"));

        estadoOfertaService.validarTransicion(oferta.getEstado(), EstadoOferta.PUBLICADA);

        oferta.setEstado(EstadoOferta.PUBLICADA);
        oferta.setAceptaPostulaciones(true);
        if (oferta.getFechaPublicacion() == null) {
            oferta.setFechaPublicacion(OffsetDateTime.now());
        }
        // Si la fecha de vencimiento ya expiró o no existe, extenderla automáticamente 30 días para que esté vigente
        if (oferta.getFechaVencimiento() == null || oferta.getFechaVencimiento().isBefore(OffsetDateTime.now())) {
            oferta.setFechaVencimiento(OffsetDateTime.now().plusDays(30));
        }

        oferta = ofertaRepository.save(oferta);
        registrarAuditoria(adminId, oferta.getId(), "OFERTA_APROBADA",
                "Oferta aprobada por administrador y publicada");
        return ofertaMapper.toResponse(oferta, requisitoRepository.findByOfertaId(id));
    }

    @Override
    @Transactional
    public OfertaResponse rechazarOferta(UUID id, UUID adminId, String motivo) {
        Oferta oferta = ofertaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Oferta no encontrada"));

        estadoOfertaService.validarTransicion(oferta.getEstado(), EstadoOferta.RECHAZADA);

        oferta.setEstado(EstadoOferta.RECHAZADA);
        oferta.setAceptaPostulaciones(false);

        oferta = ofertaRepository.save(oferta);
        String desc = motivo != null && !motivo.isBlank()
                ? "Oferta rechazada por administrador. Motivo: " + motivo
                : "Oferta rechazada por administrador";
        registrarAuditoria(adminId, oferta.getId(), "OFERTA_RECHAZADA", desc);
        return ofertaMapper.toResponse(oferta, requisitoRepository.findByOfertaId(id));
    }

    @Override
    @Transactional
    public OfertaResponse pausarOferta(UUID id, UUID reclutadorId) {
        Oferta oferta = obtenerYValidarAccesoModeracion(id, reclutadorId);
        
        estadoOfertaService.validarTransicion(oferta.getEstado(), EstadoOferta.PAUSADA);
        
        oferta.setEstado(EstadoOferta.PAUSADA);
        oferta.setAceptaPostulaciones(false);

        oferta = ofertaRepository.save(oferta);
        registrarAuditoria(reclutadorId, oferta.getId(), "OFERTA_PAUSADA", "Oferta pausada temporalmente");
        return ofertaMapper.toResponse(oferta, requisitoRepository.findByOfertaId(id));
    }

    @Override
    @Transactional
    public OfertaResponse cerrarOferta(UUID id, UUID reclutadorId) {
        Oferta oferta = obtenerYValidarAccesoModeracion(id, reclutadorId);
        
        estadoOfertaService.validarTransicion(oferta.getEstado(), EstadoOferta.CERRADA);
        
        oferta.setEstado(EstadoOferta.CERRADA);
        oferta.setAceptaPostulaciones(false);
        oferta.setFechaCierre(OffsetDateTime.now());

        oferta = ofertaRepository.save(oferta);
        registrarAuditoria(reclutadorId, oferta.getId(), "OFERTA_CERRADA", "Oferta cerrada definitivamente");
        return ofertaMapper.toResponse(oferta, requisitoRepository.findByOfertaId(id));
    }

    @Override
    @Transactional
    public OfertaResponse cancelarOferta(UUID id, UUID reclutadorId) {
        Oferta oferta = obtenerYValidarAccesoModeracion(id, reclutadorId);
        
        estadoOfertaService.validarTransicion(oferta.getEstado(), EstadoOferta.CANCELADA);
        
        oferta.setEstado(EstadoOferta.CANCELADA);
        oferta.setAceptaPostulaciones(false);

        oferta = ofertaRepository.save(oferta);
        registrarAuditoria(reclutadorId, oferta.getId(), "OFERTA_CANCELADA", "Oferta cancelada en borrador");
        return ofertaMapper.toResponse(oferta, requisitoRepository.findByOfertaId(id));
    }

    @Override
    @Transactional(readOnly = true)
    public OfertaResponse obtenerOfertaPorId(UUID id) {
        Oferta oferta = ofertaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Oferta no encontrada"));
        
        // Idempotencia: Verificar expiracion al vuelo si no se ha marcado por cron
        actualizarExpiracionAlVuelo(oferta);
        
        return ofertaMapper.toResponse(oferta, requisitoRepository.findByOfertaId(id));
    }

    @Override
    @Transactional(readOnly = true)
    public OfertaPostulacionResponse validarOferta(UUID id) {
        Oferta oferta = ofertaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Oferta no encontrada"));
                
        actualizarExpiracionAlVuelo(oferta);
        return ofertaMapper.toPostulacionResponse(oferta);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OfertaResponse> buscarOfertas(String q, UUID categoriaId, String areaProfesional,
                                              NivelExperiencia nivelExperiencia, TipoContrato tipoContrato,
                                              Modalidad modalidad, Jornada jornada, String departamento,
                                              String provincia, String distrito, BigDecimal salarioMin,
                                              BigDecimal salarioMax, OffsetDateTime fechaPubDesde,
                                              OffsetDateTime fechaPubHasta, UUID empresaId, EstadoOferta estado,
                                              Boolean soloActivas, Pageable pageable) {
        return ofertaRepository.findAll(OfertaSpecification.conFiltros(
                        q, categoriaId, areaProfesional, nivelExperiencia, tipoContrato, modalidad, jornada,
                        departamento, provincia, distrito, salarioMin, salarioMax, fechaPubDesde, fechaPubHasta,
                        empresaId, estado, soloActivas), pageable)
                .map(oferta -> {
                    actualizarExpiracionAlVuelo(oferta);
                    return ofertaMapper.toResponse(oferta, null); // Sin requisitos completos para resumen
                });
    }

    @Override
    @Transactional(readOnly = true)
    public Map<UUID, Long> countPublicadasByEmpresaIds(List<UUID> empresaIds) {
        if (empresaIds == null || empresaIds.isEmpty()) return new HashMap<>();
        List<Object[]> results = ofertaRepository.countPublicadasByEmpresaIds(empresaIds);
        Map<UUID, Long> counts = new HashMap<>();
        for (Object[] row : results) {
            counts.put((UUID) row[0], ((Number) row[1]).longValue());
        }
        return counts;
    }

    // --- Helper Methods ---

    private Oferta obtenerYValidarAccesoPropiedad(UUID id, UUID usuarioId) {
        Oferta oferta = ofertaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Oferta no encontrada"));
        if (!empresaAuthorizationService.tienePermisoDePropiedad(usuarioId, oferta.getEmpresaId())) {
            throw new ForbiddenException("No tienes permiso de propietario sobre esta oferta");
        }
        return oferta;
    }

    private Oferta obtenerYValidarAccesoModeracion(UUID id, UUID usuarioId) {
        Oferta oferta = ofertaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Oferta no encontrada"));
        if (!empresaAuthorizationService.tienePermisoDeModeracion(usuarioId, oferta.getEmpresaId())) {
            throw new ForbiddenException("No tienes permisos para modificar o moderar esta oferta");
        }
        return oferta;
    }

    private void validarSalario(BigDecimal min, BigDecimal max) {
        if (min != null && max != null && min.compareTo(max) > 0) {
            throw new BusinessException("El salario maximo no puede ser menor al minimo");
        }
    }

    private void validarCategoria(UUID categoriaId) {
        if (!categoriaRepository.existsById(categoriaId)) {
            throw new BusinessException("La categoria especificada no existe");
        }
    }

    private List<RequisitoOferta> guardarRequisitos(Oferta oferta, List<RequisitoOfertaRequest> requisitosDTO) {
        if (requisitosDTO == null || requisitosDTO.isEmpty()) return List.of();
        
        List<RequisitoOferta> reqs = requisitosDTO.stream().map(dto -> RequisitoOferta.builder()
                .oferta(oferta)
                .descripcion(dto.getDescripcion())
                .tipo(dto.getTipo())
                .obligatorio(dto.getObligatorio())
                .nivel(dto.getNivel())
                .build()).collect(Collectors.toList());
        return requisitoRepository.saveAll(reqs);
    }

    private void registrarAuditoria(UUID usuarioId, UUID ofertaId, String accion, String descripcion) {
        AuditoriaOferta auditoria = AuditoriaOferta.builder()
                .usuarioId(usuarioId)
                .ofertaId(ofertaId)
                .accion(accion)
                .descripcion(descripcion)
                .traceId(MDC.get("traceId"))
                .build();
        auditoriaRepository.save(auditoria);
    }

    private void actualizarExpiracion(Oferta oferta) {
        if (oferta.getFechaVencimiento() != null && oferta.getFechaVencimiento().isBefore(OffsetDateTime.now())) {
            if (oferta.getEstado() == EstadoOferta.PUBLICADA || oferta.getEstado() == EstadoOferta.PAUSADA) {
                oferta.setEstado(EstadoOferta.VENCIDA);
                oferta.setAceptaPostulaciones(false);
            }
        }
    }

    private void actualizarExpiracionAlVuelo(Oferta oferta) {
        // Idempotencia transitoria en lectura: Si el scheduler no alcanzo a marcarla, lo marcamos en memoria
        // IMPORTANTE: Al ser llamado desde transacciones readOnly = true, esta modificacion no se persiste
        // en base de datos. Sirve unicamente para retornar el estado VENCIDA al cliente en esta peticion.
        // La persistencia real requerira un Scheduler futuro.
        if (oferta.getFechaVencimiento() != null && oferta.getFechaVencimiento().isBefore(OffsetDateTime.now())) {
            if (oferta.getEstado() == EstadoOferta.PUBLICADA || oferta.getEstado() == EstadoOferta.PAUSADA) {
                oferta.setEstado(EstadoOferta.VENCIDA);
                oferta.setAceptaPostulaciones(false);
            }
        }
    }
}
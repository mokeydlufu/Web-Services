package com.elp.ofertas_service.controller;

import com.elp.ofertas_service.dto.request.OfertaRequest;
import com.elp.ofertas_service.dto.request.RequisitoOfertaRequest;
import com.elp.ofertas_service.dto.response.EmpleoPublicoDTO;
import com.elp.ofertas_service.dto.response.OfertaPostulacionResponse;
import com.elp.ofertas_service.dto.response.OfertaResponse;
import com.elp.ofertas_service.enums.*;
import com.elp.ofertas_service.security.SecurityUtils;
import com.elp.ofertas_service.service.EmpleosPublicosService;
import com.elp.ofertas_service.service.OfertaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ofertas")
@RequiredArgsConstructor
public class OfertaController {

    private final OfertaService ofertaService;
    private final EmpleosPublicosService empleosPublicosService;
    private final com.elp.ofertas_service.repository.OfertaRepository ofertaRepository;

    @GetMapping("/admin/stats")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'MODERADOR')")
    public ResponseEntity<java.util.Map<String, Object>> obtenerEstadisticasAdmin() {
        long totalOfertas = ofertaRepository.count();
        long publicadas = ofertaRepository.countByEstado(EstadoOferta.PUBLICADA);
        long pendientes = ofertaRepository.countByEstado(EstadoOferta.PENDIENTE_APROBACION);
        long borradores = ofertaRepository.countByEstado(EstadoOferta.BORRADOR);

        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("totalOfertas", totalOfertas);
        stats.put("publicadas", publicadas);
        stats.put("pendientes", pendientes);
        stats.put("borradores", borradores);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/publicas")
    public ResponseEntity<Page<EmpleoPublicoDTO>> buscarEmpleosPublicos(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String ubicacion,
            @RequestParam(required = false) String tipoEmpleo,
            @RequestParam(required = false) String origen,
            @RequestParam(required = false, defaultValue = "false") Boolean incluirRemotos,
            @PageableDefault(size = 12) Pageable pageable) {

        int size = Math.min(pageable.getPageSize(), 100);
        Pageable cappedPageable = org.springframework.data.domain.PageRequest.of(pageable.getPageNumber(), size, pageable.getSort());

        return ResponseEntity.ok(empleosPublicosService.buscarEmpleosPublicos(q, ubicacion, tipoEmpleo, origen, incluirRemotos, cappedPageable));
    }

    @PostMapping("/publicas/conteo-por-empresa")
    public ResponseEntity<java.util.Map<UUID, Long>> obtenerConteoPorEmpresa(@RequestBody List<UUID> empresaIds) {
        return ResponseEntity.ok(ofertaService.countPublicadasByEmpresaIds(empresaIds));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'EMPRESA', 'ADMINISTRADOR')")
    public ResponseEntity<OfertaResponse> crearOferta(@RequestParam UUID empresaId,
                                                      @Valid @RequestBody OfertaRequestWrapper wrapper) {
        UUID reclutadorId = SecurityUtils.getUsuarioLogueadoId();
        return new ResponseEntity<>(ofertaService.crearOferta(reclutadorId, empresaId, wrapper.getOferta(), wrapper.getRequisitos()), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'EMPRESA', 'ADMINISTRADOR')")
    public ResponseEntity<OfertaResponse> actualizarOferta(@PathVariable UUID id,
                                                           @Valid @RequestBody OfertaRequestWrapper wrapper) {
        UUID reclutadorId = SecurityUtils.getUsuarioLogueadoId();
        return ResponseEntity.ok(ofertaService.actualizarOferta(id, reclutadorId, wrapper.getOferta(), wrapper.getRequisitos()));
    }

    @PatchMapping("/{id}/enviar-revision")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'EMPRESA', 'ADMINISTRADOR')")
    public ResponseEntity<OfertaResponse> enviarARevision(@PathVariable UUID id) {
        return ResponseEntity.ok(ofertaService.enviarARevision(id, SecurityUtils.getUsuarioLogueadoId()));
    }

    @PatchMapping("/{id}/publicar")
    @PreAuthorize("hasAnyRole('RECLUTADOR', 'EMPRESA', 'ADMINISTRADOR')")
    public ResponseEntity<OfertaResponse> publicarOferta(@PathVariable UUID id) {
        return ResponseEntity.ok(ofertaService.publicarOferta(id, SecurityUtils.getUsuarioLogueadoId()));
    }

    @PatchMapping("/{id}/aprobar")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'MODERADOR')")
    public ResponseEntity<OfertaResponse> aprobarOferta(@PathVariable UUID id) {
        return ResponseEntity.ok(ofertaService.aprobarOferta(id, SecurityUtils.getUsuarioLogueadoId()));
    }

    @PatchMapping("/{id}/rechazar")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'MODERADOR')")
    public ResponseEntity<OfertaResponse> rechazarOferta(@PathVariable UUID id,
                                                          @RequestParam(required = false) String motivo) {
        return ResponseEntity.ok(ofertaService.rechazarOferta(id, SecurityUtils.getUsuarioLogueadoId(), motivo));
    }

    @PatchMapping("/{id}/pausar")
    @PreAuthorize("hasAnyRole('EMPRESA', 'RECLUTADOR', 'ADMINISTRADOR')")
    public ResponseEntity<OfertaResponse> pausarOferta(@PathVariable UUID id) {
        return ResponseEntity.ok(ofertaService.pausarOferta(id, SecurityUtils.getUsuarioLogueadoId()));
    }

    @PatchMapping("/{id}/cerrar")
    @PreAuthorize("hasAnyRole('EMPRESA', 'RECLUTADOR', 'ADMINISTRADOR')")
    public ResponseEntity<OfertaResponse> cerrarOferta(@PathVariable UUID id) {
        return ResponseEntity.ok(ofertaService.cerrarOferta(id, SecurityUtils.getUsuarioLogueadoId()));
    }

    @PatchMapping("/{id}/cancelar")
    @PreAuthorize("hasAnyRole('EMPRESA', 'RECLUTADOR', 'ADMINISTRADOR')")
    public ResponseEntity<OfertaResponse> cancelarOferta(@PathVariable UUID id) {
        return ResponseEntity.ok(ofertaService.cancelarOferta(id, SecurityUtils.getUsuarioLogueadoId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OfertaResponse> obtenerOfertaPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(ofertaService.obtenerOfertaPorId(id));
    }

    @GetMapping("/{id}/estado-postulacion")
    public ResponseEntity<OfertaPostulacionResponse> obtenerEstadoParaPostulacion(@PathVariable UUID id) {
        return ResponseEntity.ok(ofertaService.validarOferta(id));
    }

    @GetMapping
    public ResponseEntity<Page<OfertaResponse>> buscarOfertas(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) UUID categoriaId,
            @RequestParam(required = false) String areaProfesional,
            @RequestParam(required = false) NivelExperiencia nivelExperiencia,
            @RequestParam(required = false) TipoContrato tipoContrato,
            @RequestParam(required = false) Modalidad modalidad,
            @RequestParam(required = false) Jornada jornada,
            @RequestParam(required = false) String departamento,
            @RequestParam(required = false) String provincia,
            @RequestParam(required = false) String distrito,
            @RequestParam(required = false) BigDecimal salarioMin,
            @RequestParam(required = false) BigDecimal salarioMax,
            @RequestParam(required = false) OffsetDateTime fechaPubDesde,
            @RequestParam(required = false) OffsetDateTime fechaPubHasta,
            @RequestParam(required = false) UUID empresaId,
            @RequestParam(required = false) EstadoOferta estado,
            @RequestParam(required = false) Boolean soloActivas,
            @PageableDefault(size = 20) Pageable pageable) {

        int size = Math.min(pageable.getPageSize(), 100);
        Pageable cappedPageable = org.springframework.data.domain.PageRequest.of(pageable.getPageNumber(), size, pageable.getSort());
        
        return ResponseEntity.ok(ofertaService.buscarOfertas(
                q, categoriaId, areaProfesional, nivelExperiencia, tipoContrato, modalidad, jornada,
                departamento, provincia, distrito, salarioMin, salarioMax, fechaPubDesde, fechaPubHasta,
                empresaId, estado, soloActivas, cappedPageable));
    }

    @lombok.Data
    public static class OfertaRequestWrapper {
        @Valid
        @jakarta.validation.constraints.NotNull
        private OfertaRequest oferta;
        @Valid
        private List<RequisitoOfertaRequest> requisitos;
    }
}

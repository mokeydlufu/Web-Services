package com.elp.postulaciones_service.controller;

import com.elp.postulaciones_service.dto.postulacion.PostulacionRequest;
import com.elp.postulaciones_service.dto.postulacion.PostulacionResponse;
import com.elp.postulaciones_service.dto.ia.GenerarCartaIaRequest;
import com.elp.postulaciones_service.dto.ia.GenerarCartaIaResponse;
import com.elp.postulaciones_service.model.enums.EstadoPostulacion;
import com.elp.postulaciones_service.service.PostulacionService;
import com.elp.postulaciones_service.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/postulaciones")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Postulaciones", description = "Gestiona todo el ciclo de vida de las postulaciones")
@SecurityRequirement(name = "bearerAuth")
public class PostulacionController {

    private final PostulacionService postulacionService;
    private final com.elp.postulaciones_service.repository.PostulacionRepository postulacionRepository;

    @GetMapping("/admin/stats")
    @PreAuthorize("hasRole('ADMINISTRADOR') or hasRole('ADMIN')")
    @Operation(summary = "Estadísticas de postulaciones para el administrador")
    public ResponseEntity<java.util.Map<String, Object>> obtenerEstadisticasAdmin() {
        java.util.Calendar cal = java.util.Calendar.getInstance();
        cal.set(java.util.Calendar.DAY_OF_MONTH, 1);
        cal.set(java.util.Calendar.HOUR_OF_DAY, 0);
        cal.set(java.util.Calendar.MINUTE, 0);
        cal.set(java.util.Calendar.SECOND, 0);
        cal.set(java.util.Calendar.MILLISECOND, 0);
        java.sql.Timestamp inicioMes = new java.sql.Timestamp(cal.getTimeInMillis());

        long total = postulacionRepository.count();
        long mes = postulacionRepository.countByFechaPostulacionGreaterThanEqual(inicioMes);

        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("totalPostulaciones", total);
        stats.put("postulacionesMes", mes);
        return ResponseEntity.ok(stats);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ESTUDIANTE', 'PROFESIONAL', 'CANDIDATO')")
    @Operation(summary = "Crear postulacion con CV", description = "Crea una nueva postulacion con archivo CV opcional (PDF, DOC, DOCX)")
    public ResponseEntity<PostulacionResponse> crearPostulacion(
            @Valid @ModelAttribute PostulacionRequest request,
            @RequestParam(value = "cvFile", required = false) MultipartFile cvFile,
            @RequestParam(value = "archivo", required = false) MultipartFile archivo) {
        
        MultipartFile fileToUse = (cvFile != null && !cvFile.isEmpty()) ? cvFile : archivo;
        UUID candidatoId = SecurityUtils.getUsuarioLogueadoId();
        
        log.info("Recibiendo postulación multipart de candidato {} para oferta {}", 
                candidatoId, request.getOfertaId());
        
        if (fileToUse != null && !fileToUse.isEmpty()) {
            log.info("Archivo CV recibido: {}, Tamaño: {} bytes, Tipo: {}", 
                    fileToUse.getOriginalFilename(), fileToUse.getSize(), fileToUse.getContentType());
        } else {
            log.info("No se recibió archivo CV adjunto en la postulación multipart (se usará CV guardado o URL)");
        }
        
        PostulacionResponse response = postulacionService.crearPostulacion(candidatoId, request, fileToUse);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping(value = "/json", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ESTUDIANTE', 'PROFESIONAL', 'CANDIDATO')")
    @Operation(summary = "Crear postulacion en formato JSON", description = "Crea una nueva postulacion enviando datos como JSON sin archivo adjunto")
    public ResponseEntity<PostulacionResponse> crearPostulacionJson(
            @Valid @RequestBody PostulacionRequest request) {
        
        UUID candidatoId = SecurityUtils.getUsuarioLogueadoId();
        log.info("Recibiendo postulación JSON de candidato {} para oferta {}", candidatoId, request.getOfertaId());
        
        PostulacionResponse response = postulacionService.crearPostulacion(candidatoId, request, null);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{uuid}")
    @Operation(summary = "Obtener postulacion por UUID", description = "Verifica proteccion IDOR automaticamente")
    public ResponseEntity<PostulacionResponse> obtenerPostulacion(@PathVariable UUID uuid) {
        UUID usuarioId = SecurityUtils.getUsuarioLogueadoId();
        String rol = SecurityUtils.getRolUsuarioLogueado();
        PostulacionResponse response = postulacionService.obtenerPostulacion(uuid, usuarioId, rol);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{uuid}/estado")
    @PreAuthorize("hasRole('EMPRESA') or hasRole('RECLUTADOR') or hasRole('ADMIN') or hasRole('ADMINISTRADOR')")
    @Operation(summary = "Cambiar estado de postulacion", description = "Avanza o rechaza una postulacion (solo reclutadores)")
    public ResponseEntity<PostulacionResponse> cambiarEstado(
            @PathVariable UUID uuid,
            @RequestParam EstadoPostulacion nuevoEstado,
            @RequestParam(required = false) String comentario) {
        
        UUID usuarioId = SecurityUtils.getUsuarioLogueadoId();
        String rol = SecurityUtils.getRolUsuarioLogueado();
        postulacionService.obtenerPostulacion(uuid, usuarioId, rol); // Validacion IDOR
        
        PostulacionResponse response = postulacionService.cambiarEstado(uuid, nuevoEstado, usuarioId, comentario);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{uuid}/retirar")
    @PreAuthorize("hasRole('ESTUDIANTE') or hasRole('PROFESIONAL') or hasRole('CANDIDATO')")
    @Operation(summary = "Retirar postulacion", description = "El candidato retira su propia postulacion activa")
    public ResponseEntity<PostulacionResponse> retirarPostulacion(
            @PathVariable UUID uuid,
            @RequestParam(required = false) String motivo) {
        UUID candidatoId = SecurityUtils.getUsuarioLogueadoId();
        PostulacionResponse response = postulacionService.retirarPostulacion(uuid, candidatoId, motivo);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/mis-postulaciones")
    @PreAuthorize("hasRole('ESTUDIANTE') or hasRole('PROFESIONAL') or hasRole('CANDIDATO')")
    @Operation(summary = "Listar mis postulaciones", description = "Lista paginada de postulaciones del usuario autenticado")
    public ResponseEntity<Page<PostulacionResponse>> listarMisPostulaciones(
            @RequestParam(required = false) EstadoPostulacion estado,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        int validSize = size > 100 ? 100 : size;
        Pageable pageable = PageRequest.of(page, validSize);
        UUID candidatoId = SecurityUtils.getUsuarioLogueadoId();
        Page<PostulacionResponse> response = postulacionService.listarMisPostulaciones(candidatoId, estado, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/ofertas/{ofertaId}")
    @PreAuthorize("hasRole('EMPRESA') or hasRole('RECLUTADOR') or hasRole('ADMIN') or hasRole('ADMINISTRADOR')")
    @Operation(summary = "Listar postulaciones de una oferta", description = "Lista paginada de postulantes para una oferta especifica")
    public ResponseEntity<Page<PostulacionResponse>> listarPorOferta(
            @PathVariable UUID ofertaId,
            @RequestParam(required = false) EstadoPostulacion estado,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        int validSize = size > 100 ? 100 : size;
        Pageable pageable = PageRequest.of(page, validSize);
        UUID empresaIdLogueada = SecurityUtils.getUsuarioLogueadoId();
        Page<PostulacionResponse> response = postulacionService.listarPostulacionesPorOferta(ofertaId, empresaIdLogueada, estado, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/empresa")
    @PreAuthorize("hasRole('EMPRESA') or hasRole('RECLUTADOR') or hasRole('ADMIN') or hasRole('ADMINISTRADOR')")
    @Operation(summary = "Listar todas las postulaciones de la empresa", description = "Lista paginada de todos los postulantes para las ofertas de la empresa")
    public ResponseEntity<Page<PostulacionResponse>> listarPorEmpresa(
            @RequestParam(required = false) UUID empresaId,
            @RequestParam(required = false) UUID ofertaId,
            @RequestParam(required = false) EstadoPostulacion estado,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        int validSize = size > 100 ? 100 : size;
        Pageable pageable = PageRequest.of(page, validSize);
        UUID targetEmpresaId = empresaId != null ? empresaId : SecurityUtils.getUsuarioLogueadoId();
        String rol = SecurityUtils.getRolUsuarioLogueado();
        
        if (empresaId != null && !empresaId.equals(SecurityUtils.getUsuarioLogueadoId())) {
            if (!("ADMIN".equals(rol) || "ADMINISTRADOR".equals(rol))) {
                throw new com.elp.postulaciones_service.exception.ForbiddenException("No tienes permiso para consultar postulaciones de otra empresa");
            }
        }
        
        if (empresaId == null && ("ADMIN".equals(rol) || "ADMINISTRADOR".equals(rol))) {
            targetEmpresaId = null;
        }
        Page<PostulacionResponse> response = postulacionService.listarPostulacionesPorEmpresa(targetEmpresaId, ofertaId, estado, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{uuid}/cv")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Visualizar o descargar CV en PDF", description = "Descarga los bytes del CV con validación de seguridad (solo candidato dueño, empresa de la postulación o admin)")
    public ResponseEntity<byte[]> verCv(@PathVariable UUID uuid) {
        UUID usuarioId = SecurityUtils.getUsuarioLogueadoId();
        String rol = SecurityUtils.getRolUsuarioLogueado();
        byte[] pdfBytes = postulacionService.descargarCv(uuid, usuarioId, rol);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(
            ContentDisposition.inline()
                .filename("CV_Candidato_" + uuid.toString().substring(0, 8) + ".pdf")
                .build()
        );
        
        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    @DeleteMapping("/{uuid}")
    @PreAuthorize("hasRole('EMPRESA') or hasRole('RECLUTADOR') or hasRole('ADMIN') or hasRole('ADMINISTRADOR')")
    @Operation(summary = "Eliminar postulación", description = "La empresa elimina permanentemente una postulación de candidato")
    public ResponseEntity<Void> eliminarPostulacion(@PathVariable UUID uuid) {
        UUID empresaId = SecurityUtils.getUsuarioLogueadoId();
        postulacionService.eliminarPostulacion(uuid, empresaId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/ia/carta-presentacion")
    @PreAuthorize("hasAnyRole('ESTUDIANTE', 'PROFESIONAL', 'CANDIDATO')")
    @Operation(summary = "Generar borrador de carta de presentación con IA", description = "Genera un borrador personalizado usando Gemini AI con datos reales del estudiante y de la oferta")
    public ResponseEntity<GenerarCartaIaResponse> generarCartaConIa(
            @Valid @RequestBody GenerarCartaIaRequest request) {
        UUID candidatoId = SecurityUtils.getUsuarioLogueadoId();
        GenerarCartaIaResponse response = postulacionService.generarBorradorCarta(request, candidatoId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{uuid}/reanalizar-ia")
    @PreAuthorize("hasAnyRole('EMPRESA', 'RECLUTADOR', 'ADMIN', 'ADMINISTRADOR')")
    @Operation(summary = "Reanalizar CV con IA", description = "Vuelve a evaluar el CV de la postulación contra los requisitos de la vacante usando Gemini AI o contingencia")
    public ResponseEntity<PostulacionResponse> reanalizarPostulacionIa(@PathVariable UUID uuid) {
        UUID usuarioId = SecurityUtils.getUsuarioLogueadoId();
        String rol = SecurityUtils.getRolUsuarioLogueado();
        log.info("Solicitud de reanálisis IA para postulación {} por usuario {} [{}]", uuid, usuarioId, rol);
        PostulacionResponse response = postulacionService.reanalizarPostulacionIa(uuid, usuarioId, rol);
        return ResponseEntity.ok(response);
    }
}

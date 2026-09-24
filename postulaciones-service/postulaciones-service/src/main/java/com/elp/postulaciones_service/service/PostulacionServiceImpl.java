package com.elp.postulaciones_service.service;

import com.elp.postulaciones_service.client.OfertasClient;
import com.elp.postulaciones_service.client.UsuariosClient;
import com.elp.postulaciones_service.dto.ResultadoEvaluacionDTO;
import com.elp.postulaciones_service.dto.externo.OfertaDetalleDTO;
import com.elp.postulaciones_service.dto.externo.OfertaResumenDTO;
import com.elp.postulaciones_service.dto.externo.PerfilEstudianteDetalleDTO;
import com.elp.postulaciones_service.dto.externo.UsuarioResumenDTO;
import com.elp.postulaciones_service.dto.ia.GenerarCartaIaRequest;
import com.elp.postulaciones_service.dto.ia.GenerarCartaIaResponse;
import com.elp.postulaciones_service.dto.postulacion.PostulacionRequest;
import com.elp.postulaciones_service.dto.postulacion.PostulacionResponse;
import com.elp.postulaciones_service.exception.BusinessException;
import com.elp.postulaciones_service.exception.DuplicatePostulationException;
import com.elp.postulaciones_service.exception.ForbiddenException;
import com.elp.postulaciones_service.exception.ResourceNotFoundException;
import com.elp.postulaciones_service.mapper.PostulacionMapper;
import com.elp.postulaciones_service.model.AuditoriaPostulacion;
import com.elp.postulaciones_service.model.HistorialPostulacion;
import com.elp.postulaciones_service.model.Postulacion;
import com.elp.postulaciones_service.model.enums.EstadoPostulacion;
import com.elp.postulaciones_service.repository.AuditoriaPostulacionRepository;
import com.elp.postulaciones_service.repository.EntrevistaRepository;
import com.elp.postulaciones_service.repository.EvaluacionPostulacionRepository;
import com.elp.postulaciones_service.repository.HistorialPostulacionRepository;
import com.elp.postulaciones_service.repository.PostulacionRepository;
import com.elp.postulaciones_service.security.EmpresaAuthorizationService;
import com.elp.postulaciones_service.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostulacionServiceImpl implements PostulacionService {

    @PersistenceContext
    private EntityManager entityManager;

    private final PostulacionRepository postulacionRepository;
    private final HistorialPostulacionRepository historialRepository;
    private final AuditoriaPostulacionRepository auditoriaRepository;
    private final EvaluacionPostulacionRepository evaluacionRepository;
    private final EntrevistaRepository entrevistaRepository;
    private final EstadoPostulacionService estadoPostulacionService;
    private final PostulacionMapper postulacionMapper;

    private final OfertasClient ofertasClient;
    private final UsuariosClient usuariosClient;

    // Servicios para CV e Inteligencia Artificial
    private final CloudinaryService cloudinaryService;
    private final GeminiAiService geminiAiService;
    private final EmpresaAuthorizationService empresaAuthorizationService;

    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build();

    @Override
    @Transactional
    public PostulacionResponse crearPostulacion(UUID candidatoId, PostulacionRequest request, MultipartFile cvFile) {
        log.info("Iniciando creación de postulación para candidato {} en oferta {}", candidatoId,
                request.getOfertaId());

        // Validar si existe postulación previa para esta oferta
        Optional<Postulacion> postulacionExistenteOpt = postulacionRepository.findByCandidatoIdAndOfertaId(candidatoId,
                request.getOfertaId());
        boolean esReactivacion = false;
        EstadoPostulacion estadoAnteriorReactivacion = null;
        Postulacion postulacion;

        if (postulacionExistenteOpt.isPresent()) {
            Postulacion existente = postulacionExistenteOpt.get();
            EstadoPostulacion estadoActual = existente.getEstado();
            // Si la postulación previa no está RETIRADA ni CANCELADA, se bloquea por
            // duplicado
            if (estadoActual != EstadoPostulacion.RETIRADA && estadoActual != EstadoPostulacion.CANCELADA) {
                throw new DuplicatePostulationException(
                        "El candidato ya tiene una postulacion activa para esta oferta.");
            }
            // Si estaba RETIRADA o CANCELADA, se permite reactivar la postulación
            postulacion = existente;
            postulacion.setFechaPostulacion(new Timestamp(System.currentTimeMillis()));
            postulacion.setEstado(EstadoPostulacion.ENVIADA);
            esReactivacion = true;
            estadoAnteriorReactivacion = estadoActual;
            log.info("Reactivando postulación previa {} en estado {} para candidato {} y oferta {}",
                    existente.getUuid(), estadoActual, candidatoId, request.getOfertaId());
        } else if (postulacionRepository.existsByCandidatoIdAndOfertaId(candidatoId, request.getOfertaId())) {
            throw new DuplicatePostulationException("El candidato ya tiene una postulacion activa para esta oferta.");
        } else {
            postulacion = new Postulacion();
            postulacion.setCandidatoId(candidatoId);
            postulacion.setOfertaId(request.getOfertaId());
            postulacion.setEstado(EstadoPostulacion.ENVIADA);
        }

        String jwt = SecurityUtils.getJwtToken();

        // 1. Validar existencia del candidato
        usuariosClient.obtenerResumenCandidato(candidatoId, jwt);

        // 2. Validar oferta y obtener información
        OfertaResumenDTO oferta = ofertasClient.validarOferta(request.getOfertaId(), jwt);
        if (!Boolean.TRUE.equals(oferta.getAceptaPostulaciones()) ||
                (!"ACTIVA".equals(oferta.getEstado()) && !"PUBLICADA".equals(oferta.getEstado()))) {
            throw new BusinessException("La oferta no acepta postulaciones actualmente.");
        }
        if (request.getEmpresaId() == null) {
            request.setEmpresaId(oferta.getEmpresaId());
        } else if (!oferta.getEmpresaId().equals(request.getEmpresaId())) {
            throw new BusinessException("Discrepancia en la empresa: la oferta no pertenece a la empresa indicada.");
        }

        // 3. Asignar empresaId asegurando el id verificado de la oferta
        UUID empresaId = oferta.getEmpresaId() != null ? oferta.getEmpresaId() : request.getEmpresaId();
        postulacion.setEmpresaId(empresaId);

        if (request.getCartaPresentacion() != null) {
            String carta = request.getCartaPresentacion().trim();
            if (carta.length() > 3000) {
                throw new BusinessException("La carta de presentación no puede superar los 3000 caracteres.");
            }
            if (carta.isEmpty()) {
                request.setCartaPresentacion(null);
            } else {
                carta = carta.replaceAll("(?i)<script.*?>.*?</script.*?>", "")
                        .replaceAll("(?i)<.*?javascript:.*?>", "");
                request.setCartaPresentacion(carta);
            }
        }
        postulacion.setCartaPresentacion(request.getCartaPresentacion());
        postulacion.setGeneradaConIa(Boolean.TRUE.equals(request.getGeneradaConIa()));
        postulacion.setEstado(EstadoPostulacion.ENVIADA);

        // 4. Procesar CV (Archivo, URL directa o recuperación de CV anterior)
        // Asegurar descripción, requisitos y detalles de la oferta para la evaluación
        // IA
        if (oferta.getDescripcion() == null || oferta.getDescripcion().isBlank() || oferta.getRequisitos() == null) {
            try {
                OfertaDetalleDTO detalle = ofertasClient.obtenerOfertaDetalle(request.getOfertaId(), jwt);
                if (detalle != null) {
                    if (detalle.getDescripcion() != null)
                        oferta.setDescripcion(detalle.getDescripcion());
                    if (detalle.getAreaProfesional() != null)
                        oferta.setAreaProfesional(detalle.getAreaProfesional());
                    if (detalle.getNivelExperiencia() != null)
                        oferta.setNivelExperiencia(detalle.getNivelExperiencia());
                    if (detalle.getModalidad() != null)
                        oferta.setModalidad(detalle.getModalidad());
                    if (detalle.getRequisitos() != null && !detalle.getRequisitos().isEmpty()) {
                        oferta.setRequisitos(detalle.getRequisitos().stream()
                                .map(r -> {
                                    String desc = r.getDescripcion() != null ? r.getDescripcion() : "";
                                    String oblig = Boolean.TRUE.equals(r.getObligatorio()) ? " (Obligatorio)" : "";
                                    String niv = (r.getNivel() != null && !r.getNivel().isBlank())
                                            ? " [Nivel: " + r.getNivel() + "]"
                                            : "";
                                    return (desc + oblig + niv).trim();
                                })
                                .filter(s -> !s.isBlank())
                                .collect(Collectors.toList()));
                    }
                }
            } catch (Exception e) {
                log.warn("No se pudo obtener detalle adicional de la oferta {}: {}", request.getOfertaId(),
                        e.getMessage());
            }
        }
        String perfilOferta = construirPerfilOferta(oferta);

        if (cvFile != null && !cvFile.isEmpty()) {
            try {
                byte[] cvBytes = cvFile.getBytes();
                log.info("Procesando CV subido para postulación ({} bytes)...", cvBytes.length);
                String cvUrl = cloudinaryService.subirCv(cvFile);
                postulacion.setCvUrl(cvUrl);
                log.info("CV subido exitosamente a Cloudinary: {}", cvUrl);

                try {
                    log.info("Evaluando CV con IA contra oferta: {}...", oferta.getTitulo());
                    ResultadoEvaluacionDTO evaluacion = geminiAiService.evaluarCvContraPerfilBytes(cvBytes,
                            cvFile.getContentType(), perfilOferta);
                    if (evaluacion != null) {
                        postulacion.setCumpleRequerimientos(evaluacion.isCumpleRequerimientos());
                        postulacion.setPorcentajeCoincidencia(evaluacion.getPorcentajeCoincidencia());
                        postulacion.setResumenIa(evaluacion.getResumenEvaluacion());
                        postulacion.setHabilidadesEncontradas(evaluacion.getHabilidadesEncontradas());
                        postulacion.setOrigenAnalisis(evaluacion.getOrigen());
                        log.info("Evaluación IA completada [origen: {}]: {}% coincidencia, cumple: {}",
                                evaluacion.getOrigen(), evaluacion.getPorcentajeCoincidencia(),
                                evaluacion.isCumpleRequerimientos());
                    }
                } catch (Exception e) {
                    log.error("Error al evaluar CV con IA: {}", e.getMessage(), e);
                }
            } catch (Exception e) {
                log.error("Error al procesar CV: {}", e.getMessage(), e);
                throw new BusinessException("Error al procesar el archivo CV: " + e.getMessage());
            }
        } else if (request.getCvUrl() != null && !request.getCvUrl().isBlank()) {
            log.info("Utilizando CV existente en URL para la postulación: {}", request.getCvUrl());
            postulacion.setCvUrl(request.getCvUrl());

            try {
                log.info("Evaluando CV existente con IA desde URL: {}", request.getCvUrl());
                ResultadoEvaluacionDTO evaluacion = geminiAiService.evaluarCvContraPerfilUrl(request.getCvUrl(),
                        perfilOferta);
                if (evaluacion != null) {
                    postulacion.setCumpleRequerimientos(evaluacion.isCumpleRequerimientos());
                    postulacion.setPorcentajeCoincidencia(evaluacion.getPorcentajeCoincidencia());
                    postulacion.setResumenIa(evaluacion.getResumenEvaluacion());
                    postulacion.setHabilidadesEncontradas(evaluacion.getHabilidadesEncontradas());
                    postulacion.setOrigenAnalisis(evaluacion.getOrigen());
                    log.info("Evaluación IA completada desde URL [origen: {}]: {}% coincidencia, cumple: {}",
                            evaluacion.getOrigen(), evaluacion.getPorcentajeCoincidencia(),
                            evaluacion.isCumpleRequerimientos());
                }
            } catch (Exception e) {
                log.error("Error al evaluar CV desde URL con IA: {}", e.getMessage(), e);
            }
        } else {
            log.warn(
                    "No se proporcionó archivo CV ni URL para la postulación, intentando recuperar CV anterior del candidato...");
            Optional<Postulacion> prevPostulacion = postulacionRepository
                    .findFirstByCandidatoIdAndCvUrlIsNotNullOrderByFechaPostulacionDesc(candidatoId);
            if (prevPostulacion.isPresent() && prevPostulacion.get().getCvUrl() != null
                    && !prevPostulacion.get().getCvUrl().isBlank()) {
                String prevCvUrl = prevPostulacion.get().getCvUrl();
                log.info("CV anterior encontrado para el candidato: {}", prevCvUrl);
                postulacion.setCvUrl(prevCvUrl);

                try {
                    log.info("Evaluando CV recuperado con IA desde URL: {}", prevCvUrl);
                    ResultadoEvaluacionDTO evaluacion = geminiAiService.evaluarCvContraPerfilUrl(prevCvUrl,
                            perfilOferta);
                    if (evaluacion != null) {
                        postulacion.setCumpleRequerimientos(evaluacion.isCumpleRequerimientos());
                        postulacion.setPorcentajeCoincidencia(evaluacion.getPorcentajeCoincidencia());
                        postulacion.setResumenIa(evaluacion.getResumenEvaluacion());
                        postulacion.setHabilidadesEncontradas(evaluacion.getHabilidadesEncontradas());
                        postulacion.setOrigenAnalisis(evaluacion.getOrigen());
                        log.info(
                                "Evaluación IA completada para CV recuperado [origen: {}]: {}% coincidencia, cumple: {}",
                                evaluacion.getOrigen(), evaluacion.getPorcentajeCoincidencia(),
                                evaluacion.isCumpleRequerimientos());
                    }
                } catch (Exception e) {
                    log.error("Error al evaluar CV recuperado con IA: {}", e.getMessage(), e);
                }
            } else {
                String cvActivo = buscarCvActivoCandidato(candidatoId);
                if (cvActivo != null && !cvActivo.isBlank()) {
                    log.info("CV activo encontrado en documentos_cv para el candidato: {}", cvActivo);
                    postulacion.setCvUrl(cvActivo);
                    try {
                        log.info("Evaluando CV activo con IA desde URL: {}", cvActivo);
                        ResultadoEvaluacionDTO evaluacion = geminiAiService.evaluarCvContraPerfilUrl(cvActivo,
                                perfilOferta);
                        if (evaluacion != null) {
                            postulacion.setCumpleRequerimientos(evaluacion.isCumpleRequerimientos());
                            postulacion.setPorcentajeCoincidencia(evaluacion.getPorcentajeCoincidencia());
                            postulacion.setResumenIa(evaluacion.getResumenEvaluacion());
                            postulacion.setHabilidadesEncontradas(evaluacion.getHabilidadesEncontradas());
                            postulacion.setOrigenAnalisis(evaluacion.getOrigen());
                            log.info(
                                    "Evaluación IA completada para CV activo [origen: {}]: {}% coincidencia, cumple: {}",
                                    evaluacion.getOrigen(), evaluacion.getPorcentajeCoincidencia(),
                                    evaluacion.isCumpleRequerimientos());
                        }
                    } catch (Exception e) {
                        log.error("Error al evaluar CV activo con IA: {}", e.getMessage(), e);
                    }
                } else {
                    log.warn("El candidato no tiene ningún CV registrado, evaluando con perfil registrado...");
                    try {
                        ResultadoEvaluacionDTO evaluacion = geminiAiService.generarEvaluacionFallback(perfilOferta,
                                "Screening inicial basado en perfil de candidato");
                        if (evaluacion != null) {
                            postulacion.setCumpleRequerimientos(evaluacion.isCumpleRequerimientos());
                            postulacion.setPorcentajeCoincidencia(evaluacion.getPorcentajeCoincidencia());
                            postulacion.setResumenIa(evaluacion.getResumenEvaluacion());
                            postulacion.setHabilidadesEncontradas(evaluacion.getHabilidadesEncontradas());
                            postulacion.setOrigenAnalisis(evaluacion.getOrigen());
                        }
                    } catch (Exception ignored) {
                    }
                }
            }
        }

        // 5. Guardar postulación
        try {
            postulacion = postulacionRepository.saveAndFlush(postulacion);
            log.info("Postulación creada exitosamente con ID: {}, Match IA: {}%",
                    postulacion.getUuid(), postulacion.getPorcentajeCoincidencia());
        } catch (DataIntegrityViolationException e) {
            throw new DuplicatePostulationException("El candidato ya tiene una postulacion activa para esta oferta.");
        }

        // 6. Registrar historial y auditoría
        if (esReactivacion) {
            registrarHistorial(postulacion, estadoAnteriorReactivacion, EstadoPostulacion.ENVIADA, candidatoId,
                    "Postulación reactivada por nueva postulación del candidato");
            registrarAuditoria(candidatoId, "POSTULACION_REACTIVADA",
                    "Postulación reactivada para oferta " + request.getOfertaId());
        } else {
            registrarHistorial(postulacion, null, EstadoPostulacion.ENVIADA, candidatoId,
                    "Postulacion creada inicialmente");
            registrarAuditoria(candidatoId, "POSTULACION_CREADA",
                    "Postulacion creada para oferta " + request.getOfertaId());
        }

        return postulacionMapper.toResponse(postulacion);
    }

    /**
     * Construye un perfil descriptivo completo de la oferta para la evaluación con
     * IA
     */
    private String construirPerfilOferta(OfertaResumenDTO oferta) {
        StringBuilder perfil = new StringBuilder();
        perfil.append("TÍTULO DEL PUESTO: ").append(oferta.getTitulo() != null ? oferta.getTitulo() : "No especificado")
                .append("\n\n");

        if (oferta.getDescripcion() != null && !oferta.getDescripcion().isBlank()) {
            perfil.append("DESCRIPCIÓN DEL PUESTO:\n").append(oferta.getDescripcion()).append("\n\n");
        }

        if (oferta.getRequisitos() != null && !oferta.getRequisitos().isEmpty()) {
            perfil.append("REQUISITOS DEL PUESTO:\n");
            for (String req : oferta.getRequisitos()) {
                perfil.append("- ").append(req).append("\n");
            }
            perfil.append("\n");
        }

        if (oferta.getAreaProfesional() != null && !oferta.getAreaProfesional().isBlank()) {
            perfil.append("ÁREA PROFESIONAL: ").append(oferta.getAreaProfesional()).append("\n");
        }

        if (oferta.getNivelExperiencia() != null && !oferta.getNivelExperiencia().isBlank()) {
            perfil.append("NIVEL DE EXPERIENCIA REQUERIDO: ").append(oferta.getNivelExperiencia()).append("\n");
        }

        if (oferta.getModalidad() != null && !oferta.getModalidad().isBlank()) {
            perfil.append("MODALIDAD: ").append(oferta.getModalidad()).append("\n");
        }

        return perfil.toString();
    }

    @Override
    @Transactional(readOnly = true)
    public PostulacionResponse obtenerPostulacion(UUID uuid, UUID usuarioLogueadoId, String rolUsuario) {
        Postulacion postulacion = buscarPorUuid(uuid);
        validarIdor(postulacion, usuarioLogueadoId, rolUsuario);
        String jwt = SecurityUtils.getJwtToken();
        return enriquecerPostulacion(postulacion, jwt);
    }

    @Override
    @Transactional
    public PostulacionResponse cambiarEstado(UUID uuid, EstadoPostulacion nuevoEstado, UUID usuarioLogueadoId,
            String comentario) {
        Postulacion postulacion = buscarPorUuid(uuid);
        validarIdor(postulacion, usuarioLogueadoId, SecurityUtils.getRolUsuarioLogueado());
        EstadoPostulacion estadoAnterior = postulacion.getEstado();

        estadoPostulacionService.validarTransicion(estadoAnterior, nuevoEstado);

        postulacion.setEstado(nuevoEstado);
        postulacion = postulacionRepository.save(postulacion);

        registrarHistorial(postulacion, estadoAnterior, nuevoEstado, usuarioLogueadoId, comentario);
        registrarAuditoria(usuarioLogueadoId, "ESTADO_CAMBIADO",
                "Estado de postulacion " + uuid + " cambiado a " + nuevoEstado);

        return postulacionMapper.toResponse(postulacion);
    }

    @Override
    @Transactional
    public PostulacionResponse retirarPostulacion(UUID uuid, UUID candidatoId, String motivo) {
        Postulacion postulacion = buscarPorUuid(uuid);

        if (!postulacion.getCandidatoId().equals(candidatoId)) {
            throw new ForbiddenException("No tienes permiso para retirar esta postulacion");
        }

        EstadoPostulacion estadoAnterior = postulacion.getEstado();
        estadoPostulacionService.validarTransicion(estadoAnterior, EstadoPostulacion.RETIRADA);

        postulacion.setEstado(EstadoPostulacion.RETIRADA);
        postulacion = postulacionRepository.save(postulacion);

        registrarHistorial(postulacion, estadoAnterior, EstadoPostulacion.RETIRADA, candidatoId,
                motivo != null ? motivo : "Postulacion retirada por el candidato");
        registrarAuditoria(candidatoId, "POSTULACION_RETIRADA", "Postulacion " + uuid + " retirada");

        return postulacionMapper.toResponse(postulacion);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PostulacionResponse> listarMisPostulaciones(UUID candidatoId, EstadoPostulacion estado,
            Pageable pageable) {
        Page<Postulacion> postulaciones;
        if (estado != null) {
            postulaciones = postulacionRepository.findByCandidatoIdAndEstado(candidatoId, estado, pageable);
        } else {
            postulaciones = postulacionRepository.findByCandidatoId(candidatoId, pageable);
        }
        String jwt = SecurityUtils.getJwtToken();
        return postulaciones.map(p -> enriquecerPostulacion(p, jwt));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PostulacionResponse> listarPostulacionesPorOferta(UUID ofertaId, UUID empresaIdLogueada,
            EstadoPostulacion estado, Pageable pageable) {
        Page<Postulacion> postulaciones;
        String rol = SecurityUtils.getRolUsuarioLogueado();

        if ("ADMIN".equals(rol) || "ADMINISTRADOR".equals(rol)) {
            if (estado != null) {
                postulaciones = postulacionRepository.findByOfertaIdAndEstado(ofertaId, estado, pageable);
            } else {
                postulaciones = postulacionRepository.findByOfertaId(ofertaId, pageable);
            }
        } else {
            if (estado != null) {
                postulaciones = postulacionRepository.findByOfertaIdAndEmpresaIdAndEstado(ofertaId, empresaIdLogueada,
                        estado, pageable);
            } else {
                postulaciones = postulacionRepository.findByOfertaIdAndEmpresaId(ofertaId, empresaIdLogueada, pageable);
            }
        }

        String jwt = SecurityUtils.getJwtToken();
        return postulaciones.map(p -> enriquecerPostulacion(p, jwt));
    }

    @Override
    @Transactional
    public Page<PostulacionResponse> listarPostulacionesPorEmpresa(UUID empresaIdLogueada, UUID ofertaId,
            EstadoPostulacion estado, Pageable pageable) {
        Page<Postulacion> postulaciones;
        if (ofertaId != null) {
            if (empresaIdLogueada != null) {
                if (estado != null) {
                    postulaciones = postulacionRepository.findByOfertaIdAndEmpresaIdAndEstado(ofertaId,
                            empresaIdLogueada, estado, pageable);
                } else {
                    postulaciones = postulacionRepository.findByOfertaIdAndEmpresaId(ofertaId, empresaIdLogueada,
                            pageable);
                }
            } else {
                if (estado != null) {
                    postulaciones = postulacionRepository.findByOfertaIdAndEstado(ofertaId, estado, pageable);
                } else {
                    postulaciones = postulacionRepository.findByOfertaId(ofertaId, pageable);
                }
            }
        } else if (empresaIdLogueada != null) {
            if (estado != null) {
                postulaciones = postulacionRepository.findByEmpresaIdAndEstado(empresaIdLogueada, estado, pageable);
            } else {
                postulaciones = postulacionRepository.findByEmpresaId(empresaIdLogueada, pageable);
            }
        } else {
            if (estado != null) {
                postulaciones = postulacionRepository.findByEstado(estado, pageable);
            } else {
                postulaciones = postulacionRepository.findAll(pageable);
            }
        }

        String jwt = SecurityUtils.getJwtToken();
        return postulaciones.map(p -> enriquecerPostulacion(p, jwt));
    }

    private PostulacionResponse enriquecerPostulacion(Postulacion p, String jwt) {
        PostulacionResponse res = postulacionMapper.toResponse(p);
        if (res == null)
            return null;
        try {
            if (jwt != null && p.getCandidatoId() != null) {
                UsuarioResumenDTO u = usuariosClient.obtenerResumenCandidato(p.getCandidatoId(), jwt);
                if (u != null) {
                    res.setCandidatoNombre(u.getNombreCompleto());
                    res.setCandidatoEmail(u.getEmail());
                    res.setCandidatoFoto(u.getFotoPerfil());
                }
            }
        } catch (Exception ignored) {
        }
        try {
            if (jwt != null && p.getOfertaId() != null) {
                OfertaResumenDTO o = ofertasClient.validarOferta(p.getOfertaId(), jwt);
                if (o != null) {
                    res.setOfertaTitulo(o.getTitulo());
                }
            }
        } catch (Exception ignored) {
        }

        // Si la postulación no tiene CV URL pero el candidato ya subió un CV en otra
        // postulación o en su perfil, asociarlo
        if (p.getCvUrl() == null || p.getCvUrl().isBlank()) {
            try {
                Optional<Postulacion> prevCv = postulacionRepository
                        .findFirstByCandidatoIdAndCvUrlIsNotNullOrderByFechaPostulacionDesc(p.getCandidatoId());
                if (prevCv.isPresent() && prevCv.get().getCvUrl() != null && !prevCv.get().getCvUrl().isBlank()) {
                    p.setCvUrl(prevCv.get().getCvUrl());
                    res.setCvUrl(p.getCvUrl());
                } else {
                    String cvActivo = buscarCvActivoCandidato(p.getCandidatoId());
                    if (cvActivo != null && !cvActivo.isBlank()) {
                        p.setCvUrl(cvActivo);
                        res.setCvUrl(cvActivo);
                    }
                }
            } catch (Exception ignored) {
            }
        }

        // Si la postulación no tiene datos de IA válidos (null o <= 0) y nunca ha sido
        // evaluada,
        // calcular el screening automáticamente y persistirlo en PostgreSQL
        if ((p.getPorcentajeCoincidencia() == null || p.getPorcentajeCoincidencia() <= 0)
                && p.getOrigenAnalisis() == null) {
            try {
                OfertaResumenDTO oferta = null;
                try {
                    if (jwt != null && p.getOfertaId() != null) {
                        oferta = ofertasClient.validarOferta(p.getOfertaId(), jwt);
                        try {
                            OfertaDetalleDTO detalle = ofertasClient.obtenerOfertaDetalle(p.getOfertaId(), jwt);
                            if (detalle != null) {
                                if (detalle.getDescripcion() != null)
                                    oferta.setDescripcion(detalle.getDescripcion());
                                if (detalle.getAreaProfesional() != null)
                                    oferta.setAreaProfesional(detalle.getAreaProfesional());
                                if (detalle.getNivelExperiencia() != null)
                                    oferta.setNivelExperiencia(detalle.getNivelExperiencia());
                                if (detalle.getModalidad() != null)
                                    oferta.setModalidad(detalle.getModalidad());
                                if (detalle.getRequisitos() != null && !detalle.getRequisitos().isEmpty()) {
                                    oferta.setRequisitos(detalle.getRequisitos().stream()
                                            .map(r -> {
                                                String desc = r.getDescripcion() != null ? r.getDescripcion() : "";
                                                String oblig = Boolean.TRUE.equals(r.getObligatorio())
                                                        ? " (Obligatorio)"
                                                        : "";
                                                String niv = (r.getNivel() != null && !r.getNivel().isBlank())
                                                        ? " [Nivel: " + r.getNivel() + "]"
                                                        : "";
                                                return (desc + oblig + niv).trim();
                                            })
                                            .filter(s -> !s.isBlank())
                                            .collect(Collectors.toList()));
                                }
                            }
                        } catch (Exception ignored) {
                        }
                    }
                } catch (Exception ignored) {
                }

                String perfilOferta = oferta != null ? construirPerfilOferta(oferta)
                        : (res.getOfertaTitulo() != null ? "Puesto: " + res.getOfertaTitulo() : "Oferta laboral");

                ResultadoEvaluacionDTO eval = null;
                if (p.getCvUrl() != null && !p.getCvUrl().isBlank()) {
                    eval = geminiAiService.evaluarCvContraPerfilUrl(p.getCvUrl(), perfilOferta);
                } else {
                    eval = geminiAiService.generarEvaluacionFallback(perfilOferta,
                            "Screening retroactivo basado en perfil y requisitos");
                }

                if (eval != null && eval.getPorcentajeCoincidencia() > 0) {
                    p.setCumpleRequerimientos(eval.isCumpleRequerimientos());
                    p.setPorcentajeCoincidencia(eval.getPorcentajeCoincidencia());
                    p.setResumenIa(eval.getResumenEvaluacion());
                    p.setHabilidadesEncontradas(eval.getHabilidadesEncontradas());
                    p.setOrigenAnalisis(eval.getOrigen());

                    p = postulacionRepository.saveAndFlush(p);

                    res.setCumpleRequerimientos(p.getCumpleRequerimientos());
                    res.setPorcentajeCoincidencia(p.getPorcentajeCoincidencia());
                    res.setResumenIa(p.getResumenIa());
                    res.setHabilidadesEncontradas(p.getHabilidadesEncontradas());
                    res.setOrigenAnalisis(p.getOrigenAnalisis());
                    res.setCvUrl(p.getCvUrl());
                    log.info("Evaluación IA retroactiva calculada [origen: {}] y persistida para postulación {}: {}%",
                            p.getOrigenAnalisis(), p.getUuid(), p.getPorcentajeCoincidencia());
                }
            } catch (Exception e) {
                log.warn("No se pudo autogenerar evaluación IA retroactiva para postulación {}: {}", p.getUuid(),
                        e.getMessage());
            }
        }

        return res;
    }

    private Postulacion buscarPorUuid(UUID uuid) {
        return postulacionRepository.findByUuid(uuid)
                .orElseThrow(() -> new ResourceNotFoundException("Postulacion no encontrada"));
    }

    private void validarIdor(Postulacion postulacion, UUID usuarioLogueadoId, String rolUsuario) {
        if ("ADMIN".equals(rolUsuario) || "ADMINISTRADOR".equals(rolUsuario)) {
            return;
        }
        if ("ESTUDIANTE".equals(rolUsuario) || "PROFESIONAL".equals(rolUsuario) || "CANDIDATO".equals(rolUsuario)) {
            if (usuarioLogueadoId == null || !postulacion.getCandidatoId().equals(usuarioLogueadoId)) {
                throw new ForbiddenException("No tienes permiso para acceder a esta postulación.");
            }
            return;
        }
        if ("EMPRESA".equals(rolUsuario) || "RECLUTADOR".equals(rolUsuario)) {
            if (!empresaAuthorizationService.tienePermisoDePropiedad(usuarioLogueadoId, postulacion.getEmpresaId(), rolUsuario)) {
                throw new ForbiddenException("No tienes permiso para acceder a esta postulación.");
            }
            return;
        }
        throw new ForbiddenException("No tienes permiso para acceder a esta postulación.");
    }

    private void registrarHistorial(Postulacion postulacion, EstadoPostulacion estadoAnterior,
            EstadoPostulacion estadoNuevo, UUID usuarioId, String comentario) {
        HistorialPostulacion historial = HistorialPostulacion.builder()
                .postulacion(postulacion)
                .estadoAnterior(estadoAnterior)
                .estadoNuevo(estadoNuevo)
                .usuarioId(usuarioId)
                .comentario(comentario)
                .build();
        historialRepository.save(historial);
    }

    private void registrarAuditoria(UUID usuarioId, String accion, String descripcion) {
        AuditoriaPostulacion auditoria = AuditoriaPostulacion.builder()
                .usuarioId(usuarioId)
                .accion(accion)
                .descripcion(descripcion)
                .build();
        auditoriaRepository.save(auditoria);
    }

    @Override
    public byte[] descargarCv(UUID uuid) {
        UUID usuarioId = SecurityUtils.getUsuarioLogueadoId();
        String rol = SecurityUtils.getRolUsuarioLogueado();
        return descargarCv(uuid, usuarioId, rol);
    }

    @Override
    public byte[] descargarCv(UUID uuid, UUID usuarioLogueadoId, String rolUsuario) {
        Postulacion postulacion = postulacionRepository.findByUuid(uuid)
                .orElseThrow(() -> new ResourceNotFoundException("El CV no fue encontrado"));

        validarIdor(postulacion, usuarioLogueadoId, rolUsuario);

        if (postulacion.getCvUrl() == null || postulacion.getCvUrl().isBlank()) {
            throw new ResourceNotFoundException("El CV no fue encontrado");
        }

        try {
            log.info("Descargando archivo CV desde Cloudinary para postulacion {}: {}", uuid, postulacion.getCvUrl());
            Request request = new Request.Builder()
                    .url(postulacion.getCvUrl())
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful() || response.body() == null) {
                    throw new IOException("Error HTTP " + response.code() + " al descargar archivo desde Cloudinary");
                }
                return response.body().bytes();
            }
        } catch (Exception e) {
            log.error("Error al obtener CV desde Cloudinary: {}", e.getMessage(), e);
            throw new RuntimeException("No se pudo obtener el archivo CV: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public void eliminarPostulacion(UUID uuid, UUID empresaId) {
        Postulacion postulacion = buscarPorUuid(uuid);

        // Validar que la postulación pertenece a la empresa
        if (!postulacion.getEmpresaId().equals(empresaId)) {
            throw new ForbiddenException("No tienes permiso para eliminar esta postulación");
        }

        log.info("Eliminando postulación {} de empresa {}", uuid, empresaId);

        // Eliminar registros relacionados en orden
        historialRepository.deleteByPostulacion(postulacion);
        evaluacionRepository.deleteByPostulacion(postulacion);
        entrevistaRepository.deleteByPostulacion(postulacion);

        // Eliminar la postulación
        postulacionRepository.delete(postulacion);

        // Registrar auditoría
        registrarAuditoria(empresaId, "POSTULACION_ELIMINADA", "Postulación " + uuid + " eliminada por la empresa");

        log.info("Postulación {} eliminada exitosamente", uuid);
    }

    @Override
    public GenerarCartaIaResponse generarBorradorCarta(GenerarCartaIaRequest request, UUID candidatoId) {
        if (request.getEstudianteId() != null && !request.getEstudianteId().equals(candidatoId)) {
            throw new ForbiddenException("No tienes permiso para solicitar generación para otro usuario");
        }

        String jwt = SecurityUtils.getJwtToken();

        // 1. Obtener datos reales del estudiante
        PerfilEstudianteDetalleDTO perfil = usuariosClient.obtenerPerfilEstudiante(candidatoId, jwt);
        UsuarioResumenDTO resumenCandidato = null;
        if (perfil == null || perfil.getNombreCompleto() == null || perfil.getNombreCompleto().isBlank()) {
            try {
                resumenCandidato = usuariosClient.obtenerResumenCandidato(candidatoId, jwt);
            } catch (Exception ignored) {
            }
        }

        String nombreEstudiante = (perfil != null && perfil.getNombreCompleto() != null
                && !perfil.getNombreCompleto().isBlank())
                        ? perfil.getNombreCompleto()
                        : (resumenCandidato != null && resumenCandidato.getNombreCompleto() != null
                                ? resumenCandidato.getNombreCompleto()
                                : "Candidato");

        String carrera = (perfil != null && perfil.getCarrera() != null && !perfil.getCarrera().isBlank())
                ? perfil.getCarrera()
                : "No especificada";

        String biografia = (perfil != null && perfil.getBiografia() != null && !perfil.getBiografia().isBlank())
                ? perfil.getBiografia()
                : "No especificada";

        String habilidades = (perfil != null && perfil.getHabilidades() != null && !perfil.getHabilidades().isEmpty())
                ? String.join(", ", perfil.getHabilidades())
                : "No especificadas";

        String experiencias = (perfil != null && perfil.getExperiencias() != null
                && !perfil.getExperiencias().isEmpty())
                        ? String.join("; ", perfil.getExperiencias())
                        : "Sin experiencia laboral previa registrada";

        String educacion = (perfil != null && perfil.getEducacion() != null && !perfil.getEducacion().isEmpty())
                ? String.join("; ", perfil.getEducacion())
                : "No especificada";

        String proyectos = (perfil != null && perfil.getProyectos() != null && !perfil.getProyectos().isEmpty())
                ? String.join("; ", perfil.getProyectos())
                : "Ninguno registrado";

        // 2. Obtener datos reales de la oferta
        OfertaDetalleDTO ofertaDetalle = ofertasClient.obtenerOfertaDetalle(request.getOfertaId(), jwt);
        OfertaResumenDTO ofertaResumen = null;
        if (ofertaDetalle == null) {
            ofertaResumen = ofertasClient.validarOferta(request.getOfertaId(), jwt);
        }

        String tituloOferta = ofertaDetalle != null ? ofertaDetalle.getTitulo()
                : (ofertaResumen != null ? ofertaResumen.getTitulo() : "Puesto vacante");
        String descripcionOferta = ofertaDetalle != null && ofertaDetalle.getDescripcion() != null
                ? ofertaDetalle.getDescripcion()
                : "";
        String area = ofertaDetalle != null && ofertaDetalle.getAreaProfesional() != null
                ? ofertaDetalle.getAreaProfesional()
                : "Tecnología";
        String nivel = ofertaDetalle != null && ofertaDetalle.getNivelExperiencia() != null
                ? ofertaDetalle.getNivelExperiencia()
                : "Junior";
        String modalidad = ofertaDetalle != null && ofertaDetalle.getModalidad() != null ? ofertaDetalle.getModalidad()
                : "No especificada";

        String requisitos = "No especificados";
        if (ofertaDetalle != null && ofertaDetalle.getRequisitos() != null
                && !ofertaDetalle.getRequisitos().isEmpty()) {
            requisitos = ofertaDetalle.getRequisitos().stream()
                    .map(r -> r.getDescripcion() + (Boolean.TRUE.equals(r.getObligatorio()) ? " (Obligatorio)" : ""))
                    .collect(Collectors.joining("; "));
        }

        UUID empresaId = ofertaDetalle != null ? ofertaDetalle.getEmpresaId()
                : (ofertaResumen != null ? ofertaResumen.getEmpresaId() : null);
        String nombreEmpresa = "la empresa";
        if (empresaId != null) {
            try {
                UsuarioResumenDTO resumenEmpresa = usuariosClient.obtenerResumenCandidato(empresaId, jwt);
                if (resumenEmpresa != null && resumenEmpresa.getNombreCompleto() != null
                        && !resumenEmpresa.getNombreCompleto().isBlank()) {
                    nombreEmpresa = resumenEmpresa.getNombreCompleto();
                }
            } catch (Exception ignored) {
            }
        }

        // 3. Construir prompt dinámico según especificación
        String prompt = String.format(
                """
                        Eres un asistente profesional de redacción para una plataforma de empleabilidad estudiantil.
                        Debes redactar un borrador de carta de presentación personalizada para un estudiante que se postula a una oferta laboral.

                        DATOS REALES DEL ESTUDIANTE:
                        - Nombre: %s
                        - Carrera / Profesión: %s
                        - Perfil / Biografía: %s
                        - Habilidades: %s
                        - Experiencia Laboral: %s
                        - Educación: %s
                        - Proyectos: %s

                        DATOS REALES DE LA OFERTA Y EMPRESA:
                        - Empresa: %s
                        - Puesto vacante: %s
                        - Descripción del puesto: %s
                        - Área profesional: %s
                        - Nivel requerido: %s
                        - Modalidad: %s
                        - Requisitos: %s

                        INSTRUCCIONES ESPECÍFICAS:
                        - NO inventes experiencia, habilidades ni estudios que no aparezcan arriba.
                        - Si una información no aparece en los datos del estudiante, simplemente no la menciones.
                        - Redacta en primera persona, en español neutro, con tono profesional, natural y entusiasta pero sin exagerar ni usar clichés vacíos.
                        - Extensión obligatoria: entre 100 y 180 palabras.
                        - NO uses listas de viñetas, encabezados como 'Asunto:' o 'Estimado...', ni firmas formales con datos inventados.
                        - Devuelve ÚNICAMENTE el texto de la carta de presentación listo para usar.
                        """,
                nombreEstudiante, carrera, biografia, habilidades, experiencias, educacion, proyectos,
                nombreEmpresa, tituloOferta, descripcionOferta, area, nivel, modalidad, requisitos);

        // 4. Llamada real a Gemini
        try {
            String carta = geminiAiService.generarBorradorCartaPresentacion(prompt);
            return GenerarCartaIaResponse.builder()
                    .success(true)
                    .carta(carta)
                    .build();
        } catch (Exception e) {
            log.error("Error al consultar servicio de IA: {}", e.getMessage(), e);
            String detalle = e.getMessage() != null ? e.getMessage() : "Error desconocido al procesar la carta con IA.";
            return GenerarCartaIaResponse.builder()
                    .success(false)
                    .message("No fue posible generar la carta: " + detalle)
                    .build();
        }
    }

    private String buscarCvActivoCandidato(UUID candidatoId) {
        if (candidatoId == null || entityManager == null)
            return null;
        try {
            List<?> results = entityManager.createNativeQuery(
                    "SELECT storage_key FROM schema_usuarios.documentos_cv WHERE usuario_id = :uid AND activo = true ORDER BY fecha_carga DESC LIMIT 1")
                    .setParameter("uid", candidatoId).getResultList();

            if (!results.isEmpty() && results.get(0) != null) {
                String storageKey = results.get(0).toString().trim();
                if (!storageKey.isBlank()) {
                    String baseUrl = (usuariosClient != null && usuariosClient.getUsuariosServiceUrl() != null)
                            ? usuariosClient.getUsuariosServiceUrl()
                            : "http://localhost:8081";
                    return baseUrl + "/api/archivos/" + storageKey;
                }
            }
        } catch (Exception e) {
            log.warn("No se pudo consultar schema_usuarios.documentos_cv para candidato {}: {}", candidatoId,
                    e.getMessage());
        }
        return null;
    }

    @Override
    @Transactional
    public PostulacionResponse reanalizarPostulacionIa(UUID uuid, UUID usuarioId, String rolUsuario) {
        Postulacion p = buscarPorUuid(uuid);

        // Validar permisos contra IDOR:
        // - ADMIN / ADMINISTRADOR: permitido
        // - EMPRESA: solo su propia empresa
        // - RECLUTADOR: solo la empresa a la que pertenece
        // - Cualquier otro rol: prohibido
        if (!empresaAuthorizationService.tienePermisoDePropiedad(usuarioId, p.getEmpresaId(), rolUsuario)) {
            throw new ForbiddenException("No tienes permiso para reanalizar esta postulación.");
        }

        String jwt = SecurityUtils.getJwtToken();

        // Si la postulación no tiene cvUrl directamente, buscar si el candidato tiene
        // un CV registrado
        if (p.getCvUrl() == null || p.getCvUrl().isBlank()) {
            try {
                Optional<Postulacion> prevCv = postulacionRepository
                        .findFirstByCandidatoIdAndCvUrlIsNotNullOrderByFechaPostulacionDesc(p.getCandidatoId());
                if (prevCv.isPresent() && prevCv.get().getCvUrl() != null && !prevCv.get().getCvUrl().isBlank()) {
                    p.setCvUrl(prevCv.get().getCvUrl());
                    log.info("CV recuperado desde postulación previa para {}: {}", uuid, p.getCvUrl());
                }
            } catch (Exception e) {
                log.warn("Error al buscar CV previo para reanálisis de postulación {}: {}", uuid, e.getMessage());
            }

            if (p.getCvUrl() == null || p.getCvUrl().isBlank()) {
                String cvActivo = buscarCvActivoCandidato(p.getCandidatoId());
                if (cvActivo != null && !cvActivo.isBlank()) {
                    p.setCvUrl(cvActivo);
                    log.info("CV activo recuperado desde schema_usuarios.documentos_cv para {}: {}", uuid, cvActivo);
                }
            }
        }

        // Obtener detalles completos de la oferta para construir el perfil
        OfertaResumenDTO oferta = null;
        try {
            if (jwt != null && p.getOfertaId() != null) {
                oferta = ofertasClient.validarOferta(p.getOfertaId(), jwt);
                try {
                    OfertaDetalleDTO detalle = ofertasClient.obtenerOfertaDetalle(p.getOfertaId(), jwt);
                    if (detalle != null) {
                        if (detalle.getDescripcion() != null)
                            oferta.setDescripcion(detalle.getDescripcion());
                        if (detalle.getAreaProfesional() != null)
                            oferta.setAreaProfesional(detalle.getAreaProfesional());
                        if (detalle.getNivelExperiencia() != null)
                            oferta.setNivelExperiencia(detalle.getNivelExperiencia());
                        if (detalle.getModalidad() != null)
                            oferta.setModalidad(detalle.getModalidad());
                        if (detalle.getRequisitos() != null && !detalle.getRequisitos().isEmpty()) {
                            oferta.setRequisitos(detalle.getRequisitos().stream()
                                    .map(r -> {
                                        String desc = r.getDescripcion() != null ? r.getDescripcion() : "";
                                        String oblig = Boolean.TRUE.equals(r.getObligatorio()) ? " (Obligatorio)" : "";
                                        String niv = (r.getNivel() != null && !r.getNivel().isBlank())
                                                ? " [Nivel: " + r.getNivel() + "]"
                                                : "";
                                        return (desc + oblig + niv).trim();
                                    })
                                    .filter(s -> !s.isBlank())
                                    .collect(Collectors.toList()));
                        }
                    }
                } catch (Exception e) {
                    log.warn("No se pudo obtener detalle extendido de oferta {} para reanálisis: {}", p.getOfertaId(),
                            e.getMessage());
                }
            }
        } catch (Exception e) {
            log.warn("No se pudo validar oferta {} para reanálisis: {}", p.getOfertaId(), e.getMessage());
        }

        String perfilOferta = oferta != null ? construirPerfilOferta(oferta)
                : "Oferta laboral con requisitos técnicos y competencias del puesto";

        ResultadoEvaluacionDTO eval = null;
        if (p.getCvUrl() != null && !p.getCvUrl().isBlank()) {
            log.info("Ejecutando reanálisis con Gemini AI sobre CV en URL: {}", p.getCvUrl());
            eval = geminiAiService.evaluarCvContraPerfilUrl(p.getCvUrl(), perfilOferta);
        } else {
            // Si el candidato no tiene PDF, intentar evaluar su perfil académico / laboral
            log.warn("Postulación {} no cuenta con archivo PDF ni URL. Intentando evaluar perfil textual...", uuid);
            PerfilEstudianteDetalleDTO perfilEst = null;
            if (jwt != null && p.getCandidatoId() != null) {
                try {
                    perfilEst = usuariosClient.obtenerPerfilEstudiante(p.getCandidatoId(), jwt);
                } catch (Exception e) {
                    log.warn("No se pudo obtener perfil de estudiante para reanálisis {}: {}", uuid, e.getMessage());
                }
            }

            if (perfilEst != null) {
                StringBuilder sb = new StringBuilder();
                if (perfilEst.getNombreCompleto() != null)
                    sb.append("Candidato: ").append(perfilEst.getNombreCompleto()).append("\n");
                if (perfilEst.getCarrera() != null)
                    sb.append("Carrera: ").append(perfilEst.getCarrera()).append("\n");
                if (perfilEst.getHabilidades() != null && !perfilEst.getHabilidades().isEmpty()) {
                    sb.append("Habilidades: ").append(String.join(", ", perfilEst.getHabilidades())).append("\n");
                }
                if (perfilEst.getExperiencias() != null && !perfilEst.getExperiencias().isEmpty()) {
                    sb.append("Experiencia: ").append(String.join("; ", perfilEst.getExperiencias())).append("\n");
                }
                if (perfilEst.getEducacion() != null && !perfilEst.getEducacion().isEmpty()) {
                    sb.append("Educación: ").append(String.join("; ", perfilEst.getEducacion())).append("\n");
                }
                eval = geminiAiService.evaluarPerfilTexto(sb.toString(), perfilOferta);
            } else {
                eval = geminiAiService.generarEvaluacionFallback(perfilOferta, "CV no disponible para reanálisis");
            }
        }

        if (eval != null) {
            p.setCumpleRequerimientos(eval.isCumpleRequerimientos());
            p.setPorcentajeCoincidencia(eval.getPorcentajeCoincidencia());
            p.setResumenIa(eval.getResumenEvaluacion());
            p.setHabilidadesEncontradas(eval.getHabilidadesEncontradas());
            p.setOrigenAnalisis(eval.getOrigen()); // "GEMINI" o "FALLBACK"
            p = postulacionRepository.saveAndFlush(p);

            registrarAuditoria(usuarioId, "REANALISIS_IA",
                    "Reanálisis de postulación " + uuid + " completado con origen " + p.getOrigenAnalisis() +
                            " (" + p.getPorcentajeCoincidencia() + "% - Modelo: " + eval.getModeloUsado() + ")");

            // Loguear exactamente lo solicitado en el requerimiento 2
            log.info(
                    "REANALISIS_IA_RESULTADO: uuid={}, origenAnalisis={}, porcentajeCoincidencia={}%, modeloGemini={}, errorHttp={}, resumenIa='{}'",
                    uuid,
                    p.getOrigenAnalisis(),
                    p.getPorcentajeCoincidencia(),
                    eval.getModeloUsado() != null ? eval.getModeloUsado() : "N/A",
                    eval.getErrorDetalle() != null ? eval.getErrorDetalle() : "N/A",
                    p.getResumenIa());
        }

        return enriquecerPostulacion(p, jwt);
    }
}

        // 
        // 
                        
                            
                            
                            
                            
                                                
                                                
                            
                            
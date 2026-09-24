package com.elp.ofertas_service.service.impl;

import com.elp.ofertas_service.dto.response.EmpleoPublicoDTO;
import com.elp.ofertas_service.entity.Oferta;
import com.elp.ofertas_service.enums.EstadoOferta;
import com.elp.ofertas_service.integration.jooble.JoobleClient;
import com.elp.ofertas_service.integration.jooble.JoobleJobDto;
import com.elp.ofertas_service.integration.remotive.RemotiveClient;
import com.elp.ofertas_service.integration.remotive.RemotiveJobDto;
import com.elp.ofertas_service.repository.OfertaRepository;
import com.elp.ofertas_service.repository.OfertaSpecification;
import com.elp.ofertas_service.service.EmpleosPublicosService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmpleosPublicosServiceImpl implements EmpleosPublicosService {

    private static final Logger log = LoggerFactory.getLogger(EmpleosPublicosServiceImpl.class);
    private static final Pattern HTML_TAG_PATTERN = Pattern.compile("<[^>]*>");
    private static final long CACHE_TTL_MILLIS = 10 * 60 * 1000L; // 10 minutos de caché backend

    private final OfertaRepository ofertaRepository;
    private final JoobleClient joobleClient;
    private final RemotiveClient remotiveClient;

    private static class CacheEntry {
        final List<EmpleoPublicoDTO> jobs;
        final long timestamp;

        CacheEntry(List<EmpleoPublicoDTO> jobs) {
            this.jobs = jobs;
            this.timestamp = System.currentTimeMillis();
        }

        boolean isValid() {
            return System.currentTimeMillis() - timestamp < CACHE_TTL_MILLIS;
        }
    }

    private final Map<String, CacheEntry> externalJobsCache = new ConcurrentHashMap<>();

    @Override
    public Page<EmpleoPublicoDTO> buscarEmpleosPublicos(
            String q,
            String ubicacion,
            String tipoEmpleo,
            String origen,
            Boolean incluirRemotos,
            Pageable pageable) {

        String origenFiltro = origen != null ? origen.trim().toUpperCase() : "TODOS";
        String searchParam = q != null ? q.trim() : "";
        String ubicacionParam = (ubicacion != null && !ubicacion.trim().isEmpty()) ? ubicacion.trim() : "Peru";

        // 1. Si el origen es exclusivamente EMPLEAPRO, ejecutar paginación directa con JPA en base de datos
        if ("EMPLEAPRO".equals(origenFiltro)) {
            Specification<Oferta> spec = construirSpecificationInterna(searchParam, ubicacionParam, tipoEmpleo);
            Page<Oferta> pageInterna = ofertaRepository.findAll(spec, pageable);
            return pageInterna.map(this::mapearOfertaInterna);
        }

        List<EmpleoPublicoDTO> todosLosEmpleos = new ArrayList<>();

        // 2. Si el origen es TODOS, incluir ofertas internas
        if ("TODOS".equals(origenFiltro)) {
            List<EmpleoPublicoDTO> internas = obtenerOfertasInternas(searchParam, ubicacionParam, tipoEmpleo);
            todosLosEmpleos.addAll(internas);
        }

        // 3. Obtener ofertas externas si el origen es TODOS o JOOBLE / EXTERNAS / REMOTIVE
        if ("TODOS".equals(origenFiltro) || "JOOBLE".equals(origenFiltro) || "EXTERNAS".equals(origenFiltro) || "REMOTIVE".equals(origenFiltro)) {
            List<EmpleoPublicoDTO> externas = obtenerOfertasExternas(searchParam, ubicacionParam, tipoEmpleo, incluirRemotos, origenFiltro);
            todosLosEmpleos.addAll(externas);
        }

        // 4. Si el origen es TODOS pero no hubo ofertas externas configuradas o devueltas, delegar a paginación JPA
        if ("TODOS".equals(origenFiltro) && todosLosEmpleos.isEmpty()) {
            Specification<Oferta> spec = construirSpecificationInterna(searchParam, ubicacionParam, tipoEmpleo);
            return ofertaRepository.findAll(spec, pageable).map(this::mapearOfertaInterna);
        }

        // 5. Paginación unificada cuando conviven ofertas internas y externas
        int pageSize = Math.max(1, pageable.getPageSize());
        int currentPage = Math.max(0, pageable.getPageNumber());
        int totalElements = todosLosEmpleos.size();
        int fromIndex = Math.min(currentPage * pageSize, totalElements);
        int toIndex = Math.min(fromIndex + pageSize, totalElements);

        List<EmpleoPublicoDTO> pagedList = todosLosEmpleos.subList(fromIndex, toIndex);

        return new PageImpl<>(pagedList, PageRequest.of(currentPage, pageSize), totalElements);
    }

    private Specification<Oferta> construirSpecificationInterna(String q, String ubicacion, String tipoEmpleo) {
        String queryBusqueda = (q != null && !q.trim().isEmpty()) ? q.trim() : null;
        String depBusqueda = (ubicacion == null || ubicacion.trim().isEmpty() ||
                "Peru".equalsIgnoreCase(ubicacion.trim()) ||
                "Perú".equalsIgnoreCase(ubicacion.trim()) ||
                "Todo Perú".equalsIgnoreCase(ubicacion.trim()) ||
                "Todo Peru".equalsIgnoreCase(ubicacion.trim())) ? null : ubicacion.trim();

        com.elp.ofertas_service.enums.TipoContrato tipoContratoEnum = null;
        if (tipoEmpleo != null && !tipoEmpleo.trim().isEmpty() && !"TODOS".equalsIgnoreCase(tipoEmpleo)) {
            try {
                tipoContratoEnum = com.elp.ofertas_service.enums.TipoContrato.valueOf(tipoEmpleo.trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        return OfertaSpecification.conFiltros(
                queryBusqueda,
                null, null, null, tipoContratoEnum, null, null,
                depBusqueda, null, null, null, null, null, null,
                null, EstadoOferta.PUBLICADA, true
        );
    }

    private List<EmpleoPublicoDTO> obtenerOfertasInternas(String q, String ubicacion, String tipoEmpleo) {
        try {
            Specification<Oferta> spec = construirSpecificationInterna(q, ubicacion, tipoEmpleo);
            List<Oferta> ofertasInternas = ofertaRepository.findAll(spec);
            log.info("Ofertas internas PUBLICADAS encontradas en PostgreSQL: {}", ofertasInternas.size());

            return ofertasInternas.stream()
                    .map(this::mapearOfertaInterna)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error al consultar ofertas internas de EmpleaPro: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private EmpleoPublicoDTO mapearOfertaInterna(Oferta oferta) {
        String ubicacionFormateada = oferta.getUbicacion();
        if (ubicacionFormateada == null || ubicacionFormateada.trim().isEmpty()) {
            StringBuilder ub = new StringBuilder();
            if (oferta.getDistrito() != null) ub.append(oferta.getDistrito()).append(", ");
            if (oferta.getProvincia() != null) ub.append(oferta.getProvincia()).append(", ");
            if (oferta.getDepartamento() != null) ub.append(oferta.getDepartamento()).append(", ");
            ub.append(oferta.getPais() != null ? oferta.getPais() : "Peru");
            ubicacionFormateada = ub.toString();
        }

        String salario = null;
        if (oferta.getSalarioMinimo() != null || oferta.getSalarioMaximo() != null) {
            String moneda = oferta.getMoneda() != null ? oferta.getMoneda() : "PEN";
            if (oferta.getSalarioMinimo() != null && oferta.getSalarioMaximo() != null) {
                salario = moneda + " " + oferta.getSalarioMinimo() + " - " + oferta.getSalarioMaximo();
            } else if (oferta.getSalarioMinimo() != null) {
                salario = "Desde " + moneda + " " + oferta.getSalarioMinimo();
            } else {
                salario = "Hasta " + moneda + " " + oferta.getSalarioMaximo();
            }
        }

        String fechaPub = oferta.getFechaPublicacion() != null
                ? oferta.getFechaPublicacion().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME)
                : (oferta.getFechaCreacion() != null ? oferta.getFechaCreacion().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME) : null);

        return EmpleoPublicoDTO.builder()
                .id(oferta.getId().toString())
                .titulo(oferta.getTitulo())
                .empresa(null) // No tenemos nombre en la entidad, se podría obtener por Feign
                .ubicacion(ubicacionFormateada)
                .descripcion(limpiarHtml(oferta.getDescripcion()))
                .salario(salario)
                .tipoEmpleo(oferta.getTipoContrato() != null ? oferta.getTipoContrato().name() : null)
                .modalidad(oferta.getModalidad() != null ? oferta.getModalidad().name() : null)
                .nivelExperiencia(oferta.getNivelExperiencia() != null ? oferta.getNivelExperiencia().name() : null)
                .fechaPublicacion(fechaPub)
                .origen("EMPLEAPRO")
                .externa(false)
                .urlExterna(null)
                .logoUrl(null)
                .build();
    }

    private List<EmpleoPublicoDTO> obtenerOfertasExternas(String q, String ubicacion, String tipoEmpleo, Boolean incluirRemotos, String origenFiltro) {
        String cacheKey = (q + "___" + ubicacion + "___" + tipoEmpleo + "___" + incluirRemotos).toLowerCase();
        CacheEntry entry = externalJobsCache.get(cacheKey);
        if (entry != null && entry.isValid()) {
            return entry.jobs;
        }

        List<EmpleoPublicoDTO> externas = new ArrayList<>();
        boolean requestRemotos = Boolean.TRUE.equals(incluirRemotos);

        // 1. Intentar Jooble si está configurado y el filtro de origen lo permite
        if (joobleClient.isConfigured() && !"REMOTIVE".equals(origenFiltro)) {
            try {
                String joobleLocation = (!"Peru".equalsIgnoreCase(ubicacion)) ? ubicacion + ", Peru" : "Peru";
                var joobleOpt = joobleClient.buscarEmpleos(q, joobleLocation, 1);
                if (joobleOpt.isPresent() && joobleOpt.get().getJobs() != null) {
                    for (JoobleJobDto job : joobleOpt.get().getJobs()) {
                        String loc = job.getLocation() != null ? job.getLocation().toLowerCase() : "";
                        
                        // Filtrar estrictamente ubicaciones internacionales si no se solicitan remotos
                        if (!requestRemotos) {
                            if (loc.contains("worldwide") || loc.contains("europe") || loc.contains("united states") || 
                                loc.contains("usa") || loc.contains("canada") || loc.contains("germany") || 
                                loc.contains("spain") || loc.contains("united kingdom") || loc.contains("latam")) {
                                continue;
                            }
                        }

                        externas.add(EmpleoPublicoDTO.builder()
                                .id("ext_jooble_" + (job.getId() != null ? job.getId() : UUID.randomUUID().toString()))
                                .titulo(job.getTitle())
                                .empresa(job.getCompany())
                                .ubicacion(job.getLocation())
                                .descripcion(limpiarHtml(job.getSnippet()))
                                .salario(job.getSalary())
                                .tipoEmpleo(job.getType())
                                .modalidad(null) // No forzar PRESENCIAL
                                .fechaPublicacion(job.getUpdated())
                                .origen("JOOBLE")
                                .externa(true)
                                .urlExterna(job.getLink())
                                .logoUrl(null)
                                .build()
                        );
                    }
                }
            } catch (Exception e) {
                log.warn("Fallo al consultar Jooble API externa: {}", e.getMessage());
            }
        }

        // 2. Consultar Remotive SOLO si incluirRemotos es true y el filtro de origen lo permite
        if (requestRemotos && !"JOOBLE".equals(origenFiltro)) {
            try {
                var remotiveOpt = remotiveClient.buscarEmpleos(q, 50);
                if (remotiveOpt.isPresent() && remotiveOpt.get().getJobs() != null) {
                    String lowerQ = (q != null) ? q.trim().toLowerCase() : "";
                    List<RemotiveJobDto> rawJobs = remotiveOpt.get().getJobs();

                    for (RemotiveJobDto job : rawJobs) {
                        String title = job.getTitle() != null ? job.getTitle() : "";
                        String desc = job.getDescription() != null ? job.getDescription() : "";
                        String company = job.getCompanyName() != null ? job.getCompanyName() : "";
                        String jobLoc = job.getCandidateRequiredLocation() != null ? job.getCandidateRequiredLocation().toLowerCase() : "";

                        // Si hay término de búsqueda, priorizar coincidencias
                        if (!lowerQ.isEmpty()) {
                            boolean match = title.toLowerCase().contains(lowerQ) ||
                                            desc.toLowerCase().contains(lowerQ) ||
                                            company.toLowerCase().contains(lowerQ);
                            if (!match) {
                                continue;
                            }
                        }

                        // Filtro estricto por ubicación (aceptar solo las que digan mundial o peru)
                        boolean isWorldwide = jobLoc.contains("worldwide") || jobLoc.contains("anywhere") || jobLoc.contains("global") || jobLoc.contains("latam") || jobLoc.contains("americas") || jobLoc.contains("peru") || jobLoc.contains("perú");

                        if (isWorldwide) {
                            externas.add(mapearRemotive(job));
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Fallo al consultar empleos externos Remotive: {}", e.getMessage());
            }
        }

        // Guardar en caché
        externalJobsCache.put(cacheKey, new CacheEntry(externas));
        return externas;
    }

    private EmpleoPublicoDTO mapearRemotive(RemotiveJobDto job) {
        String jobLoc = job.getCandidateRequiredLocation();
        String displayLocation = (jobLoc != null && !jobLoc.trim().isEmpty())
                ? "🌎 Remoto - " + jobLoc
                : "🌎 Remoto - Worldwide";

        return EmpleoPublicoDTO.builder()
                .id("ext_remotive_" + job.getId())
                .titulo(job.getTitle())
                .empresa(job.getCompanyName())
                .ubicacion(displayLocation)
                .descripcion(limpiarHtml(job.getDescription()))
                .salario(job.getSalary())
                .tipoEmpleo(job.getJobType())
                .modalidad("REMOTO")
                .fechaPublicacion(job.getPublicationDate())
                .origen("REMOTIVE")
                .externa(true)
                .urlExterna(job.getUrl())
                .logoUrl(job.getCompanyLogo())
                .build();
    }

    private String limpiarHtml(String input) {
        if (input == null) return "";
        String clean = HTML_TAG_PATTERN.matcher(input).replaceAll(" ");
        return clean.replace("&nbsp;", " ")
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&quot;", "\"")
                .replaceAll("\\s+", " ")
                .trim();
    }
}
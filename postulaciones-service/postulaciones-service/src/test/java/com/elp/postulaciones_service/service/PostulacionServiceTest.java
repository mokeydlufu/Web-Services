package com.elp.postulaciones_service.service;

import com.elp.postulaciones_service.client.OfertasClient;
import com.elp.postulaciones_service.client.UsuariosClient;
import com.elp.postulaciones_service.dto.externo.OfertaResumenDTO;
import com.elp.postulaciones_service.dto.postulacion.PostulacionRequest;
import com.elp.postulaciones_service.dto.postulacion.PostulacionResponse;
import com.elp.postulaciones_service.exception.BusinessException;
import com.elp.postulaciones_service.exception.DuplicatePostulationException;
import com.elp.postulaciones_service.mapper.PostulacionMapper;
import com.elp.postulaciones_service.model.Postulacion;
import com.elp.postulaciones_service.repository.AuditoriaPostulacionRepository;
import com.elp.postulaciones_service.repository.HistorialPostulacionRepository;
import com.elp.postulaciones_service.repository.PostulacionRepository;
import com.elp.postulaciones_service.util.SecurityUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import com.elp.postulaciones_service.dto.ia.GenerarCartaIaRequest;
import com.elp.postulaciones_service.dto.ia.GenerarCartaIaResponse;
import com.elp.postulaciones_service.dto.externo.PerfilEstudianteDetalleDTO;
import com.elp.postulaciones_service.dto.externo.OfertaDetalleDTO;
import com.elp.postulaciones_service.dto.externo.UsuarioResumenDTO;
import com.elp.postulaciones_service.exception.ForbiddenException;
import com.elp.postulaciones_service.model.enums.EstadoPostulacion;
import com.elp.postulaciones_service.dto.ResultadoEvaluacionDTO;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PostulacionServiceTest {

    @Mock
    private PostulacionRepository postulacionRepository;
    @Mock
    private HistorialPostulacionRepository historialRepository;
    @Mock
    private AuditoriaPostulacionRepository auditoriaRepository;
    @Mock
    private EstadoPostulacionService estadoPostulacionService;
    @Mock
    private PostulacionMapper postulacionMapper;
    @Mock
    private OfertasClient ofertasClient;
    @Mock
    private UsuariosClient usuariosClient;
    @Mock
    private CloudinaryService cloudinaryService;
    @Mock
    private GeminiAiService geminiAiService;
    @org.mockito.Spy
    private com.elp.postulaciones_service.security.EmpresaAuthorizationService empresaAuthorizationService = new com.elp.postulaciones_service.security.EmpresaAuthorizationService();

    @InjectMocks
    private PostulacionServiceImpl postulacionService;

    private MockedStatic<SecurityUtils> securityUtilsMock;

    private UUID candidatoId;
    private UUID ofertaId;
    private UUID empresaId;
    private PostulacionRequest request;

    @BeforeEach
    void setUp() {
        securityUtilsMock = Mockito.mockStatic(SecurityUtils.class);
        securityUtilsMock.when(SecurityUtils::getJwtToken).thenReturn("mock-jwt");

        candidatoId = UUID.randomUUID();
        ofertaId = UUID.randomUUID();
        empresaId = UUID.randomUUID();

        request = new PostulacionRequest();
        request.setOfertaId(ofertaId);
        request.setEmpresaId(empresaId);
    }

    @AfterEach
    void tearDown() {
        securityUtilsMock.close();
    }

    @Test
    void crearPostulacionExito() {
        when(postulacionRepository.existsByCandidatoIdAndOfertaId(candidatoId, ofertaId)).thenReturn(false);

        OfertaResumenDTO ofertaMock = new OfertaResumenDTO();
        ofertaMock.setAceptaPostulaciones(true);
        ofertaMock.setEstado("ACTIVA");
        ofertaMock.setEmpresaId(empresaId);
        when(ofertasClient.validarOferta(eq(ofertaId), anyString())).thenReturn(ofertaMock);

        Postulacion guardada = new Postulacion();
        when(postulacionRepository.saveAndFlush(any(Postulacion.class))).thenReturn(guardada);
        when(postulacionMapper.toResponse(any())).thenReturn(new PostulacionResponse());

        assertDoesNotThrow(() -> postulacionService.crearPostulacion(candidatoId, request, null));
        verify(postulacionRepository).saveAndFlush(any(Postulacion.class));
    }

    @Test
    void crearPostulacionDuplicadaPreCheck() {
        when(postulacionRepository.existsByCandidatoIdAndOfertaId(candidatoId, ofertaId)).thenReturn(true);

        assertThrows(DuplicatePostulationException.class, () -> postulacionService.crearPostulacion(candidatoId, request, null));
    }

    @Test
    void crearPostulacionBloqueadaSiActiva() {
        Postulacion existente = new Postulacion();
        existente.setEstado(EstadoPostulacion.ENVIADA);
        when(postulacionRepository.findByCandidatoIdAndOfertaId(candidatoId, ofertaId)).thenReturn(Optional.of(existente));

        assertThrows(DuplicatePostulationException.class, () -> postulacionService.crearPostulacion(candidatoId, request, null));
    }

    @Test
    void crearPostulacionReactivarSiEstabaRetirada() {
        Postulacion existente = new Postulacion();
        existente.setEstado(EstadoPostulacion.RETIRADA);
        existente.setUuid(UUID.randomUUID());
        when(postulacionRepository.findByCandidatoIdAndOfertaId(candidatoId, ofertaId)).thenReturn(Optional.of(existente));

        OfertaResumenDTO ofertaMock = new OfertaResumenDTO();
        ofertaMock.setAceptaPostulaciones(true);
        ofertaMock.setEstado("ACTIVA");
        ofertaMock.setEmpresaId(empresaId);
        when(ofertasClient.validarOferta(eq(ofertaId), anyString())).thenReturn(ofertaMock);

        when(postulacionRepository.saveAndFlush(any(Postulacion.class))).thenReturn(existente);
        when(postulacionMapper.toResponse(any())).thenReturn(new PostulacionResponse());

        assertDoesNotThrow(() -> postulacionService.crearPostulacion(candidatoId, request, null));
        assertEquals(EstadoPostulacion.ENVIADA, existente.getEstado());
        verify(postulacionRepository).saveAndFlush(existente);
        verify(historialRepository).save(argThat(h -> h.getEstadoAnterior() == EstadoPostulacion.RETIRADA && h.getEstadoNuevo() == EstadoPostulacion.ENVIADA));
    }

    @Test
    void crearPostulacionReactivarSiEstabaCancelada() {
        Postulacion existente = new Postulacion();
        existente.setEstado(EstadoPostulacion.CANCELADA);
        existente.setUuid(UUID.randomUUID());
        when(postulacionRepository.findByCandidatoIdAndOfertaId(candidatoId, ofertaId)).thenReturn(Optional.of(existente));

        OfertaResumenDTO ofertaMock = new OfertaResumenDTO();
        ofertaMock.setAceptaPostulaciones(true);
        ofertaMock.setEstado("ACTIVA");
        ofertaMock.setEmpresaId(empresaId);
        when(ofertasClient.validarOferta(eq(ofertaId), anyString())).thenReturn(ofertaMock);

        when(postulacionRepository.saveAndFlush(any(Postulacion.class))).thenReturn(existente);
        when(postulacionMapper.toResponse(any())).thenReturn(new PostulacionResponse());

        assertDoesNotThrow(() -> postulacionService.crearPostulacion(candidatoId, request, null));
        assertEquals(EstadoPostulacion.ENVIADA, existente.getEstado());
        verify(postulacionRepository).saveAndFlush(existente);
        verify(historialRepository).save(argThat(h -> h.getEstadoAnterior() == EstadoPostulacion.CANCELADA && h.getEstadoNuevo() == EstadoPostulacion.ENVIADA));
    }

    @Test
    void crearPostulacionDuplicadaConcurrencia() {
        when(postulacionRepository.existsByCandidatoIdAndOfertaId(candidatoId, ofertaId)).thenReturn(false);

        OfertaResumenDTO ofertaMock = new OfertaResumenDTO();
        ofertaMock.setAceptaPostulaciones(true);
        ofertaMock.setEstado("ACTIVA");
        ofertaMock.setEmpresaId(empresaId);
        when(ofertasClient.validarOferta(eq(ofertaId), anyString())).thenReturn(ofertaMock);

        when(postulacionRepository.saveAndFlush(any(Postulacion.class))).thenThrow(new DataIntegrityViolationException("Unique constraint"));

        assertThrows(DuplicatePostulationException.class, () -> postulacionService.crearPostulacion(candidatoId, request, null));
    }

    @Test
    void crearPostulacionOfertaCerrada() {
        when(postulacionRepository.existsByCandidatoIdAndOfertaId(candidatoId, ofertaId)).thenReturn(false);

        OfertaResumenDTO ofertaMock = new OfertaResumenDTO();
        ofertaMock.setAceptaPostulaciones(false); // cerrada
        ofertaMock.setEstado("CERRADA");
        when(ofertasClient.validarOferta(eq(ofertaId), anyString())).thenReturn(ofertaMock);

        assertThrows(BusinessException.class, () -> postulacionService.crearPostulacion(candidatoId, request, null));
    }

    @Test
    void crearPostulacionEmpresaInvalida() {
        when(postulacionRepository.existsByCandidatoIdAndOfertaId(candidatoId, ofertaId)).thenReturn(false);

        OfertaResumenDTO ofertaMock = new OfertaResumenDTO();
        ofertaMock.setAceptaPostulaciones(true);
        ofertaMock.setEstado("ACTIVA");
        ofertaMock.setEmpresaId(UUID.randomUUID()); // otra empresa
        when(ofertasClient.validarOferta(eq(ofertaId), anyString())).thenReturn(ofertaMock);

        assertThrows(BusinessException.class, () -> postulacionService.crearPostulacion(candidatoId, request, null));
    }

    @Test
    void crearPostulacionConCartaManual_guardaCarta() {
        when(postulacionRepository.existsByCandidatoIdAndOfertaId(candidatoId, ofertaId)).thenReturn(false);

        OfertaResumenDTO ofertaMock = new OfertaResumenDTO();
        ofertaMock.setAceptaPostulaciones(true);
        ofertaMock.setEstado("ACTIVA");
        ofertaMock.setEmpresaId(empresaId);
        when(ofertasClient.validarOferta(eq(ofertaId), anyString())).thenReturn(ofertaMock);

        request.setCartaPresentacion("Me interesa esta oportunidad porque cuento con conocimientos en desarrollo Java y Spring Boot.");
        request.setGeneradaConIa(false);

        Postulacion guardada = new Postulacion();
        guardada.setId(UUID.randomUUID());
        guardada.setUuid(UUID.randomUUID());
        guardada.setCartaPresentacion(request.getCartaPresentacion());
        guardada.setGeneradaConIa(false);

        when(postulacionRepository.saveAndFlush(any(Postulacion.class))).thenReturn(guardada);

        PostulacionResponse responseMock = new PostulacionResponse();
        responseMock.setCartaPresentacion(request.getCartaPresentacion());
        responseMock.setGeneradaConIa(false);
        when(postulacionMapper.toResponse(any(Postulacion.class))).thenReturn(responseMock);

        PostulacionResponse result = postulacionService.crearPostulacion(candidatoId, request, null);

        assertNotNull(result);
        assertEquals(request.getCartaPresentacion(), result.getCartaPresentacion());
        assertFalse(Boolean.TRUE.equals(result.getGeneradaConIa()));
        verify(postulacionRepository).saveAndFlush(argThat(p -> 
            p.getCartaPresentacion().equals(request.getCartaPresentacion()) &&
            Boolean.FALSE.equals(p.getGeneradaConIa())
        ));
    }

    @Test
    void crearPostulacionCartaSupera3000Caracteres_lanzaExcepcion() {
        when(postulacionRepository.existsByCandidatoIdAndOfertaId(candidatoId, ofertaId)).thenReturn(false);

        OfertaResumenDTO ofertaMock = new OfertaResumenDTO();
        ofertaMock.setAceptaPostulaciones(true);
        ofertaMock.setEstado("ACTIVA");
        ofertaMock.setEmpresaId(empresaId);
        when(ofertasClient.validarOferta(eq(ofertaId), anyString())).thenReturn(ofertaMock);

        String textoLargo = "a".repeat(3001);
        request.setCartaPresentacion(textoLargo);

        assertThrows(BusinessException.class, () -> postulacionService.crearPostulacion(candidatoId, request, null));
    }

    @Test
    void generarBorradorCarta_conGeminiExitoso_retornaCarta() throws IOException {
        GenerarCartaIaRequest req = GenerarCartaIaRequest.builder()
                .ofertaId(ofertaId)
                .estudianteId(candidatoId)
                .build();

        PerfilEstudianteDetalleDTO perfilMock = PerfilEstudianteDetalleDTO.builder()
                .uuid(candidatoId)
                .nombreCompleto("Juan Perez")
                .carrera("Ingenieria de Sistemas")
                .habilidades(List.of("Java", "Spring Boot", "SQL"))
                .build();
        when(usuariosClient.obtenerPerfilEstudiante(eq(candidatoId), anyString())).thenReturn(perfilMock);

        OfertaDetalleDTO ofertaDetalle = OfertaDetalleDTO.builder()
                .id(ofertaId)
                .titulo("Desarrollador Java Junior")
                .descripcion("Buscamos programador junior con ganas de aprender")
                .empresaId(empresaId)
                .build();
        when(ofertasClient.obtenerOfertaDetalle(eq(ofertaId), anyString())).thenReturn(ofertaDetalle);

        UsuarioResumenDTO resumenEmpresa = new UsuarioResumenDTO();
        resumenEmpresa.setNombreCompleto("Tech Solutions");
        when(usuariosClient.obtenerResumenCandidato(eq(empresaId), anyString())).thenReturn(resumenEmpresa);

        String textoIa = "Estimado equipo de Tech Solutions, les escribo para expresar mi gran interes en el puesto...";
        when(geminiAiService.generarBorradorCartaPresentacion(anyString())).thenReturn(textoIa);

        GenerarCartaIaResponse response = postulacionService.generarBorradorCarta(req, candidatoId);

        assertNotNull(response);
        assertTrue(response.isSuccess());
        assertEquals(textoIa, response.getCarta());
        verify(geminiAiService).generarBorradorCartaPresentacion(anyString());
    }

    @Test
    void generarBorradorCarta_conGeminiFalla_retornaErrorControlado() throws IOException {
        GenerarCartaIaRequest req = GenerarCartaIaRequest.builder()
                .ofertaId(ofertaId)
                .estudianteId(candidatoId)
                .build();

        when(usuariosClient.obtenerPerfilEstudiante(eq(candidatoId), anyString())).thenReturn(null);
        when(ofertasClient.obtenerOfertaDetalle(eq(ofertaId), anyString())).thenReturn(null);

        OfertaResumenDTO ofertaResumen = new OfertaResumenDTO();
        ofertaResumen.setTitulo("Practicante");
        ofertaResumen.setEmpresaId(empresaId);
        when(ofertasClient.validarOferta(eq(ofertaId), anyString())).thenReturn(ofertaResumen);

        when(geminiAiService.generarBorradorCartaPresentacion(anyString())).thenThrow(new IOException("API quota exceeded"));

        GenerarCartaIaResponse response = postulacionService.generarBorradorCarta(req, candidatoId);

        assertNotNull(response);
        assertFalse(response.isSuccess());
        assertNull(response.getCarta());
        assertTrue(response.getMessage().contains("No fue posible generar la carta: API quota exceeded"));
    }

    @Test
    void generarBorradorCarta_estudianteDistinto_lanzaForbidden() {
        GenerarCartaIaRequest req = GenerarCartaIaRequest.builder()
                .ofertaId(ofertaId)
                .estudianteId(UUID.randomUUID()) // ID de otro estudiante
                .build();

        assertThrows(ForbiddenException.class, () -> postulacionService.generarBorradorCarta(req, candidatoId));
    }

    @Test
    void reanalizarPostulacionIa_exitosoConGemini() {
        UUID postUuid = UUID.randomUUID();
        Postulacion postulacion = Postulacion.builder()
                .uuid(postUuid)
                .candidatoId(candidatoId)
                .ofertaId(ofertaId)
                .empresaId(empresaId)
                .cvUrl("https://res.cloudinary.com/demo/cv.pdf")
                .estado(EstadoPostulacion.ENVIADA)
                .build();

        when(postulacionRepository.findByUuid(postUuid)).thenReturn(Optional.of(postulacion));
        when(postulacionRepository.saveAndFlush(any(Postulacion.class))).thenAnswer(i -> i.getArgument(0));
        when(postulacionMapper.toResponse(any(Postulacion.class))).thenAnswer(i -> {
            Postulacion p = i.getArgument(0);
            PostulacionResponse r = new PostulacionResponse();
            r.setUuid(p.getUuid());
            r.setOrigenAnalisis(p.getOrigenAnalisis());
            r.setPorcentajeCoincidencia(p.getPorcentajeCoincidencia());
            r.setCumpleRequerimientos(p.getCumpleRequerimientos());
            r.setResumenIa(p.getResumenIa());
            r.setHabilidadesEncontradas(p.getHabilidadesEncontradas());
            return r;
        });

        OfertaResumenDTO ofertaResumen = new OfertaResumenDTO();
        ofertaResumen.setTitulo("Desarrollador Java");
        when(ofertasClient.validarOferta(eq(ofertaId), anyString())).thenReturn(ofertaResumen);

        ResultadoEvaluacionDTO evalMock = ResultadoEvaluacionDTO.builder()
                .cumpleRequerimientos(true)
                .porcentajeCoincidencia(92)
                .resumenEvaluacion("Excelente perfil para desarrollador Java")
                .habilidadesEncontradas("Java, Spring Boot, PostgreSQL")
                .origen("GEMINI")
                .build();
        when(geminiAiService.evaluarCvContraPerfilUrl(eq("https://res.cloudinary.com/demo/cv.pdf"), anyString()))
                .thenReturn(evalMock);

        PostulacionResponse response = postulacionService.reanalizarPostulacionIa(postUuid, empresaId, "EMPRESA");

        assertNotNull(response);
        assertEquals("GEMINI", response.getOrigenAnalisis());
        assertEquals(92, response.getPorcentajeCoincidencia());
        assertTrue(response.getCumpleRequerimientos());
        assertEquals("Excelente perfil para desarrollador Java", response.getResumenIa());
        assertEquals("Java, Spring Boot, PostgreSQL", response.getHabilidadesEncontradas());
    }

    @Test
    void reanalizarPostulacionIa_conFallback() {
        UUID postUuid = UUID.randomUUID();
        Postulacion postulacion = Postulacion.builder()
                .uuid(postUuid)
                .candidatoId(candidatoId)
                .ofertaId(ofertaId)
                .empresaId(empresaId)
                .cvUrl("https://res.cloudinary.com/demo/cv.pdf")
                .estado(EstadoPostulacion.ENVIADA)
                .build();

        when(postulacionRepository.findByUuid(postUuid)).thenReturn(Optional.of(postulacion));
        when(postulacionRepository.saveAndFlush(any(Postulacion.class))).thenAnswer(i -> i.getArgument(0));
        when(postulacionMapper.toResponse(any(Postulacion.class))).thenAnswer(i -> {
            Postulacion p = i.getArgument(0);
            PostulacionResponse r = new PostulacionResponse();
            r.setUuid(p.getUuid());
            r.setOrigenAnalisis(p.getOrigenAnalisis());
            r.setPorcentajeCoincidencia(p.getPorcentajeCoincidencia());
            r.setCumpleRequerimientos(p.getCumpleRequerimientos());
            r.setResumenIa(p.getResumenIa());
            r.setHabilidadesEncontradas(p.getHabilidadesEncontradas());
            return r;
        });

        OfertaResumenDTO ofertaResumen = new OfertaResumenDTO();
        ofertaResumen.setTitulo("Desarrollador Java");
        when(ofertasClient.validarOferta(eq(ofertaId), anyString())).thenReturn(ofertaResumen);

        ResultadoEvaluacionDTO fallbackMock = ResultadoEvaluacionDTO.builder()
                .cumpleRequerimientos(true)
                .porcentajeCoincidencia(84)
                .resumenEvaluacion("Análisis de contingencia")
                .habilidadesEncontradas("Java, Spring Boot")
                .origen("FALLBACK")
                .build();
        when(geminiAiService.evaluarCvContraPerfilUrl(eq("https://res.cloudinary.com/demo/cv.pdf"), anyString()))
                .thenReturn(fallbackMock);

        PostulacionResponse response = postulacionService.reanalizarPostulacionIa(postUuid, empresaId, "EMPRESA");

        assertNotNull(response);
        assertEquals("FALLBACK", response.getOrigenAnalisis());
        assertEquals(84, response.getPorcentajeCoincidencia());
    }

    @Test
    void reanalizarPostulacionIa_otraEmpresa_lanzaForbidden() {
        UUID postUuid = UUID.randomUUID();
        Postulacion postulacion = Postulacion.builder()
                .uuid(postUuid)
                .candidatoId(candidatoId)
                .ofertaId(ofertaId)
                .empresaId(empresaId)
                .build();

        when(postulacionRepository.findByUuid(postUuid)).thenReturn(Optional.of(postulacion));

        UUID otraEmpresaId = UUID.randomUUID();
        assertThrows(ForbiddenException.class, () -> 
                postulacionService.reanalizarPostulacionIa(postUuid, otraEmpresaId, "EMPRESA"));
    }

    @Test
    void reanalizarPostulacionIa_reclutadorMismaEmpresaConClaim_permiteReanalisis() {
        UUID postUuid = UUID.randomUUID();
        Postulacion postulacion = Postulacion.builder()
                .uuid(postUuid)
                .candidatoId(candidatoId)
                .ofertaId(ofertaId)
                .empresaId(empresaId)
                .cvUrl("https://res.cloudinary.com/demo/cv.pdf")
                .estado(EstadoPostulacion.ENVIADA)
                .build();

        when(postulacionRepository.findByUuid(postUuid)).thenReturn(Optional.of(postulacion));
        when(postulacionRepository.saveAndFlush(any(Postulacion.class))).thenAnswer(i -> i.getArgument(0));
        when(postulacionMapper.toResponse(any(Postulacion.class))).thenAnswer(i -> {
            Postulacion p = i.getArgument(0);
            PostulacionResponse r = new PostulacionResponse();
            r.setUuid(p.getUuid());
            r.setOrigenAnalisis(p.getOrigenAnalisis());
            r.setPorcentajeCoincidencia(p.getPorcentajeCoincidencia());
            return r;
        });

        securityUtilsMock.when(SecurityUtils::getEmpresaIdClaim).thenReturn(empresaId);

        OfertaResumenDTO ofertaResumen = new OfertaResumenDTO();
        ofertaResumen.setTitulo("Desarrollador");
        when(ofertasClient.validarOferta(eq(ofertaId), anyString())).thenReturn(ofertaResumen);

        ResultadoEvaluacionDTO mockEval = ResultadoEvaluacionDTO.builder()
                .cumpleRequerimientos(true)
                .porcentajeCoincidencia(88)
                .origen("GEMINI")
                .resumenEvaluacion("OK")
                .build();
        when(geminiAiService.evaluarCvContraPerfilUrl(eq("https://res.cloudinary.com/demo/cv.pdf"), anyString()))
                .thenReturn(mockEval);

        UUID reclutadorId = UUID.randomUUID();
        PostulacionResponse response = postulacionService.reanalizarPostulacionIa(postUuid, reclutadorId, "RECLUTADOR");

        assertNotNull(response);
        assertEquals("GEMINI", response.getOrigenAnalisis());
        assertEquals(88, response.getPorcentajeCoincidencia());
    }

    @Test
    void reanalizarPostulacionIa_reclutadorOtraEmpresaConClaim_lanzaForbidden() {
        UUID postUuid = UUID.randomUUID();
        Postulacion postulacion = Postulacion.builder()
                .uuid(postUuid)
                .candidatoId(candidatoId)
                .ofertaId(ofertaId)
                .empresaId(empresaId)
                .build();

        when(postulacionRepository.findByUuid(postUuid)).thenReturn(Optional.of(postulacion));

        UUID otraEmpresaId = UUID.randomUUID();
        securityUtilsMock.when(SecurityUtils::getEmpresaIdClaim).thenReturn(otraEmpresaId);

        UUID reclutadorId = UUID.randomUUID();
        assertThrows(ForbiddenException.class, () -> 
                postulacionService.reanalizarPostulacionIa(postUuid, reclutadorId, "RECLUTADOR"));
    }

    @Test
    void reanalizarPostulacionIa_adminPermitido() {
        UUID postUuid = UUID.randomUUID();
        Postulacion postulacion = Postulacion.builder()
                .uuid(postUuid)
                .candidatoId(candidatoId)
                .ofertaId(ofertaId)
                .empresaId(empresaId)
                .cvUrl("https://res.cloudinary.com/demo/cv.pdf")
                .estado(EstadoPostulacion.ENVIADA)
                .build();

        when(postulacionRepository.findByUuid(postUuid)).thenReturn(Optional.of(postulacion));
        when(postulacionRepository.saveAndFlush(any(Postulacion.class))).thenAnswer(i -> i.getArgument(0));
        when(postulacionMapper.toResponse(any(Postulacion.class))).thenAnswer(i -> {
            Postulacion p = i.getArgument(0);
            PostulacionResponse r = new PostulacionResponse();
            r.setUuid(p.getUuid());
            return r;
        });

        OfertaResumenDTO ofertaResumen = new OfertaResumenDTO();
        ofertaResumen.setTitulo("Desarrollador");
        when(ofertasClient.validarOferta(eq(ofertaId), anyString())).thenReturn(ofertaResumen);

        ResultadoEvaluacionDTO mockEval = ResultadoEvaluacionDTO.builder()
                .cumpleRequerimientos(true)
                .porcentajeCoincidencia(90)
                .origen("GEMINI")
                .build();
        when(geminiAiService.evaluarCvContraPerfilUrl(eq("https://res.cloudinary.com/demo/cv.pdf"), anyString()))
                .thenReturn(mockEval);

        UUID adminId = UUID.randomUUID();
        PostulacionResponse response = postulacionService.reanalizarPostulacionIa(postUuid, adminId, "ADMIN");
        assertNotNull(response);
    }

    @Test
    void reanalizarPostulacionIa_estudianteLanzaForbidden() {
        UUID postUuid = UUID.randomUUID();
        Postulacion postulacion = Postulacion.builder()
                .uuid(postUuid)
                .candidatoId(candidatoId)
                .ofertaId(ofertaId)
                .empresaId(empresaId)
                .build();

        when(postulacionRepository.findByUuid(postUuid)).thenReturn(Optional.of(postulacion));

        assertThrows(ForbiddenException.class, () -> 
                postulacionService.reanalizarPostulacionIa(postUuid, candidatoId, "ESTUDIANTE"));
    }
}

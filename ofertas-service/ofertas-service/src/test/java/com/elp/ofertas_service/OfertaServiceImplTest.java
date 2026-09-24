package com.elp.ofertas_service;

import com.elp.ofertas_service.dto.request.OfertaRequest;
import com.elp.ofertas_service.dto.response.OfertaResponse;
import com.elp.ofertas_service.entity.CategoriaOferta;
import com.elp.ofertas_service.entity.Oferta;
import com.elp.ofertas_service.enums.EstadoOferta;
import com.elp.ofertas_service.enums.Jornada;
import com.elp.ofertas_service.enums.Modalidad;
import com.elp.ofertas_service.enums.NivelExperiencia;
import com.elp.ofertas_service.enums.TipoContrato;
import com.elp.ofertas_service.exception.BusinessException;
import com.elp.ofertas_service.exception.ForbiddenException;
import com.elp.ofertas_service.mapper.OfertaMapper;
import com.elp.ofertas_service.repository.AuditoriaOfertaRepository;
import com.elp.ofertas_service.repository.CategoriaOfertaRepository;
import com.elp.ofertas_service.repository.OfertaRepository;
import com.elp.ofertas_service.repository.RequisitoOfertaRepository;
import com.elp.ofertas_service.security.EmpresaAuthorizationService;
import com.elp.ofertas_service.service.EstadoOfertaService;
import com.elp.ofertas_service.service.impl.OfertaServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.MDC;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OfertaServiceImplTest {

    @Mock
    private OfertaRepository ofertaRepository;
    @Mock
    private RequisitoOfertaRepository requisitoRepository;
    @Mock
    private CategoriaOfertaRepository categoriaRepository;
    @Mock
    private AuditoriaOfertaRepository auditoriaRepository;
    @Mock
    private EstadoOfertaService estadoOfertaService;
    @Mock
    private EmpresaAuthorizationService empresaAuthorizationService;
    @Mock
    private OfertaMapper ofertaMapper;

    @InjectMocks
    private OfertaServiceImpl ofertaService;

    private UUID reclutadorId;
    private UUID empresaId;
    private UUID ofertaId;
    private OfertaRequest request;

    @BeforeEach
    void setUp() {
        reclutadorId = UUID.randomUUID();
        empresaId = UUID.randomUUID();
        ofertaId = UUID.randomUUID();

        request = new OfertaRequest();
        request.setTitulo("Java Dev");
        request.setDescripcion("Dev");
        request.setCategoriaId(UUID.randomUUID());
        request.setSalarioMinimo(new BigDecimal("1000"));
        request.setSalarioMaximo(new BigDecimal("2000"));
        
        MDC.put("traceId", "test-trace");
    }

    @Test
    void crearOferta_DebeLanzarForbidden_CuandoNoTienePermiso() {
        when(empresaAuthorizationService.tienePermisoDePropiedad(reclutadorId, empresaId)).thenReturn(false);

        assertThrows(ForbiddenException.class, () -> ofertaService.crearOferta(reclutadorId, empresaId, request, List.of()));
    }

    @Test
    void crearOferta_DebeLanzarBusinessEx_CuandoSalarioMinMayorMax() {
        when(empresaAuthorizationService.tienePermisoDePropiedad(reclutadorId, empresaId)).thenReturn(true);
        request.setSalarioMinimo(new BigDecimal("3000"));
        request.setSalarioMaximo(new BigDecimal("2000"));

        assertThrows(BusinessException.class, () -> ofertaService.crearOferta(reclutadorId, empresaId, request, List.of()));
    }

    @Test
    void crearOferta_Exito() {
        when(empresaAuthorizationService.tienePermisoDePropiedad(reclutadorId, empresaId)).thenReturn(true);
        when(categoriaRepository.existsById(request.getCategoriaId())).thenReturn(true);
        
        Oferta ofertaGuardada = new Oferta();
        ofertaGuardada.setId(ofertaId);
        when(ofertaRepository.save(any(Oferta.class))).thenReturn(ofertaGuardada);
        when(ofertaMapper.toResponse(any(), any())).thenReturn(OfertaResponse.builder().id(ofertaId).build());

        OfertaResponse response = ofertaService.crearOferta(reclutadorId, empresaId, request, List.of());

        assertNotNull(response);
        assertEquals(ofertaId, response.getId());
        verify(auditoriaRepository, times(1)).save(any());
    }

    @Test
    void publicarOferta_DebeLanzarExcepcion_CuandoNoTieneVencimiento() {
        Oferta oferta = new Oferta();
        oferta.setId(ofertaId);
        oferta.setEmpresaId(empresaId);
        oferta.setEstado(EstadoOferta.BORRADOR);

        when(ofertaRepository.findById(ofertaId)).thenReturn(Optional.of(oferta));
        when(empresaAuthorizationService.tienePermisoDePropiedad(reclutadorId, empresaId)).thenReturn(true);

        assertThrows(BusinessException.class, () -> ofertaService.publicarOferta(ofertaId, reclutadorId));
    }
}
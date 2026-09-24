package com.elp.ofertas_service;

import com.elp.ofertas_service.entity.Oferta;
import com.elp.ofertas_service.exception.ForbiddenException;
import com.elp.ofertas_service.repository.OfertaRepository;
import com.elp.ofertas_service.security.EmpresaAuthorizationService;
import com.elp.ofertas_service.service.impl.OfertaServiceImpl;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
public class IdorSecurityTest {

    @Mock
    private OfertaRepository ofertaRepository;

    @Mock
    private EmpresaAuthorizationService empresaAuthorizationService;

    @InjectMocks
    private OfertaServiceImpl ofertaService;

    @Test
    public void testA_modifica_A_Permitido() {
    }

    @Test
    public void testA_modifica_B_Prohibido() {
        UUID ofertaId = UUID.randomUUID();
        UUID reclutadorId = UUID.randomUUID();
        UUID otroReclutadorId = UUID.randomUUID();

        Oferta oferta = new Oferta();
        oferta.setId(ofertaId);
        oferta.setEmpresaId(UUID.randomUUID());
        oferta.setReclutadorId(otroReclutadorId);

        Mockito.when(ofertaRepository.findById(ofertaId)).thenReturn(Optional.of(oferta));
    }

    @Test
    void debePrevenirIDOR() {
        UUID ofertaId = UUID.randomUUID();
        UUID reclutadorMaliciosoId = UUID.randomUUID();
        UUID empresaVictimaId = UUID.randomUUID();
        
        Oferta oferta = new Oferta();
        oferta.setId(ofertaId);
        oferta.setEmpresaId(empresaVictimaId);

        Mockito.when(ofertaRepository.findById(ofertaId)).thenReturn(Optional.of(oferta));
        Mockito.when(empresaAuthorizationService.tienePermisoDePropiedad(reclutadorMaliciosoId, empresaVictimaId)).thenReturn(false);

        assertThrows(ForbiddenException.class, () -> {
            ofertaService.publicarOferta(ofertaId, reclutadorMaliciosoId);
        });
    }
}
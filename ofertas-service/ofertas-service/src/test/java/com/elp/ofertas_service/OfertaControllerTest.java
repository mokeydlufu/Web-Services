package com.elp.ofertas_service;

import com.elp.ofertas_service.controller.OfertaController;
import com.elp.ofertas_service.dto.request.OfertaRequest;
import com.elp.ofertas_service.dto.response.OfertaResponse;
import com.elp.ofertas_service.service.OfertaService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class OfertaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OfertaService ofertaService;

    private final UUID testUserId = UUID.randomUUID();

    @Test
    public void testGetOferta_Returns200() throws Exception {
        UUID id = UUID.randomUUID();
        OfertaResponse response = OfertaResponse.builder().id(id).build();
        Mockito.when(ofertaService.obtenerOfertaPorId(id)).thenReturn(response);

        mockMvc.perform(get("/api/ofertas/" + id))
                .andExpect(status().isOk());
    }

    @Test
    public void testPatchPublicar_Returns200() throws Exception {
        UUID id = UUID.randomUUID();
        OfertaResponse response = OfertaResponse.builder().id(id).build();
        Mockito.when(ofertaService.publicarOferta(Mockito.eq(id), Mockito.eq(testUserId))).thenReturn(response);

        mockMvc.perform(patch("/api/ofertas/" + id + "/publicar")
                .with(SecurityMockMvcRequestPostProcessors.jwt()
                        .jwt(jwt -> jwt.subject(testUserId.toString()))
                        .authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_RECLUTADOR"))))
                .andExpect(status().isOk());
    }
    
    @Test
    public void testPatchPublicar_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(patch("/api/ofertas/" + UUID.randomUUID() + "/publicar"))
                .andExpect(status().isUnauthorized());
    }
    
    @Test
    public void testPatchPublicar_WrongRole_Returns403() throws Exception {
        mockMvc.perform(patch("/api/ofertas/" + UUID.randomUUID() + "/publicar")
                .with(SecurityMockMvcRequestPostProcessors.jwt()
                        .jwt(jwt -> jwt.subject(testUserId.toString()))
                        .authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ESTUDIANTE"))))
                .andExpect(status().isForbidden());
    }
}

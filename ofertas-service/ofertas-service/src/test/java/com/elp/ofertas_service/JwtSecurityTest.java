package com.elp.ofertas_service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;

@SpringBootTest
@AutoConfigureMockMvc
public class JwtSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    private final UUID testUserId = UUID.randomUUID();

    @Test
    public void testUnauthenticatedAccess_Returns401() throws Exception {
        mockMvc.perform(post("/api/ofertas"))
                .andDo(print())
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void testAuthenticatedAccess_Returns400() throws Exception {
        mockMvc.perform(post("/api/ofertas?empresaId=" + UUID.randomUUID())
                .with(SecurityMockMvcRequestPostProcessors.jwt()
                        .jwt(jwt -> jwt.subject(testUserId.toString()))
                        .authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_RECLUTADOR"))))
                .andDo(print())
                .andExpect(status().isBadRequest());
    }

    @Test
    public void testWrongRoleAccess_Returns403() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/ofertas/" + UUID.randomUUID() + "/pausar")
                .with(SecurityMockMvcRequestPostProcessors.jwt()
                        .jwt(jwt -> jwt.subject(testUserId.toString()))
                        .authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ESTUDIANTE"))))
                .andDo(print())
                .andExpect(status().isForbidden());
    }
}

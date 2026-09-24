package com.elp.ofertas_service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class BusquedaOfertaTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void testBusquedaConPaginacion() throws Exception {
        mockMvc.perform(get("/api/ofertas?page=0&size=10"))
                .andExpect(status().isOk());
    }

    @Test
    public void testBusquedaConFiltros() throws Exception {
        mockMvc.perform(get("/api/ofertas?q=java&salarioMin=1000&modalidad=REMOTO"))
                .andExpect(status().isOk());
    }
}
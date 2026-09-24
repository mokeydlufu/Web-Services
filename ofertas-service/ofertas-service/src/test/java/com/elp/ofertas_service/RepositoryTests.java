package com.elp.ofertas_service;

import com.elp.ofertas_service.entity.CategoriaOferta;
import com.elp.ofertas_service.repository.CategoriaOfertaRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
public class RepositoryTests {

    @Autowired
    private CategoriaOfertaRepository categoriaOfertaRepository;

    @Test
    public void testGuardarCategoria() {
        CategoriaOferta cat = new CategoriaOferta();
        cat.setNombre("IT-" + java.util.UUID.randomUUID().toString());
        cat = categoriaOfertaRepository.save(cat);
        assertNotNull(cat.getId());
    }
}
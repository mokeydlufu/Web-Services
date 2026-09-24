package com.elp.ofertas_service.config;

import com.elp.ofertas_service.entity.CategoriaOferta;
import com.elp.ofertas_service.repository.CategoriaOfertaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class CategoriaSeeder implements CommandLineRunner {

    private final CategoriaOfertaRepository categoriaRepository;

    @Override
    public void run(String... args) {
        log.info("Limpiando categorías anteriores para cargar el catálogo definitivo...");
        categoriaRepository.deleteAll();

        log.info("Insertando catálogo real de categorías de mercado laboral...");
        
        List<CategoriaOferta> categorias = Arrays.asList(
                CategoriaOferta.builder().nombre("Ingeniería de Sistemas y Tecnología").descripcion("Área relacionada con desarrollo, TI y soporte").activo(true).build(),
                CategoriaOferta.builder().nombre("Desarrollo de Software y Programación").descripcion("Área relacionada con desarrollo de software").activo(true).build(),
                CategoriaOferta.builder().nombre("Administración y Gestión de Empresas").descripcion("Área relacionada con administración y finanzas").activo(true).build(),
                CategoriaOferta.builder().nombre("Contabilidad y Finanzas").descripcion("Área contable y financiera").activo(true).build(),
                CategoriaOferta.builder().nombre("Logística, Almacén y Transporte").descripcion("Área de logística y cadena de suministro").activo(true).build(),
                CategoriaOferta.builder().nombre("Atención al Cliente y Call Center").descripcion("Área de soporte y atención a clientes").activo(true).build(),
                CategoriaOferta.builder().nombre("Marketing, Publicidad y Diseño").descripcion("Área de marketing y diseño gráfico").activo(true).build(),
                CategoriaOferta.builder().nombre("Salud, Medicina y Farmacia").descripcion("Área relacionada a la salud y cuidado").activo(true).build(),
                CategoriaOferta.builder().nombre("Ingeniería Civil y Construcción").descripcion("Área de construcción e ingeniería civil").activo(true).build(),
                CategoriaOferta.builder().nombre("Recursos Humanos y Reclutamiento").descripcion("Área de gestión de talento y RRHH").activo(true).build(),
                CategoriaOferta.builder().nombre("Educación y Docencia").descripcion("Área de educación y pedagogía").activo(true).build()
        );
        
        categoriaRepository.saveAll(categorias);
        log.info("Catálogo completo de categorías insertado con éxito.");
    }
}

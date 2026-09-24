package com.elp.usuarios_service;

import com.elp.usuarios_service.model.Educacion;
import com.elp.usuarios_service.model.Empresa;
import com.elp.usuarios_service.model.Estudiante;
import com.elp.usuarios_service.model.enums.EstadoPerfil;
import com.elp.usuarios_service.service.ProfileCompletionService;
import com.elp.usuarios_service.service.ProfileCompletionService.ProfileCompletionResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ProfileCompletionServiceTest {

    private ProfileCompletionService service;

    @BeforeEach
    void setUp() {
        service = new ProfileCompletionService();
    }

    @Test
    void evaluarEstudiante_SinTituloProfesional_PuedeCumplirReglas() {
        Estudiante estudiante = new Estudiante();
        estudiante.setNombres("Juan");
        estudiante.setApellidos("Perez");
        estudiante.setDni("12345678");
        estudiante.setTelefono("987654321");
        estudiante.setUbicacion("Lima");
        estudiante.setBiografia("Bio test");
        // No title needed

        Educacion educacion = new Educacion();
        List<Educacion> educaciones = List.of(educacion);

        ProfileCompletionResult result = service.evaluarEstudiante(estudiante, educaciones, true);

        assertEquals(EstadoPerfil.COMPLETO, result.getEstado());
        assertEquals(100, result.getPorcentaje());
        assertTrue(result.getPuedeAccionar());
        assertTrue(result.getMotivosPendientes().isEmpty());
    }

    @Test
    void evaluarEstudiante_SinCvActivo_NoPuedePostular() {
        Estudiante estudiante = new Estudiante();
        estudiante.setNombres("Juan");
        estudiante.setApellidos("Perez");
        estudiante.setDni("12345678");
        estudiante.setTelefono("987654321");
        estudiante.setUbicacion("Lima");
        estudiante.setBiografia("Bio test");

        Educacion educacion = new Educacion();
        List<Educacion> educaciones = List.of(educacion);

        ProfileCompletionResult result = service.evaluarEstudiante(estudiante, educaciones, false);

        assertEquals(EstadoPerfil.INCOMPLETO, result.getEstado());
        assertFalse(result.getPuedeAccionar());
        assertTrue(result.getMotivosPendientes().contains("CV Activo"));
    }

    @Test
    void evaluarEmpresa_Incompleta_NoPuedePublicar() {
        Empresa empresa = new Empresa();
        empresa.setRuc("10101010101");
        // Falta razon social, descripcion, ubicacion, email corporativo

        ProfileCompletionResult result = service.evaluarEmpresa(empresa);

        assertEquals(EstadoPerfil.INCOMPLETO, result.getEstado());
        assertFalse(result.getPuedeAccionar());
        assertFalse(result.getMotivosPendientes().isEmpty());
    }

    @Test
    void evaluarEmpresa_Completa_PuedePublicar() {
        Empresa empresa = new Empresa();
        empresa.setRuc("10101010101");
        empresa.setRazonSocial("Mi Empresa");
        empresa.setDescripcion("Desc");
        empresa.setUbicacion("Lima");
        empresa.setEmailCorporativo("hr@empresa.com");

        ProfileCompletionResult result = service.evaluarEmpresa(empresa);

        assertEquals(EstadoPerfil.COMPLETO, result.getEstado());
        assertTrue(result.getPuedeAccionar());
        assertTrue(result.getMotivosPendientes().isEmpty());
    }
}

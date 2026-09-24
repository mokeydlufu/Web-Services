package com.elp.usuarios_service.service;

import com.elp.usuarios_service.model.Educacion;
import com.elp.usuarios_service.model.Empresa;
import com.elp.usuarios_service.model.Estudiante;
import com.elp.usuarios_service.model.enums.EstadoPerfil;
import lombok.Builder;
import lombok.Data;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

@Service
public class ProfileCompletionService {

    @Data
    @Builder
    public static class ProfileCompletionResult {
        private Integer porcentaje;
        private EstadoPerfil estado;
        private List<String> motivosPendientes;
        private Boolean puedeAccionar; // puedePostular para Estudiante, puedePublicar para Empresa
    }

    public ProfileCompletionResult evaluarEstudiante(Estudiante estudiante, List<Educacion> educaciones, boolean tieneCvActivo) {
        List<String> pendientes = new ArrayList<>();
        int completados = 0;
        int totalCriterios = 6;

        if (StringUtils.hasText(estudiante.getNombres()) && StringUtils.hasText(estudiante.getApellidos()) && StringUtils.hasText(estudiante.getDni())) {
            completados++;
        } else {
            pendientes.add("Datos personales (nombres, apellidos, DNI)");
        }

        if (StringUtils.hasText(estudiante.getTelefono())) {
            completados++;
        } else {
            pendientes.add("Teléfono");
        }

        if (StringUtils.hasText(estudiante.getUbicacion())) {
            completados++;
        } else {
            pendientes.add("Ubicación");
        }

        if (StringUtils.hasText(estudiante.getBiografia())) {
            completados++;
        } else {
            pendientes.add("Biografía");
        }

        if (educaciones != null && !educaciones.isEmpty()) {
            completados++;
        } else {
            pendientes.add("Formación académica");
        }

        if (tieneCvActivo) {
            completados++;
        } else {
            pendientes.add("CV Activo");
        }

        int porcentaje = (int) Math.round((completados / (double) totalCriterios) * 100);
        boolean cumpleMinimos = pendientes.isEmpty();

        return ProfileCompletionResult.builder()
                .porcentaje(porcentaje)
                .estado(cumpleMinimos ? EstadoPerfil.COMPLETO : EstadoPerfil.INCOMPLETO)
                .motivosPendientes(pendientes)
                .puedeAccionar(cumpleMinimos)
                .build();
    }

    public ProfileCompletionResult evaluarEmpresa(Empresa empresa) {
        List<String> pendientes = new ArrayList<>();
        int completados = 0;
        int totalCriterios = 5;

        if (StringUtils.hasText(empresa.getRuc())) {
            completados++;
        } else {
            pendientes.add("RUC");
        }

        if (StringUtils.hasText(empresa.getRazonSocial())) {
            completados++;
        } else {
            pendientes.add("Razón social");
        }

        if (StringUtils.hasText(empresa.getDescripcion())) {
            completados++;
        } else {
            pendientes.add("Descripción");
        }

        if (StringUtils.hasText(empresa.getUbicacion())) {
            completados++;
        } else {
            pendientes.add("Ubicación");
        }

        if (StringUtils.hasText(empresa.getEmailCorporativo())) {
            completados++;
        } else {
            pendientes.add("Email corporativo");
        }

        int porcentaje = (int) Math.round((completados / (double) totalCriterios) * 100);
        boolean cumpleMinimos = pendientes.isEmpty();

        // Opcionales para porcentaje extra, pero no impiden publicar
        if (StringUtils.hasText(empresa.getLogo())) porcentaje = Math.min(100, porcentaje + 5);
        if (StringUtils.hasText(empresa.getSitioWeb())) porcentaje = Math.min(100, porcentaje + 5);
        if (porcentaje >= 100 && cumpleMinimos) porcentaje = 100;

        return ProfileCompletionResult.builder()
                .porcentaje(Math.min(100, porcentaje))
                .estado(cumpleMinimos ? EstadoPerfil.COMPLETO : EstadoPerfil.INCOMPLETO)
                .motivosPendientes(pendientes)
                .puedeAccionar(cumpleMinimos)
                .build();
    }
}

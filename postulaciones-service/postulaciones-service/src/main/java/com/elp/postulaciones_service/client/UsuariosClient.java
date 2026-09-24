package com.elp.postulaciones_service.client;

import com.elp.postulaciones_service.dto.externo.PerfilEstudianteDetalleDTO;
import com.elp.postulaciones_service.dto.externo.UsuarioResumenDTO;
import com.elp.postulaciones_service.exception.ExternalServiceException;
import com.elp.postulaciones_service.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class UsuariosClient {

    private final RestClient restClient;

    @Value("${usuarios.service.url:${USUARIOS_SERVICE_URL:http://localhost:8081}}")
    private String usuariosServiceUrl;

    public String getUsuariosServiceUrl() {
        return usuariosServiceUrl;
    }

    public UsuarioResumenDTO obtenerResumenCandidato(UUID candidatoId, String jwtToken) {
        return restClient.get()
                .uri(usuariosServiceUrl + "/api/usuarios/internos/{uuid}/resumen", candidatoId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtToken)
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, (request, response) -> {
                    if (response.getStatusCode().value() == 404) {
                        throw new ResourceNotFoundException("El candidato no existe en el sistema de usuarios");
                    }
                    throw new ExternalServiceException("Error del cliente al obtener usuario: " + response.getStatusCode());
                })
                .onStatus(HttpStatusCode::is5xxServerError, (request, response) -> {
                    throw new ExternalServiceException("El servicio de usuarios no esta disponible actualmente. Por favor intente mas tarde.");
                })
                            
                .body(UsuarioResumenDTO.class);
    }

                            
    public PerfilEstudianteDetalleDTO obtenerPerfilEstudiante(UUID candidatoId, String jwtToken) {
        try {
            return restClient.get()
                    .uri(usuariosServiceUrl + "/api/usuarios/internos/{uuid}/perfil-estudiante", candidatoId)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtToken)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, resp) -> {
                        log.warn("Respuesta no exitosa al obtener perfil estudiante: {}", resp.getStatusCode());
                    })
                    .body(PerfilEstudianteDetalleDTO.class);
        } catch (Exception e) {
            log.warn("Error al consultar perfil de estudiante {}: {}", candidatoId, e.getMessage());
            return null;
        }
    }
}

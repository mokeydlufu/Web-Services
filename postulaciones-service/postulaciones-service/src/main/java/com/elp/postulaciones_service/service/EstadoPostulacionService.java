package com.elp.postulaciones_service.service;

import com.elp.postulaciones_service.exception.InvalidStateTransitionException;
import com.elp.postulaciones_service.model.enums.EstadoPostulacion;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EstadoPostulacionService {

    private final Map<EstadoPostulacion, List<EstadoPostulacion>> transicionesValidas = new HashMap<>();

    public EstadoPostulacionService() {
        // Inicializar las transiciones permitidas segun las reglas de negocio
        transicionesValidas.put(EstadoPostulacion.ENVIADA, Arrays.asList(
            EstadoPostulacion.RECIBIDA, EstadoPostulacion.EN_REVISION, EstadoPostulacion.PRESELECCIONADA, 
            EstadoPostulacion.ENTREVISTA, EstadoPostulacion.RECHAZADA, EstadoPostulacion.RETIRADA
        ));
        transicionesValidas.put(EstadoPostulacion.RECIBIDA, Arrays.asList(
            EstadoPostulacion.EN_REVISION, EstadoPostulacion.PRESELECCIONADA, EstadoPostulacion.ENTREVISTA, 
            EstadoPostulacion.RECHAZADA, EstadoPostulacion.RETIRADA
        ));
        transicionesValidas.put(EstadoPostulacion.EN_REVISION, Arrays.asList(
            EstadoPostulacion.PRESELECCIONADA, EstadoPostulacion.ENTREVISTA, EstadoPostulacion.EVALUACION, 
            EstadoPostulacion.RECHAZADA
        ));
        transicionesValidas.put(EstadoPostulacion.PRESELECCIONADA, Arrays.asList(
            EstadoPostulacion.ENTREVISTA, EstadoPostulacion.EVALUACION, EstadoPostulacion.SELECCIONADA, 
            EstadoPostulacion.RECHAZADA
        ));
        transicionesValidas.put(EstadoPostulacion.ENTREVISTA, Arrays.asList(
            EstadoPostulacion.EVALUACION, EstadoPostulacion.SELECCIONADA, EstadoPostulacion.RECHAZADA
        ));
        transicionesValidas.put(EstadoPostulacion.EVALUACION, Arrays.asList(
            EstadoPostulacion.SELECCIONADA, EstadoPostulacion.RECHAZADA
        ));
        transicionesValidas.put(EstadoPostulacion.SELECCIONADA, Arrays.asList(EstadoPostulacion.CERRADA));
        transicionesValidas.put(EstadoPostulacion.RECHAZADA, Arrays.asList(EstadoPostulacion.CERRADA));
        transicionesValidas.put(EstadoPostulacion.RETIRADA, Arrays.asList(EstadoPostulacion.CERRADA));
        transicionesValidas.put(EstadoPostulacion.CANCELADA, Arrays.asList(EstadoPostulacion.CERRADA));
        transicionesValidas.put(EstadoPostulacion.CERRADA, Arrays.asList());
    }

    public void validarTransicion(EstadoPostulacion estadoActual, EstadoPostulacion estadoNuevo) {
        if (estadoActual == estadoNuevo) {
            return;
        }
        List<EstadoPostulacion> permitidos = transicionesValidas.getOrDefault(estadoActual, Arrays.asList());
        if (!permitidos.contains(estadoNuevo)) {
            throw new InvalidStateTransitionException("No se puede pasar del estado " + estadoActual + " a " + estadoNuevo);
        }
    }
}